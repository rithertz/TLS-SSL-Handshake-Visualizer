import React from "react";
import type { TLSInfo } from "../types/analysis";
import { formatValue } from "../utils/formatters";

interface TlsDetailsProps {
  tls: TLSInfo | null;
}

export const TlsDetails: React.FC<TlsDetailsProps> = ({ tls }) => {
  const version = tls?.version;
  const cipher = tls?.cipher;

  // Security assessment helper based on negotiated protocol version
  const getTlsSecurityBadge = (ver: string | null | undefined) => {
    if (!ver) return { text: "Unknown", class: "badge-neutral" };
    if (ver.includes("1.3")) return { text: "Modern & Secure", class: "badge-success" };
    if (ver.includes("1.2")) return { text: "Standard TLS 1.2", class: "badge-info" };
    return { text: "Deprecation Risk", class: "badge-fail" };
  };

  const securityTag = getTlsSecurityBadge(version);

  return (
    <div className="dashboard-card" data-testid="tls-details">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">🔒</span>
          <div>
            <h2 className="card-title">TLS Protocol & Cipher Details</h2>
            <p className="card-subtitle">Negotiated transport security parameters</p>
          </div>
        </div>
        <span className={`badge ${securityTag.class}`}>{securityTag.text}</span>
      </div>

      <div className="card-grid">
        <div className="info-box">
          <span className="info-label">TLS Version</span>
          <span className="info-value font-mono highlight-text">
            {formatValue(version)}
          </span>
        </div>

        <div className="info-box">
          <span className="info-label">Cipher Protocol</span>
          <span className="info-value font-mono">
            {formatValue(cipher?.protocol ?? version)}
          </span>
        </div>

        <div className="info-box">
          <span className="info-label">Key Bit Strength</span>
          <span className="info-value font-mono">
            {cipher?.bits ? `${cipher.bits} bits` : "Not available"}
          </span>
        </div>

        <div className="info-box full-width">
          <span className="info-label">Cipher Suite Name</span>
          <span className="info-value font-mono code-block text-break">
            {formatValue(cipher?.name)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TlsDetails;
