import React from 'react';

/**
 * LoadingState Component (Minimalist Black & White Theme)
 */
export default function LoadingState({ url }) {
  return (
    <div className="w-full max-w-5xl my-8 p-10 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center my-4">
        <div className="w-14 h-14 rounded-full border-2 border-zinc-800 border-t-white animate-spin"></div>
        <svg className="w-5 h-5 text-white absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-white mt-2">
        Analyzing Target...
      </h3>
      <p className="text-xs text-zinc-400 mt-1 max-w-md font-mono">
        Inspecting handshake parameters for <span className="text-white font-bold">{url || 'target host'}</span>.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mt-6">
        {[
          'Client Hello',
          'Server Hello',
          'Cert Validation',
          'Key Exchange',
        ].map((phase, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2.5 bg-black border border-zinc-800 rounded-lg text-left"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span className="text-[11px] font-mono text-zinc-300">{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
