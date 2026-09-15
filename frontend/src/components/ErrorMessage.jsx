import React from 'react';

/**
 * ErrorMessage Component (Minimalist Black & White Theme)
 */
export default function ErrorMessage({ error, code, targetUrl, onRetry, isMock }) {
  return (
    <div className="w-full max-w-5xl my-8 p-6 bg-black border border-zinc-800 rounded-2xl">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white font-mono">
              Analysis Request Failed
            </h3>
            {code && (
              <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-[11px] rounded">
                {code}
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-300 mt-2 font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            {error || 'An unexpected network error occurred while connecting to the TLS analysis service.'}
          </p>

          {targetUrl && (
            <p className="text-[11px] text-zinc-500 mt-2 font-mono">
              Target: <span className="text-zinc-300">{targetUrl}</span>
            </p>
          )}

          {isMock && (
            <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
              <span>&bull; Demonstration mock error fixture loaded.</span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retry Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
