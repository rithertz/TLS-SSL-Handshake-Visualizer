import type {
  AnalyzeRequest,
  AnalyzeResponse,
} from "../types/analysis";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeWebsite(
  url: string,
): Promise<AnalyzeResponse> {
  const requestBody: AnalyzeRequest = {
    url,
  };

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep the default error message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<AnalyzeResponse>;
}