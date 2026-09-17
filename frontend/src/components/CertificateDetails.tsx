import React from "react";
import type { CertificateInfo } from "../types/analysis";
import { formatDate, formatValue, getDaysUntilExpiration } from "../utils/formatters";

interface CertificateDetailsProps {
  certificate: CertificateInfo | null;
}

export const CertificateDetails: React.FC<CertificateDetailsProps> = ({ certificate }) => {
  const daysLeft = getDaysUntilExpiration(certificate?.valid_until);

  return (
    <div className="dashboard-card" data-testid="certificate-details">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">📜</span>
          <div>
            <h2 className="card-title">X.509 Certificate Information</h2>
            <p className="card-subtitle">Public key certificate trust & validity status</p>
          </div>
        </div>

        <div className="header-badges">
          {certificate?.hostname_match !== null && certificate?.hostname_match !== undefined && (
            <span
              className={`badge ${certificate.hostname_match ? "badge-success" : "badge-fail"}`}
              data-testid="hostname-match-badge"
            >
              {certificate.hostname_match ? "Hostname Match" : "Hostname Mismatch"}
            </span>
          )}

          {certificate?.self_signed !== null && certificate?.self_signed !== undefined && (
            <span
              className={`badge ${certificate.self_signed ? "badge-warn" : "badge-neutral"}`}
              data-testid="self-signed-badge"
            >
              {certificate.self_signed ? "Self-Signed" : "Not Self-Signed"}
            </span>
          )}
        </div>
      </div>

      <div className="card-grid">
        <div className="info-box full-width">
          <span className="info-label">Issuer Authority</span>
          <span className="info-value font-mono text-break">
            {formatValue(certificate?.issuer)}
          </span>
        </div>

        <div className="info-box full-width">
          <span className="info-label">Subject</span>
          <span className="info-value font-mono text-break">
            {formatValue(certificate?.subject)}
          </span>
        </div>

        <div className="info-box">
          <span className="info-label">Valid From</span>
          <span className="info-value text-sm">
            {formatDate(certificate?.valid_from)}
          </span>
        </div>

        <div className="info-box">
          <span className="info-label">Valid Until</span>
          <div className="flex-column">
            <span className="info-value text-sm">
              {formatDate(certificate?.valid_until)}
            </span>
            {daysLeft !== null && (
              <span className={`text-xs ${daysLeft < 30 ? "text-danger" : "text-success"}`}>
                ({daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"})
              </span>
            )}
          </div>
        </div>

        <div className="info-box full-width">
          <span className="info-label">Serial Number</span>
          <span className="info-value font-mono code-block text-break">
            {formatValue(certificate?.serial_number)}
          </span>
        </div>

        <div className="info-box full-width">
          <span className="info-label">Subject Alternative Names (SAN)</span>
          <div className="badge-list" data-testid="san-list">
            {certificate?.san && certificate.san.length > 0 ? (
              certificate.san.map((sanDomain, idx) => (
                <span key={idx} className="badge badge-neutral font-mono">
                  {sanDomain}
                </span>
              ))
            ) : (
              <span className="text-muted text-sm">None listed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetails;
