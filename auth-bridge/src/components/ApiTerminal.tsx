import { useState } from "react";
import { Terminal, RefreshCw, ChevronDown, ChevronUp, Trash2, Globe, Clock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ApiLog } from "../types";

interface ApiTerminalProps {
  logs: ApiLog[];
  onClearLogs: () => void;
  isPolling: boolean;
  setIsPolling: (polling: boolean) => void;
}

export default function ApiTerminal({ logs, onClearLogs, isPolling, setIsPolling }: ApiTerminalProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-400 bg-emerald-950/50 border-emerald-500/20";
    if (status >= 400 && status < 500) return "text-amber-400 bg-amber-950/50 border-amber-500/20";
    return "text-rose-400 bg-rose-950/50 border-rose-500/20";
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET": return "text-sky-400 font-bold";
      case "POST": return "text-violet-400 font-bold";
      case "DELETE": return "text-rose-500 font-bold";
      case "SYSTEM": return "text-amber-400 font-semibold";
      default: return "text-slate-400";
    }
  };

  return (
    <div id="api-terminal" className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[480px]">
      {/* Terminal Title Bar */}
      <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/85 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/85 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/85 inline-block"></span>
          </div>
          <span className="text-slate-400 text-xs font-semibold pl-2">|</span>
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-200 font-mono text-xs font-semibold">express-server-traffic.log</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Polling indicator toggler */}
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md font-mono transition-all ${
              isPolling
                ? "bg-emerald-950/50 border border-emerald-500/30 text-emerald-400"
                : "bg-slate-800 border border-slate-700 text-slate-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
            <span>{isPolling ? "LIVE FEED" : "PAUSED"}</span>
          </button>

          <button
            onClick={onClearLogs}
            title="Clear Feed Logs"
            className="p-1 px-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Logs List */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 select-text custom-scrollbar">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-10">
            <Globe className="w-8 h-8 text-slate-700 animate-pulse" />
            <p className="font-mono text-center max-w-xs text-xs">
              No HTTP traffic logged yet. Submit a signup, login, or inspect request above to capture realtime backend data.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className={`border rounded-lg overflow-hidden transition-all duration-150 ${
                  isExpanded ? "border-slate-700 bg-slate-950/70" : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/40"
                }`}
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>
                    <span className="text-slate-300 truncate max-w-[200px] sm:max-w-xs md:max-w-md font-medium text-[11px] leading-none">
                      {log.url}
                    </span>
                    {log.statusCode !== undefined && (
                      <span className={`px-1.5 py-0.2 select-none font-bold rounded text-[10px] border ${getStatusColor(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-[10px] whitespace-nowrap text-slate-500 flex items-center">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      {log.duration}ms
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-slate-800 bg-slate-950/90 text-[11px]"
                    >
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                        {/* Request block */}
                        <div>
                          <div className="text-slate-400 font-bold pb-1 text-[10px] tracking-wider uppercase flex items-center">
                            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></span>
                            Request Headers & Body
                          </div>
                          <pre className="text-blue-300 p-2 bg-slate-900 border border-slate-800 rounded overflow-x-auto max-h-48 text-[11px]">
                            {JSON.stringify(
                              {
                                method: log.method,
                                path: log.url,
                                origin: window.location.origin,
                                "content-type": "application/json",
                                payload: log.payload,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>

                        {/* Response block */}
                        <div className="pt-3 md:pt-0 md:pl-3">
                          <div className="text-slate-400 font-bold pb-1 text-[10px] tracking-wider uppercase flex items-center">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                            ResponsePayload JSON
                          </div>
                          <pre className="text-emerald-300 p-2 bg-slate-900 border border-slate-800 rounded overflow-x-auto max-h-48 text-[11px]">
                            {JSON.stringify(log.response || { status: "Empty response" }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-slate-950 px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800 flex justify-between items-center">
        <span>Connected Host: 0.0.0.0:3000 (Local Express DevServer)</span>
        <span className="flex items-center text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1 animate-pulse" />
          JWT Verification Key Loaded
        </span>
      </div>
    </div>
  );
}
