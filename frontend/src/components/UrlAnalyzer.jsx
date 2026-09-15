import React, { useState } from 'react';

/**
 * UrlAnalyzer Component (Ultra-Minimalist Black & White Theme)
 * Full-width responsive URL input with HTTPS normalization, validation & quick presets.
 */
export default function UrlAnalyzer({ onAnalyze, isLoading }) {
  const [inputUrl, setInputUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const normalizeAndValidate = (rawUrl) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a target website URL.' };
    }

    let formatted = trimmed;

    if (formatted.startsWith('http://')) {
      return {
        isValid: false,
        error: 'Only HTTPS endpoints are supported for TLS/SSL handshake analysis. Please use https://',
      };
    }

    if (!formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }

    try {
      const parsed = new URL(formatted);
      if (parsed.protocol !== 'https:') {
        return { isValid: false, error: 'URL must start with https://' };
      }
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return { isValid: false, error: 'Please enter a valid domain name (e.g., example.com).' };
      }
      return { isValid: true, url: formatted, error: '' };
    } catch {
      return { isValid: false, error: 'Invalid URL format. Please enter a valid URL like https://example.com' };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    const result = normalizeAndValidate(inputUrl);
    if (!result.isValid) {
      setValidationError(result.error);
      return;
    }

    setValidationError('');
    setInputUrl(result.url);
    onAnalyze(result.url);
  };

  const handleQuickPreset = (presetUrl) => {
    setInputUrl(presetUrl);
    setValidationError('');
    onAnalyze(presetUrl);
  };

  return (
    <div className="w-full max-w-5xl bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label htmlFor="url-input" className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Target HTTPS Endpoint
          </label>
          <span className="text-[11px] font-mono text-zinc-500">TLS 1.2 / 1.3</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. https://example.com or example.com"
              disabled={isLoading}
              className={`w-full pl-11 pr-4 py-3.5 bg-black border ${
                validationError ? 'border-white focus:ring-1 focus:ring-white' : 'border-zinc-800 focus:border-white focus:ring-1 focus:ring-white'
              } rounded-xl text-white placeholder-zinc-600 text-sm font-mono focus:outline-none transition-all disabled:opacity-50`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3.5 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 text-zinc-200 text-xs font-mono mt-1 bg-black border border-zinc-700 px-3.5 py-2.5 rounded-lg">
            <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick Test Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/80 text-xs font-mono">
          <span className="text-zinc-500">Presets:</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickPreset('https://example.com')}
            className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            example.com
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickPreset('https://github.com')}
            className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            github.com
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickPreset('https://expired-rsa-dv.ssl.badssl.com')}
            className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            expired.badssl.com (Error Test)
          </button>
        </div>
      </form>
    </div>
  );
}
