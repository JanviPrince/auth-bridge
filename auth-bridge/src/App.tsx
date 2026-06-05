import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  UserPlus, 
  LogIn, 
  Database, 
  Terminal as TerminalIcon, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Network
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ApiTerminal from "./components/ApiTerminal";
import DbExplorer from "./components/DbExplorer";
import DashboardView from "./components/DashboardView";
import { User, ApiLog, DatabaseState } from "./types";

export default function App() {
  // Auth Form State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");

  // UI state
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loggedSuccessMsg, setLoggedSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication Session
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  // Database Explorer and Live Logs state
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isPolling, setIsPolling] = useState(true);

  // Fetch log lines and MongoDB documents
  const fetchDbState = async () => {
    setIsLoadingDb(true);
    try {
      const response = await fetch("/api/db/inspect");
      if (response.ok) {
        const data = await response.json();
        setDbState(data);
      }
    } catch (err) {
      console.error("Failed to read database inspect stream", err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  // Perform token-based profile recovery
  const checkActiveSession = async (currToken: string) => {
    setIsCheckingSession(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentUser(data.user);
        } else {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    } finally {
      setIsCheckingSession(false);
    }
  };

  // Periodic polling for realtime feeling
  useEffect(() => {
    fetchDbState();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 1500);
    return () => clearInterval(interval);
  }, [isPolling]);

  useEffect(() => {
    if (token) {
      checkActiveSession(token);
    }
  }, [token]);

  // Form Client-side Validations
  const validateForm = (): boolean => {
    const currentErrors: string[] = [];
    setErrors([]);

    if (isLoginMode) {
      if (!emailOrUsername.trim()) {
        currentErrors.push("Please provide your Email or Username.");
      }
      if (!password) {
        currentErrors.push("Please specify your current credentials password.");
      }
    } else {
      if (!name.trim()) {
        currentErrors.push("Display Name is required.");
      }
      if (!username.trim()) {
        currentErrors.push("Username is required.");
      } else {
        if (username.length < 3 || username.length > 20) {
          currentErrors.push("Username must be between 3 and 20 characters.");
        }
      }
      if (!email.trim()) {
        currentErrors.push("Email address is required.");
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          currentErrors.push("The format of email address is invalid.");
        }
      }
      if (!password) {
        currentErrors.push("Account Password is required.");
      } else if (password.length < 6) {
        currentErrors.push("Password must be at least 6 characters long.");
      }
    }

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
      return false;
    }
    return true;
  };

  // Submit Sign Up Form
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || "Sign up completed successfully! You can login now.");
        // Clear sign up form
        setUsername("");
        setEmail("");
        setPassword("");
        setName("");
        setIsLoginMode(true); // switch to login immediately for students convenience
        // Populate inputs so users do not have to type twice
        setEmailOrUsername(email || username);
        // Refresh MongoDB documents representation
        fetchDbState();
      } else {
        setErrors([data.message || "An unexpected registration conflict occurred."]);
      }
    } catch {
      setErrors(["The Node.js auth server is unreachable. Ensure the backend is active."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Log In Form
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors([]);
    setLoggedSuccessMsg(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrUsername,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("auth_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setLoggedSuccessMsg(data.message || "Authentication credentials verified!");
        setPassword(""); // Clear password field
        fetchDbState();
      } else {
        setErrors([data.message || "Verification failed: Check account and password details."]);
      }
    } catch {
      setErrors(["The Node.js auth server is unreachable. Please verify system logs."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setCurrentUser(null);
    setLoggedSuccessMsg(null);
    setSuccessMsg(null);
    setEmailOrUsername("");
    setPassword("");
  };

  // Wipe whole database and fresh start
  const handleResetDb = async () => {
    const confirmChoice = window.confirm(
      "Are you sure you want to restore the MongoDB database emulator snapshot to empty? This will clear all existing users and reset session states."
    );
    if (!confirmChoice) return;

    try {
      const response = await fetch("/api/db/reset", { method: "POST" });
      const data = await response.json();
      if (response.ok && data.success) {
        handleLogout();
        alert(data.message);
        fetchDbState();
        fetchLogs();
      }
    } catch {
      alert("Failed to reset backend database state.");
    }
  };

  return (
    <div id="root-theme" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-505 selection:text-white">
      {/* Dynamic Header */}
      <header className="bg-slate-950/70 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/10">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Auth Bridge Studio <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 font-mono">v1.2.0</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Connecting React with Node.js & MongoDB</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg select-none">
              <Network className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              API: <span className="text-slate-200 font-mono font-bold ml-1">/api/auth/*</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTIVE INTERACTIVE WORKSPACE */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Step 4 Lab Challenge</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">System Authentication Terminal</h2>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Understand stateful frontend-backend security. Sign up to write validated hashes into MongoDB, log in to verify session credentials, and inspect actual request structures.
            </p>
          </div>

          {/* Authentic Core Interface Card */}
          <AnimatePresence mode="wait">
            {currentUser ? (
              <DashboardView 
                key="authenticated"
                user={currentUser} 
                token={token} 
                onLogout={handleLogout} 
                onLoggedSuccessMsg={loggedSuccessMsg}
              />
            ) : (
              <motion.div
                key="unauthenticated"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-800 space-y-6 relative overflow-hidden"
              >
                {/* Background graphic highlight */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl transform translate-x-3 -translate-y-3 pointer-events-none"></div>

                {/* Switcher Tab */}
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
                  <button
                    onClick={() => {
                      setIsLoginMode(true);
                      setErrors([]);
                      setSuccessMsg(null);
                    }}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                      isLoginMode 
                        ? "bg-white text-slate-800 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>User Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLoginMode(false);
                      setErrors([]);
                      setSuccessMsg(null);
                    }}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                      !isLoginMode 
                        ? "bg-white text-slate-800 shadow-sm shadow-indigo-100" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Database Register (Signup)</span>
                  </button>
                </div>

                {/* Message display toasts */}
                {errors.length > 0 && (
                  <div className="bg-rose-50 border-s-4 border-rose-500 p-3 rounded-lg text-rose-800 text-xs text-left space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>Input Validation Failure:</span>
                    </div>
                    <ul className="list-disc pl-5 font-medium space-y-0.5">
                      {errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-50 border-s-4 border-emerald-500 p-3 rounded-lg text-emerald-800 text-xs text-left flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Document Insert success!</span>
                      <span className="font-medium">{successMsg}</span>
                    </div>
                  </div>
                )}

                {/* Direct Instruction Box */}
                {!isLoginMode && (
                  <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-3 flex items-start space-x-2 text-[11px] text-amber-900 text-left">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-normal font-medium">
                      <strong>MongoDB Storage Goal:</strong> Complete registration below. Upon confirmation, data schemas are structured on the Express runtime, password fields are cryptographically hashed, and written into the <code className="bg-amber-100 px-1 rounded text-amber-800 font-mono">db.json</code> collection.
                    </p>
                  </div>
                )}

                {/* Authentic Input Forms */}
                <form onSubmit={isLoginMode ? handleLogin : handleSignup} className="space-y-4 text-left">
                  {!isLoginMode && (
                    <div className="space-y-1.5">
                      <label htmlFor="name-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Display Name / Full Name
                      </label>
                      <input
                        id="name-input"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2 z-10 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  )}

                  {!isLoginMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="username-signup" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Username
                        </label>
                        <input
                          id="username-signup"
                          type="text"
                          placeholder="johndoe12"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="email-signup" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Email Address
                        </label>
                        <input
                          id="email-signup"
                          type="email"
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>
                  )}

                  {isLoginMode && (
                    <div className="space-y-1.5">
                      <label htmlFor="email-username-login" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Username or Email Address
                      </label>
                      <input
                        id="email-username-login"
                        type="text"
                        placeholder="john@example.com or johndoe12"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="password-field" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Password
                      </label>
                      {!isLoginMode && (
                        <span className="text-[10px] text-slate-400 font-medium">Min. 6 alphanumeric chars</span>
                      )}
                    </div>
                    <input
                      id="password-field"
                      type="password"
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>

                  <button
                    id="submit-auth-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-colors shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center space-x-2 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Communicating with API Server...</span>
                      </>
                    ) : (
                      <>
                        {isLoginMode ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        <span>{isLoginMode ? "Authenticate credentials & Enter" : "Submit Encrypted Request to MongoDB"}</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Sandbox Guide Box */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-left">
            <h4 className="font-bold text-slate-200 text-xs flex items-center mb-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400 mr-1.5" />
              Coursework & Design Integration Instructions:
            </h4>
            <div className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
              <p>
                In <strong>Week 4 - Connect Frontend & Backend</strong>, the critical takeaway is understanding dynamic state interaction.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-slate-300">Signup Form Validation:</strong> Handlers check field constraints locally before making any asynchronous API payload dispatches.
                </li>
                <li>
                  <strong className="text-slate-300">Database Storage:</strong> Node&apos;s cryptographically secure signature generates a custom identifier document representing the write into MongoDB.
                </li>
                <li>
                  <strong className="text-slate-300">AJAX Communications:</strong> Modern <code className="bg-slate-900 px-1 py-0.2 rounded font-mono text-xs">fetch()</code> dispatches query JSON payloads and logs response headers asynchronously.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REALTTIME DB LISTER & EXPRESS TRAFFIC TERMINAL */}
        <div className="lg:col-span-6 space-y-6">
          {/* MongoDB Explorer Container */}
          <DbExplorer 
            dbState={dbState} 
            onRefresh={fetchDbState} 
            onResetDb={handleResetDb} 
            isLoading={isLoadingDb} 
          />

          {/* realtime express router logging stream console */}
          <ApiTerminal 
            logs={logs} 
            onClearLogs={async () => {
              setLogs([]);
            }} 
            isPolling={isPolling} 
            setIsPolling={setIsPolling}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/40 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2.5">
          <p className="font-medium">Designed for React & Node.js Week 4 &middot; MongoDB State Verification Core</p>
          <p className="font-mono text-[10px] text-slate-600">Active Node Port: 3000 &bull; SSL Encrypted Sandbox Environment Mode</p>
        </div>
      </footer>
    </div>
  );
}
