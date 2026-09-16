import React from "react";
import type { SecurityResult } from "../types/analysis";

interface SecurityScoreProps {
  security: SecurityResult | null;
}

export const SecurityScore: React.FC<SecurityScoreProps> = ({ security }) => {
  const score = security?.score ?? 0;
  const grade = security?.grade ?? "F";
  const findings = security?.findings ?? [];

  // Count findings verbatim from backend array without modifying or recalculating overall score
  const passCount = findings.filter((f) => f.status === "PASS").length;
  const warnCount = findings.filter((f) => f.status === "WARN").length;
  const failCount = findings.filter((f) => f.status === "FAIL").length;

  const getGradeColorClass = (g: string) => {
    switch (g.toUpperCase()) {
      case "A":
        return "grade-a";
      case "B":
        return "grade-b";
      case "C":
        return "grade-c";
      case "D":
        return "grade-d";
      case "E":
      case "F":
      default:
        return "grade-f";
    }
  };

  const gradeClass = getGradeColorClass(grade);

  return (
    <div className="dashboard-card score-card" data-testid="security-score">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">🛡️</span>
          <div>
            <h2 className="card-title">Security Score & Grade</h2>
            <p className="card-subtitle">Verbatim backend security rating assessment</p>
          </div>
        </div>
      </div>

      <div className="score-container">
        {/* Score & Grade Display */}
        <div className="score-display">
          <div className={`grade-badge ${gradeClass}`} data-testid="security-grade">
            {grade}
          </div>
          <div className="score-info">
            <span className="score-numerical" data-testid="numerical-score">
              {score}
              <span className="score-total">/100</span>
            </span>
            <span className="score-caption">Security Index</span>
          </div>
        </div>

        {/* Findings Status Breakdown */}
        <div className="breakdown-grid" data-testid="status-breakdown">
          <div className="breakdown-box breakdown-pass">
            <span className="breakdown-count">{passCount}</span>
            <span className="breakdown-label">PASS</span>
          </div>
          <div className="breakdown-box breakdown-warn">
            <span className="breakdown-count">{warnCount}</span>
            <span className="breakdown-label">WARN</span>
          </div>
          <div className="breakdown-box breakdown-fail">
            <span className="breakdown-count">{failCount}</span>
            <span className="breakdown-label">FAIL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityScore;
