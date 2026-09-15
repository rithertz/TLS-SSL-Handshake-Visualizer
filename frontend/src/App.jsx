import React, { useState } from 'react';
import UrlAnalyzer from './components/UrlAnalyzer';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import ErrorMessage from './components/ErrorMessage';
import { analyzeUrl } from './services/api';

/**
 * Main Application Shell (Full-Width Responsive Black & White Minimalist Layout)
 */
export default function App() {
  const [status, setStatus] = useState('idle');
  const [currentUrl, setCurrentUrl] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [errorDetails, setErrorDetails] = useState({ message: '', code: '' });
  const [isMockResponse, setIsMockResponse] = useState(false);

  const handleAnalyze = async (targetUrl) => {
    setCurrentUrl(targetUrl);
    setStatus('loading');
    setAnalysisData(null);
    setErrorDetails({ message: '', code: '' });

    const result = await analyzeUrl(targetUrl);

    if (result.ok) {
      setAnalysisData(result.data);
      setIsMockResponse(!!result.isMock);
      setStatus('success');
    } else {
      setErrorDetails({
        message: result.error || 'Failed to complete TLS security analysis.',
        code: result.code || 'ERR_ANALYSIS_FAILED',
      });
      setIsMockResponse(!!result.isMock);
      setStatus('error');
    }
  };

  const handleRetry = () => {
    if (currentUrl) {
      handleAnalyze(currentUrl);
    } else {
      setStatus('idle');
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col font-sans">
      {/* 100% Full-Width Header */}
      <header className="w-full bg-black border-b border-zinc-800 py-4 px-4 sm:px-8 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none m-0">
                TLS/SSL Handshake Visualizer &amp; Website Security Analyzer
              </h1>
              <p className="text-[11px] text-zinc-500 font-mono mt-1 m-0">
                Computer Networks Project Dashboard
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              API Status: Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Body (Stretches Full Width & Centered Work Container) */}
      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col items-center">
        <UrlAnalyzer onAnalyze={handleAnalyze} isLoading={status === 'loading'} />

        {status === 'idle' && <EmptyState />}

        {status === 'loading' && <LoadingState url={currentUrl} />}

        {status === 'error' && (
          <ErrorMessage
            error={errorDetails.message}
            code={errorDetails.code}
            targetUrl={currentUrl}
            onRetry={handleRetry}
            isMock={isMockResponse}
          />
        )}

        {status === 'success' && analysisData && (
          <div className="w-full max-w-5xl mx-auto my-8 space-y-6">
            {isMockResponse && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 flex items-center justify-between font-mono">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mock API Fallback Active (Backend offline or unreachable)
                </span>
                <span className="text-[10px] text-zinc-500">Fixtures Loaded</span>
              </div>
            )}

            {/* Analysis Result Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div>
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Analysis Target</span>
                  <h2 className="text-xl font-bold font-mono text-white mt-1 m-0">{analysisData.target}</h2>
                  <p className="text-xs text-zinc-500 mt-1 m-0 font-mono">
                    Timestamp: {new Date(analysisData.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-black border border-zinc-800 px-5 py-2.5 rounded-xl text-center">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase">Grade</div>
                    <div className="text-2xl font-black text-white font-mono">{analysisData.grade || 'A+'}</div>
                  </div>
                  <div className="bg-black border border-zinc-800 px-5 py-2.5 rounded-xl text-center">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase">Score</div>
                    <div className="text-2xl font-black text-white font-mono">{analysisData.security_score}/100</div>
                  </div>
                </div>
              </div>

              {/* Protocol & Cipher */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-black p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 font-mono">TLS Version</span>
                  <p className="text-sm font-semibold text-white font-mono mt-1 m-0">{analysisData.tls_version}</p>
                </div>
                <div className="bg-black p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 font-mono">Cipher Suite</span>
                  <p className="text-xs font-semibold text-white font-mono mt-1 m-0 truncate">{analysisData.cipher_suite}</p>
                </div>
              </div>

              {/* Certificate */}
              {analysisData.certificate && (
                <div className="mt-4 bg-black p-4 rounded-xl border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span>Certificate Authority</span>
                    <span className="text-white font-medium">Valid ({analysisData.certificate.days_until_expiration} days left)</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono truncate">{analysisData.certificate.issuer}</p>
                </div>
              )}

              {/* Handshake Protocol Trace */}
              {analysisData.handshake_steps && (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <h4 className="text-xs font-mono uppercase text-zinc-400 mb-3">Handshake Protocol Trace</h4>
                  <div className="space-y-2">
                    {analysisData.handshake_steps.map((step) => (
                      <div key={step.step} className="flex items-center justify-between p-3 bg-black border border-zinc-800 rounded-lg text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-white font-bold flex items-center justify-center text-[10px]">
                            {step.step}
                          </span>
                          <span className="font-semibold text-zinc-200">{step.name}</span>
                        </div>
                        <span className="text-[11px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {step.status} ({step.duration_ms}ms)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 100% Full-Width Footer */}
      <footer className="w-full border-t border-zinc-800 bg-black py-4 px-4 sm:px-8 text-center text-xs text-zinc-500 font-mono">
        TLS/SSL Handshake Visualizer &bull; Minimalist Black &amp; White Edition
      </footer>
    </div>
  );
}
