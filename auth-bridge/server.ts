import express from "express";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

// MongoDB User Schema
interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
}

interface IUserDocument extends mongoose.Document, IUser {}

const userSchema = new mongoose.Schema<IUserDocument>({
  username:     { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name:         { type: String, required: true },
  createdAt:    { type: Date, default: Date.now }
});

const UserModel = (mongoose.models.User as mongoose.Model<IUserDocument>) || mongoose.model<IUserDocument>("User", userSchema);

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/authbridge";

async function connectMongoDB() {
  try {
    await mongoose.connect(mongoUri);
    const connectionName = mongoUri.startsWith("mongodb+srv:") ? "MongoDB Atlas" : "MongoDB";
    console.log(`✅ Connected to ${connectionName}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  payload: any;
  response: any;
}

const PORT = 3000;
const systemLogs: ApiLog[] = [];

function addSystemLog(log: Omit<ApiLog, "id">) {
  const newLog = { ...log, id: crypto.randomUUID() };
  systemLogs.unshift(newLog);
  if (systemLogs.length > 100) systemLogs.pop();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Request logger middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    let responseBody: any = null;

    res.send = function (body) {
      responseBody = body;
      return originalSend.apply(this, arguments as any);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      const url = req.originalUrl || req.url;
      if (!url.startsWith("/api/logs") && !url.includes(".")) {
        let parsedResponse = responseBody;
        try { parsedResponse = JSON.parse(responseBody); } catch {}
        const sanitizedBody = req.body ? { ...req.body } : {};
        if (sanitizedBody.password) sanitizedBody.password = "********";
        addSystemLog({ timestamp: new Date().toISOString(), method: req.method, url, statusCode: res.statusCode, duration, payload: sanitizedBody, response: parsedResponse });
      }
    });
    next();
  });

  // Get logs
  app.get("/api/logs", (req, res) => {
    res.json({ logs: systemLogs });
  });

  // DB inspect — reads from MongoDB Atlas
  app.get("/api/db/inspect", async (req, res) => {
    try {
      const users = await UserModel.find({});
      res.json({
        dbType: mongoUri.startsWith("mongodb+srv:") ? "MongoDB Atlas (Online Cloud)" : "MongoDB Local",
        collectionName: "users",
        documentCount: users.length,
        documents: users.map(u => ({
          _id: u._id,
          username: u.username,
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          createdAt: u.createdAt
        })),
        schema: {
          _id: "ObjectId (Unique identifier)",
          username: "String (Unique, 3-20 characters)",
          email: "String (Unique, Regex validated)",
          passwordHash: "String (SHA-256 hashed)",
          name: "String (Display name)",
          createdAt: "ISODate (Timestamp)"
        }
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch from MongoDB" });
    }
  });

  // DB reset
  app.post("/api/db/reset", async (req, res) => {
    try {
      await UserModel.deleteMany({});
      systemLogs.length = 0;
      res.json({ success: true, message: "MongoDB collection cleared successfully." });
    } catch {
      res.status(500).json({ success: false, message: "Failed to reset database." });
    }
  });

  // SIGNUP
  app.post("/api/auth/signup", async (req, res) => {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name)
      return res.status(400).json({ success: false, message: "All fields are required." });

    if (username.length < 3 || username.length > 20)
      return res.status(400).json({ success: false, message: "Username must be 3-20 characters." });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ success: false, message: "Invalid email format." });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    try {
      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
      const newUser = await UserModel.create({ username, email, passwordHash, name });
      return res.status(201).json({
        success: true,
        message: "User registered and stored in MongoDB Atlas!",
        user: { id: newUser._id, username: newUser.username, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt }
      });
    } catch (err: any) {
      if (err.code === 11000)
        return res.status(409).json({ success: false, message: "Username or email already exists." });
      return res.status(500).json({ success: false, message: "Server error during signup." });
    }
  });

  // LOGIN
  app.post("/api/auth/login", async (req, res) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password)
      return res.status(400).json({ success: false, message: "All fields are required." });

    try {
      const user = await UserModel.findOne({
        $or: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() }
        ]
      });

      if (!user)
        return res.status(401).json({ success: false, message: "User not found." });

      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
      if (passwordHash !== user.passwordHash)
        return res.status(401).json({ success: false, message: "Incorrect password." });

      const tokenPayload = Buffer.from(JSON.stringify({ id: user._id, username: user.username, email: user.email })).toString("base64");
      const signature = crypto.createHmac("sha256", "session-secret-key-1337").update(tokenPayload).digest("hex");
      const token = `${tokenPayload}.${signature}`;

      return res.status(200).json({
        success: true,
        message: "Login successful! Session token generated.",
        token,
        user: { id: user._id, username: user.username, email: user.email, name: user.name, createdAt: user.createdAt }
      });
    } catch {
      return res.status(500).json({ success: false, message: "Server error during login." });
    }
  });

  // AUTH ME
  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ success: false, message: "Missing token." });

    const token = authHeader.split(" ")[1];
    const [payloadBase64, signature] = token.split(".");

    if (!payloadBase64 || !signature)
      return res.status(401).json({ success: false, message: "Invalid token format." });

    const expectedSignature = crypto.createHmac("sha256", "session-secret-key-1337").update(payloadBase64).digest("hex");
    if (signature !== expectedSignature)
      return res.status(401).json({ success: false, message: "Token verification failed." });

    try {
      const decoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
      const user = await UserModel.findById(decoded.id);
      if (!user)
        return res.status(404).json({ success: false, message: "User not found." });

      return res.status(200).json({
        success: true,
        user: { id: user._id, username: user.username, email: user.email, name: user.name, createdAt: user.createdAt }
      });
    } catch {
      return res.status(401).json({ success: false, message: "Token decode failed." });
    }
  });

  // Connect to MongoDB before starting the HTTP server.
  await connectMongoDB();

  // Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AUTH-BRIDGE] Server running at http://localhost:${PORT}`);
  });
}

startServer();