import React from "react";
import type { ErrorInfo } from "../types/analysis";

interface ErrorMessageProps {
  error?: string | ErrorInfo | null;
  code?: string;
  targetUrl?: string;
  onRetry?: () => void;
  isMock?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  code: directCode,
  targetUrl,
  onRetry,
  isMock,
}) => {
  // Resolve message string & code from either error object or direct props
  let messageStr = "An unexpected error occurred while analyzing the target endpoint.";
  let errorCode = directCode ?? "ERR_UNKNOWN";

  if (typeof error === "string") {
    messageStr = error;
  } else if (error && typeof error === "object") {
    messageStr = error.message || messageStr;
    errorCode = error.code || errorCode;
  }

  // User-friendly troubleshooting hints mapped per error code.
  // Covers both backend-emitted codes (NETWORK_ERROR, CONNECTION_FAILED) and
  // any UI-level codes surfaced by the application layer.
  const getTroubleshootingHint = (codeStr: string): string => {
    switch (codeStr?.toUpperCase()) {
      case "INVALID_URL":
        return "Check that the URL is correctly formatted and starts with https:// (e.g., https://example.com).";
      case "DNS_RESOLUTION_FAILED":
      case "NETWORK_ERROR":
        return "Verify that the hostname exists and is registered in public DNS servers.";
      case "TLS_HANDSHAKE_FAILED":
        return "The remote host failed or rejected the TLS handshake. Check port 443 and supported cipher suites.";
      case "CONNECTION_TIMEOUT":
      case "CONNECTION_FAILED":
        return "The connection timed out while reaching the host. Check network connectivity or firewall rules.";
      case "CERTIFICATE_EXPIRED":
        return "The server certificate has expired or is invalid for the domain.";
      case "SERVER_ERROR":
        return "The analysis server returned an unexpected error. Please try again later.";
      default:
        return "Please verify the target URL, check internet connectivity, and try again.";
    }
  };

  const hintText = getTroubleshootingHint(errorCode);

  return (
    <div className="state-card error-card" data-testid="error-message" role="alert">
      <div className="error-header">
        <div className="error-icon">⚠️</div>
        <div className="error-title-group">
          <h3 className="error-title">Analysis Failure</h3>
          <span className="badge badge-fail font-mono" data-testid="error-code">
            {errorCode}
          </span>
        </div>
      </div>

      <div className="error-body">
        <p className="error-main-msg font-mono" data-testid="error-text">
          {messageStr}
        </p>

        {targetUrl && (
          <p className="error-target text-xs">
            Target Host: <span className="font-mono">{targetUrl}</span>
          </p>
        )}

        <div className="troubleshooting-box">
          <span className="troubleshooting-title">💡 Troubleshooting Hint:</span>
          <p className="troubleshooting-text">{hintText}</p>
        </div>

        {isMock && (
          <p className="mock-note text-xs">
            • Note: Simulated fixture error for offline demonstration.
          </p>
        )}
      </div>

      {onRetry && (
        <div className="error-actions">
          <button
            type="button"
            className="btn btn-primary font-mono"
            onClick={onRetry}
            data-testid="retry-btn"
          >
            🔄 Retry Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
