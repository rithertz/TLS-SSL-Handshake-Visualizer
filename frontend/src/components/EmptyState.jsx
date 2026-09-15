import React from 'react';

/**
 * EmptyState Component (Minimalist Black & White Theme)
 */
export default function EmptyState() {
  const features = [
    {
      title: 'Handshake Timeline',
      description: 'Step-by-step trace of ClientHello, ServerHello, Certificate exchange & Cipher negotiation.',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Certificate Audit',
      description: 'Inspect issuer authority, expiration validity, SAN extensions, and public key sizes.',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Security Compliance',
      description: 'Automated evaluation against TLS 1.3 standards, HSTS, PFS, and cipher suite strength.',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full max-w-5xl my-8 p-8 sm:p-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-4">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        HTTPS Security Dashboard
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        TLS/SSL Security &amp; Protocol Analyzer
      </h2>
      <p className="text-sm text-zinc-400 max-w-xl mx-auto mt-2 leading-relaxed font-sans">
        Enter any domain name above to run live cryptographic inspection, handshake timeline tracing, and certificate chain validation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 text-left">
        {features.map((feat, idx) => (
          <div
            key={idx}
            className="p-5 bg-black border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
          >
            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg w-fit mb-4">
              {feat.icon}
            </div>
            <h4 className="text-sm font-semibold text-white font-sans">{feat.title}</h4>
            <p className="text-xs text-zinc-400 mt-1.5 leading-normal font-sans">{feat.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
