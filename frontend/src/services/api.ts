import type {
  AnalyzeRequest,
  AnalyzeResponse,
} from "../types/analysis";

const DEFAULT_LOCAL_API_BASE_URL = "http://127.0.0.1:8000";

const _rawApiBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL: string = _rawApiBase || DEFAULT_LOCAL_API_BASE_URL;

if (!_rawApiBase && import.meta.env.PROD) {
  throw new Error(
    "[config] VITE_API_BASE_URL is not set. " +
    "Define it before building the production frontend. " +
    "For local development, see .env.example."
  );
}

/**
 * Extracts the hostname from a URL string. Falls back to the raw string if
 * parsing fails so callers always receive a string value.
 */
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Main API function to submit website URL for analysis.
 */
export async function analyzeWebsite(url: string): Promise<AnalyzeResponse> {
  const requestBody: AnalyzeRequest = { url };

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let message = `Request failed with HTTP status ${response.status}.`;
      let code = "SERVER_ERROR";

      try {
        const errorData = await response.json();
        if (errorData.error) {
          code = errorData.error.code || code;
          message = errorData.error.message || message;
        } else if (typeof errorData.detail === "string") {
          message = errorData.detail;
        }
      } catch {
        // Keep default error message
      }

      return {
        analysis_status: "FAILED",
        target: { url, hostname: extractHostname(url), port: 443 },
        network: null,
        tls: null,
        certificate: null,
        security: null,
        visualization: null,
        error: { code, message },
      };
    }

    const data = (await response.json()) as AnalyzeResponse;
    return data;
  } catch {
    // Surface actual connection / network failure to UI rather than returning fake success data
    return {
      analysis_status: "FAILED",
      target: { url, hostname: extractHostname(url), port: 443 },
      network: null,
      tls: null,
      certificate: null,
      security: null,
      visualization: null,
      error: {
        code: "CONNECTION_FAILED",
        message: `Unable to connect to the backend analysis server. Please ensure the FastAPI server is running and VITE_API_BASE_URL is correctly configured.`,
      },
    };
  }
}

export const analyzeUrl = analyzeWebsite;
