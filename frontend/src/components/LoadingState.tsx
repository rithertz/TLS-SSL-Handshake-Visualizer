import React from "react";

interface LoadingStateProps {
  url?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ url }) => {
  return (
    <div className="state-card loading-card" data-testid="loading-state" role="status" aria-live="polite">
      <div className="spinner-container">
        <div className="pulse-ring"></div>
        <div className="loading-spinner"></div>
      </div>

      <h3 className="loading-title">Analyzing website...</h3>
      <p className="loading-subtitle">
        This may take a few seconds. Negotiating TLS connection and evaluating security parameters
        {url ? <span className="target-url-highlight"> for {url}</span> : ""}.
      </p>

      <div className="loading-progress-bar font-mono">
        <div className="progress-bar-fill"></div>
      </div>
    </div>
  );
};

export default LoadingState;
