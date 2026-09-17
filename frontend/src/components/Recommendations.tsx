import React from "react";
import type { Recommendation, SecurityFinding } from "../types/analysis";

interface RecommendationsProps {
  recommendations: Recommendation[] | null;
  findings?: SecurityFinding[] | null;
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  findings,
}) => {
  const safeRecs = recommendations ?? [];

  // Helper map to find associated title from findings list if available
  const findingTitleMap = new Map<string, string>();
  if (findings) {
    findings.forEach((f) => {
      findingTitleMap.set(f.rule_id, f.title);
    });
  }

  return (
    <div className="dashboard-card" data-testid="recommendations">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">💡</span>
          <div>
            <h2 className="card-title">Actionable Recommendations</h2>
            <p className="card-subtitle">Steps to resolve identified security vulnerabilities</p>
          </div>
        </div>
        <span className="badge badge-neutral font-mono">{safeRecs.length} Total</span>
      </div>

      <div className="recommendations-content">
        {safeRecs.length === 0 ? (
          <div className="empty-state-card">
            <p className="text-muted">No specific recommendations provided for this scan.</p>
          </div>
        ) : (
          <div className="recommendation-list">
            {safeRecs.map((rec, index) => {
              const matchedFindingTitle = findingTitleMap.get(rec.rule_id);

              return (
                <div key={`${rec.rule_id}-${index}`} className="recommendation-item">
                  <div className="recommendation-icon">⚡</div>
                  <div className="recommendation-details">
                    <div className="recommendation-header">
                      <span className="rule-id-tag font-mono">{rec.rule_id}</span>
                      {matchedFindingTitle && (
                        <span className="recommendation-finding-title">
                          Related to: {matchedFindingTitle}
                        </span>
                      )}
                    </div>
                    <p className="recommendation-text">{rec.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
