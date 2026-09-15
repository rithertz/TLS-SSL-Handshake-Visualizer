import mockGoodData from '../mock/mockAnalysisGood.json';
import mockErrorData from '../mock/mockAnalysisError.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Analyzes a target HTTPS URL for TLS/SSL handshake and security compliance.
 * Attempts real API request to POST /analyze; falls back to mock fixtures if backend is offline.
 *
 * @param {string} url - Normalized target HTTPS URL
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, isMock?: boolean }>}
 */
export async function analyzeUrl(url) {
  const normalizedUrl = url.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout to catch offline backend quickly

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: normalizedUrl }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errBody;
      try {
        errBody = await response.json();
      } catch {
        errBody = { message: `Server responded with status code ${response.status}` };
      }
      return {
        ok: false,
        error: errBody.message || errBody.error || `HTTP ${response.status} Error`,
        code: errBody.code || `HTTP_${response.status}`,
        isMock: false,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      data,
      isMock: false,
    };
  } catch (err) {
    console.warn(
      `[API Service] Backend (${API_BASE_URL}) unreachable or timed out. Falling back to mock fixture.`,
      err.message
    );

    // Simulate network delay for realistic UX testing
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Fallback logic: check if test URL contains "error", "expired", or "invalid"
    const isErrorTest = /error|expired|invalid|badssl/i.test(normalizedUrl);

    if (isErrorTest) {
      return {
        ok: false,
        error: mockErrorData.message || mockErrorData.error,
        code: mockErrorData.code,
        data: { ...mockErrorData, target: normalizedUrl },
        isMock: true,
      };
    }

    // Return successful mock fixture with updated target URL
    return {
      ok: true,
      data: {
        ...mockGoodData,
        target: normalizedUrl,
        timestamp: new Date().toISOString(),
      },
      isMock: true,
    };
  }
}
