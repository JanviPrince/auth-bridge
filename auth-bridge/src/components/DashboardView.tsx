import { useState, useEffect } from "react";
import { LogOut, User as UserIcon, ShieldCheck, Cpu, Code2, AlertTriangle, Play, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

interface DashboardViewProps {
  key?: string;
  user: User;
  token: string | null;
  onLogout: () => void;
  onLoggedSuccessMsg: string | null;
}

export default function DashboardView({ user, token, onLogout, onLoggedSuccessMsg }: DashboardViewProps) {
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  // Parse and split the crypto JWT
  const splitToken = token ? token.split(".") : [];
  const payloadBase64 = splitToken[0] || "";
  const signatureHex = splitToken[1] || "";

  let decodedPayload = {};
  try {
    if (payloadBase64) {
      decodedPayload = JSON.parse(atob(payloadBase64));
    }
  } catch {
    decodedPayload = { error: "Failed to parse JWT payload segment" };
  }

  // Trigger standard fetch to verify authorization headers dynamically
  const testPrivateRoute = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestSuccess(null);

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setTestResult(data);
      setTestSuccess(response.ok);
    } catch (err: any) {
      setTestResult({ error: err.message || "Failed to contact Express endpoint." });
      setTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-6"
    >
      {/* Alert toast for login success */}
      {onLoggedSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs text-left"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{onLoggedSuccessMsg}</span>
        </motion.div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full select-none">
              Role: Authorized Client
            </span>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{user.name}</h2>
            <p className="text-xs text-slate-500">@{user.username} &bull; {user.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold tracking-wide transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>

      {/* JWT Anatomy Decoder */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
          <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
          <span>Decoded Security Auth Token (JWT)</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Your credentials were encoded as a base64 signature standard token. Here is what is stored inside your browser&apos;s localStorage:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* JWT Base64 */}
          <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-3.5 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono tracking-wider">RAW ENCODED KEY</span>
            <div className="text-[10px] font-mono break-all bg-slate-900 text-amber-300 p-2.5 rounded border border-slate-800 max-h-24 overflow-y-auto leading-normal">
              {token}
            </div>
          </div>

          {/* JWT JSON claims */}
          <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-3.5 space-y-2">
            <span className="text-[10px] font-bold text-indigo-500 block uppercase font-mono tracking-wider">DECODED TOKEN PAYLOAD CLAIMS (Client Data)</span>
            <pre className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2.5 rounded border border-slate-800 max-h-24 overflow-y-auto">
              {JSON.stringify(decodedPayload, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Interactive API Protected Route Sandbox */}
      <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 flex flex-col space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-xs flex items-center">
              <Cpu className="w-4 h-4 text-emerald-500 mr-1.5" />
              Demo 2: Authenticated Protected Route Tester
            </h4>
            <p className="text-[11px] text-slate-500 text-left">
              Click test to issue a secure AJAX query using standard Axios/Fetch matching Bearer Authorization.
            </p>
          </div>

          <button
            onClick={testPrivateRoute}
            disabled={isTesting}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            <span>{isTesting ? "Validating..." : "Query API"}</span>
          </button>
        </div>

        {/* Display Sandbox Response logs */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-lg text-left overflow-hidden ${
              testSuccess ? "border-emerald-200 bg-emerald-50/20" : "border-rose-200 bg-rose-50/20"
            }`}
          >
            <div className={`p-2 font-semibold text-[10px] font-mono flex items-center justify-between border-b ${
              testSuccess ? "text-emerald-700 border-emerald-200 bg-emerald-50/65" : "text-rose-700 border-rose-200 bg-rose-50/65"
            }`}>
              <span>GET /api/auth/me &bull; {testSuccess ? "Authorization Success" : "Validation Rejected"}</span>
              <span className="bg-slate-900 text-white px-1.5 py-0.2 rounded font-bold">{testSuccess ? "200 OK" : "401 Failure"}</span>
            </div>
            
            <div className="p-3 text-[10px] font-mono grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 font-bold block pb-1">HEADERS APPLIED:</span>
                <pre className="bg-slate-900 text-indigo-300 p-2 rounded max-h-24 overflow-x-auto border border-slate-800">
                  {JSON.stringify(
                    {
                      "Accept": "application/json",
                      "Authorization": `Bearer [base64_claims_token]`,
                      "User-Agent": "Browser Client / Axios",
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
              <div>
                <span className="text-slate-400 font-bold block pb-1">JSON RESPONSE RECEIVED:</span>
                <pre className={`p-2 rounded max-h-24 overflow-x-auto border ${
                  testSuccess ? "bg-slate-900 border-slate-800 text-emerald-400" : "bg-slate-900 border-slate-800 text-rose-400"
                }`}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tutorial Hint */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-start space-x-2 text-[10px] text-slate-500">
        <Code2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <p className="text-left leading-normal">
          <strong>Understanding the Flow:</strong> The authentication token is retrieved from the DB verification result and stored locally. Secure API calls dynamically forward this key in request authorization headers. The Express backend uses cryptographic checksum checks to admit or refuse requests.
        </p>
      </div>
    </motion.div>
  );
}
