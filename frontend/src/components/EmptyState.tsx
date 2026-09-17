import React from "react";

export const EmptyState: React.FC = () => {
  return (
    <div className="state-card empty-card" data-testid="empty-state">
      <div className="empty-icon">🛡️</div>
      <h2 className="empty-title">Ready for Security Analysis</h2>
      <p className="empty-subtitle">
        Enter an HTTPS domain URL above to inspect its TLS/SSL handshake parameters, cipher suite,
        X.509 certificate validity, and automated security grade.
      </p>

      <div className="empty-feature-grid font-mono text-xs">
        <div className="feature-item">
          <span className="feature-bullet">•</span>
          <span>TLS 1.2 / 1.3 Protocol Inspection</span>
        </div>
        <div className="feature-item">
          <span className="feature-bullet">•</span>
          <span>X.509 Cert &amp; SAN Validation</span>
        </div>
        <div className="feature-item">
          <span className="feature-bullet">•</span>
          <span>Security Score &amp; Grade (A-F)</span>
        </div>
        <div className="feature-item">
          <span className="feature-bullet">•</span>
          <span>Step-by-step Handshake Trace</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
