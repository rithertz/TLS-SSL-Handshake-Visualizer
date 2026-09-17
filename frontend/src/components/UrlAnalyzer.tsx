import React, { useState } from "react";

interface UrlAnalyzerProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlAnalyzer: React.FC<UrlAnalyzerProps> = ({ onAnalyze, isLoading }) => {
  const [inputUrl, setInputUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  const normalizeAndValidate = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return { isValid: false, error: "Please enter a target website URL." };
    }

    if (trimmed.startsWith("http://")) {
      return {
        isValid: false,
        error: "Only HTTPS endpoints are supported for TLS/SSL handshake analysis. Please use https://",
      };
    }

    let formatted = trimmed;
    if (!formatted.startsWith("https://")) {
      formatted = `https://${formatted}`;
    }

    try {
      const parsed = new URL(formatted);
      if (parsed.protocol !== "https:") {
        return { isValid: false, error: "URL must start with https://" };
      }
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        return { isValid: false, error: "Please enter a valid domain name (e.g., example.com)." };
      }
      return { isValid: true, url: formatted, error: "" };
    } catch {
      return { isValid: false, error: "Invalid URL format. Please enter a valid URL like https://example.com" };
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const result = normalizeAndValidate(inputUrl);
    if (!result.isValid || !result.url) {
      setValidationError(result.error || "Invalid URL.");
      return;
    }

    setValidationError("");
    setInputUrl(result.url);
    onAnalyze(result.url);
  };

  const handlePreset = (presetUrl: string) => {
    if (isLoading) return;
    setInputUrl(presetUrl);
    setValidationError("");
    onAnalyze(presetUrl);
  };

  return (
    <div className="url-analyzer-card" data-testid="url-analyzer">
      <form onSubmit={handleSubmit} className="analyzer-form">
        <div className="form-header">
          <label htmlFor="target-url-input" className="form-label font-mono">
            TARGET HTTPS ENDPOINT
          </label>
          <span className="protocol-supported font-mono">TLS 1.2 / 1.3 Supported</span>
        </div>

        <div className="form-input-group">
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              id="target-url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="e.g. https://example.com or example.com"
              disabled={isLoading}
              className={`url-input font-mono ${validationError ? "input-error" : ""}`}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "url-error-msg" : undefined}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg"
            data-testid="analyze-submit-btn"
          >
            {isLoading ? (
              <>
                <span className="btn-spinner"></span>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Target</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>

        {validationError && (
          <div
            id="url-error-msg"
            className="validation-error-box font-mono"
            role="alert"
            data-testid="validation-error"
          >
            ⚠️ {validationError}
          </div>
        )}

        <div className="presets-container font-mono">
          <span className="preset-label">Quick Presets:</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handlePreset("https://example.com")}
            className="btn-preset"
          >
            example.com
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handlePreset("https://github.com")}
            className="btn-preset"
          >
            github.com
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handlePreset("https://expired-rsa-dv.ssl.badssl.com")}
            className="btn-preset btn-preset-danger"
          >
            expired.badssl.com (Error Test)
          </button>
        </div>
      </form>
    </div>
  );
};

export default UrlAnalyzer;
