import React, { useState } from "react";
import type { VisualizationInfo, HandshakeStep } from "../types/analysis";

interface HandshakeVisualizerEntryProps {
  visualization: VisualizationInfo | null;
  onLaunchVisualizer?: (protocolVersion: string, steps: HandshakeStep[]) => void;
}

export const HandshakeVisualizerEntry: React.FC<HandshakeVisualizerEntryProps> = ({
  visualization,
  onLaunchVisualizer,
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const protocolVersion = visualization?.protocol_version ?? "TLS 1.3";
  const steps = visualization?.steps ?? [];

  const handleLaunch = () => {
    if (onLaunchVisualizer) {
      onLaunchVisualizer(protocolVersion, steps);
    }
  };

  const toggleStep = (seq: number) => {
    setExpandedStep(expandedStep === seq ? null : seq);
  };

  return (
    <div className="dashboard-card visualizer-entry-card" data-testid="handshake-visualizer-entry">
      <div className="card-header flex-responsive">
        <div className="card-header-left">
          <span className="card-icon">⚡</span>
          <div>
            <h2 className="card-title">Handshake Visualizer Integration</h2>
            <p className="card-subtitle">
              Interactive packet-level handshake trace for negotiated session
            </p>
          </div>
        </div>

        <div className="header-badges">
          <span
            className="badge badge-info font-mono"
            data-testid="protocol-version-badge"
          >
            Dynamic Mode: {protocolVersion}
          </span>
          <button
            type="button"
            className="btn btn-accent"
            onClick={handleLaunch}
            data-testid="explore-handshake-btn"
          >
            🚀 Explore Handshake
          </button>
        </div>
      </div>

      <div className="handshake-steps-container">
        <h3 className="section-subtitle font-mono">
          Handshake Step Sequence ({steps.length} Messages Captured)
        </h3>

        {steps.length === 0 ? (
          <div className="empty-state-card">
            <p className="text-muted">No handshake steps recorded for this analysis.</p>
          </div>
        ) : (
          <div className="steps-timeline" data-testid="steps-timeline">
            {steps.map((step) => {
              const isExpanded = expandedStep === step.sequence;
              const isClient = step.sender === "client";

              return (
                <div
                  key={step.id || step.sequence}
                  className={`timeline-step ${isExpanded ? "expanded" : ""}`}
                  data-testid={`handshake-step-${step.sequence}`}
                >
                  <div className="step-main" onClick={() => toggleStep(step.sequence)}>
                    <div className="step-left">
                      <span className="step-seq">{step.sequence}</span>
                      <span className={`direction-badge ${isClient ? "badge-client" : "badge-server"}`}>
                        {isClient ? "Client → Server" : "Server → Client"}
                      </span>
                      <span className="step-title font-mono">{step.title}</span>
                    </div>

                    <div className="step-right">
                      <span className="step-message badge badge-neutral font-mono">{step.message}</span>
                      <span className="expand-indicator">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="step-details font-mono">
                      <p className="step-desc">
                        <strong>Description:</strong> {step.description}
                      </p>
                      <p className="step-purpose">
                        <strong>Purpose:</strong> {step.purpose}
                      </p>

                      {step.actual_data && Object.keys(step.actual_data).length > 0 && (
                        <div className="step-data">
                          <strong>Parameters / Payload:</strong>
                          <pre className="json-preview">
                            {JSON.stringify(step.actual_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HandshakeVisualizerEntry;
