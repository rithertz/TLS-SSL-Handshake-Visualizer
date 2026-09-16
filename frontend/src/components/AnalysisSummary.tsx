import React from "react";
import type { TargetInfo, NetworkInfo, AnalysisStatus } from "../types/analysis";
import { formatValue } from "../utils/formatters";

interface AnalysisSummaryProps {
  target: TargetInfo | null;
  network: NetworkInfo | null;
  status: AnalysisStatus | string | null;
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  target,
  network,
  status,
}) => {
  const statusUpper = (status ?? "SUCCESS").toUpperCase();

  let statusBadgeClass = "badge-success";
  if (statusUpper === "PARTIAL") statusBadgeClass = "badge-warn";
  if (statusUpper === "FAILED") statusBadgeClass = "badge-fail";

  const resolvedIps = network?.resolved_ips ?? [];

  return (
    <div className="dashboard-card" data-testid="analysis-summary">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">🎯</span>
          <div>
            <h2 className="card-title">Target & Network Summary</h2>
            <p className="card-subtitle">Endpoint identity and DNS resolution details</p>
          </div>
        </div>
        <span className={`badge ${statusBadgeClass}`} data-testid="status-badge">
          {statusUpper}
        </span>
      </div>

      <div className="card-grid">
        <div className="info-box">
          <span className="info-label">Target URL</span>
          <span className="info-value text-ellipsis" title={target?.url ?? ""}>
            {formatValue(target?.url)}
          </span>
        </div>

        <div className="info-box">
          <span className="info-label">Hostname</span>
          <span className="info-value font-mono">
            {formatValue(target?.hostname)}
          </span>
        </div>

        <div className="info-box">
          <span className="info-label">Port</span>
          <span className="info-value font-mono">
            {formatValue(target?.port)}
          </span>
        </div>

        <div className="info-box full-width">
          <span className="info-label">Resolved IP Addresses</span>
          <div className="badge-list" data-testid="resolved-ips">
            {resolvedIps.length > 0 ? (
              resolvedIps.map((ip, idx) => (
                <span key={idx} className="badge badge-neutral font-mono">
                  {ip}
                </span>
              ))
            ) : (
              <span className="text-muted text-sm">Not available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSummary;
