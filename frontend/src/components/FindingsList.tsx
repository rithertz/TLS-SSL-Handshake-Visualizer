import React, { useState } from "react";
import type { SecurityFinding, FindingStatus } from "../types/analysis";

interface FindingsListProps {
  findings: SecurityFinding[] | null;
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [filter, setFilter] = useState<"ALL" | FindingStatus>("ALL");

  const safeFindings = findings ?? [];

  const filteredFindings = safeFindings.filter((finding) => {
    if (filter === "ALL") return true;
    return finding.status === filter;
  });

  const getStatusBadgeClass = (status: FindingStatus) => {
    switch (status) {
      case "PASS":
        return "badge-success";
      case "WARN":
        return "badge-warn";
      case "FAIL":
        return "badge-fail";
      default:
        return "badge-neutral";
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "badge-severity-critical";
      case "HIGH":
        return "badge-severity-high";
      case "MEDIUM":
        return "badge-severity-medium";
      case "LOW":
        return "badge-severity-low";
      case "INFO":
      default:
        return "badge-severity-info";
    }
  };

  return (
    <div className="dashboard-card" data-testid="findings-list">
      <div className="card-header flex-responsive">
        <div className="card-header-left">
          <span className="card-icon">📋</span>
          <div>
            <h2 className="card-title">Security Findings ({safeFindings.length})</h2>
            <p className="card-subtitle">Detailed rules evaluated during analysis</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="filter-tabs" role="tablist" aria-label="Filter findings by status">
          {(["ALL", "PASS", "WARN", "FAIL"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={filter === tab}
              className={`tab-btn ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="findings-content">
        {filteredFindings.length === 0 ? (
          <div className="empty-state-card">
            <p className="text-muted">No findings matching the current filter.</p>
          </div>
        ) : (
          <div className="findings-grid">
            {filteredFindings.map((item, index) => (
              <div
                key={`${item.rule_id}-${index}`}
                className={`finding-item status-border-${item.status.toLowerCase()}`}
                data-testid={`finding-item-${item.rule_id}`}
              >
                <div className="finding-header">
                  <div className="finding-title-group">
                    <span className="rule-id-tag font-mono">{item.rule_id}</span>
                    <h3 className="finding-title">{item.title}</h3>
                  </div>

                  <div className="finding-badges">
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                    <span className={`badge ${getSeverityBadgeClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                </div>

                <p className="finding-explanation">{item.explanation}</p>

                {item.evidence && (
                  <div className="finding-evidence font-mono">
                    <span className="evidence-label">Evidence:</span>
                    {Array.isArray(item.evidence) ? (
                      <ul className="evidence-list">
                        {item.evidence.map((ev, evIdx) => (
                          <li key={evIdx}>{ev}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="evidence-text">{item.evidence}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingsList;
