import { Database, RefreshCw, Layers, ShieldAlert, Trash2, HelpCircle } from "lucide-react";
import { DatabaseState } from "../types";

interface DbExplorerProps {
  dbState: DatabaseState | null;
  onRefresh: () => void;
  onResetDb: () => void;
  isLoading: boolean;
}

export default function DbExplorer({ dbState, onRefresh, onResetDb, isLoading }: DbExplorerProps) {
  return (
    <div id="db-explorer" className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col h-[520px]">
      {/* Database Explorer Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center">
              MongoDB Instance Viewer
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Database: <span className="text-slate-600 font-mono">auth_demo_db</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Collections"
            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onResetDb}
            title="Wipe MongoDB and Start Fresh"
            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded border border-rose-100 hover:border-rose-300 transition-all font-semibold flex items-center space-x-1 text-xs px-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset DB</span>
          </button>
        </div>
      </div>

      {/* Explorer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Statistics bar */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">CONNECTION TYPE</span>
            <span className="text-xs font-semibold text-slate-700 font-mono">
              {dbState?.dbType.includes("Atlas") ? "☁️ MongoDB Atlas" : "📁 Local JSON Emulator"}
            </span>
          </div>
          <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-center">
            <span className="text-[10px] text-indigo-500 block uppercase font-mono">TOTAL DOCUMENTS</span>
            <span className="text-sm font-extrabold text-indigo-700">
              {dbState?.documentCount ?? 0} { (dbState?.documentCount ?? 0) === 1 ? "User" : "Users" }
            </span>
          </div>
        </div>

        {/* Database Collection Section */}
        <div>
          <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <Layers className="w-3.5 h-3.5 mr-1" />
            Collection: <span className="text-slate-600 lowercase font-mono ml-1">users</span>
          </div>

          {/* Database Listings */}
          {!dbState || dbState.documents.length === 0 ? (
            <div className="border border-dashed border-slate-200 p-8 text-center rounded-xl text-slate-400 space-y-2">
              <Database className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
              <p className="text-xs">No entries found in the MongoDB <code className="font-mono bg-slate-100 px-1 rounded text-red-500">users</code> collection.</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                Sign up via the authentication card on the left. The Express backend will invoke password hashing and insert a new document record.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {dbState.documents.map((doc, idx) => (
                <div
                  key={doc._id}
                  className="bg-slate-900 border border-slate-800 text-slate-300 p-3 rounded-lg shadow-inner relative hover:border-indigo-500/40 transition-all"
                >
                  <span className="absolute top-2 right-2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 select-none">
                    Document #{idx + 1}
                  </span>
                  
                  {/* Field entries resembling query display */}
                  <div className="space-y-1 text-[11px] leading-relaxed">
                    <div className="truncate">
                      <span className="text-violet-400">_id:</span> <span className="text-yellow-300">ObjectId(&quot;{doc._id.substring(0,24)}&quot;)</span>
                    </div>
                    <div className="truncate">
                      <span className="text-sky-400">name:</span> <span className="text-emerald-300">&quot;{doc.name}&quot;</span>
                    </div>
                    <div className="truncate">
                      <span className="text-sky-400">username:</span> <span className="text-emerald-300">&quot;{doc.username}&quot;</span>
                    </div>
                    <div className="truncate">
                      <span className="text-sky-400">email:</span> <span className="text-emerald-300">&quot;{doc.email}&quot;</span>
                    </div>
                    <div className="truncate flex items-start">
                      <span className="text-sky-400 whitespace-nowrap">passwordHash:</span>{" "}
                      <span className="text-amber-300 text-[10px] break-all max-w-[200px] inline-block font-mono bg-slate-950 px-1 ml-1 rounded">
                        &quot;{doc.passwordHash}&quot;
                      </span>
                    </div>
                    <div className="truncate">
                      <span className="text-sky-400">createdAt:</span> <span className="text-yellow-400">ISODate(&quot;{doc.createdAt}&quot;)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Database validation scheme helper */}
        <div className="border border-slate-100 bg-slate-50 rounded-lg p-3">
          <h4 className="font-semibold text-slate-700 text-xs flex items-center mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 mr-1.5" />
            MongoDB schema validation rules:
          </h4>
          <div className="font-mono text-[10px] leading-snug text-slate-600 bg-white border border-slate-200 p-2 rounded max-h-40 overflow-y-auto">
            {dbState ? (
              Object.entries(dbState.schema).map(([field, type]) => (
                <div key={field} className="py-0.5 border-b border-dashed border-slate-100 last:border-0">
                  <span className="text-violet-600 font-semibold">{field}</span>: <span className="text-slate-500">{type}</span>
                </div>
              ))
            ) : (
              <span>Loading schema contracts...</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 hover:bg-slate-100/50 transition-colors border-t border-slate-200 px-4 py-2.5 flex items-center text-[10px] text-slate-500 space-x-1 select-none">
        <HelpCircle className="w-3 h-3 text-indigo-500 flex-shrink-0" />
        <span>Passwords are securely transformed using the cryptographic SHA-256 algorithm on the Express backend before write operations.</span>
      </div>
    </div>
  );
}
