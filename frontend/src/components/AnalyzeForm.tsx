import { useState } from "react";
import type { FormEvent } from "react";

interface AnalyzeFormProps {
  onAnalyze: (url: string) => void;
  loading: boolean;
}

export default function AnalyzeForm({
  onAnalyze,
  loading,
}: AnalyzeFormProps) {
  const [url, setUrl] = useState("https://example.com");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return;
    }

    onAnalyze(trimmedUrl);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="website-url">
        Website URL
      </label>

      <div>
        <input
          id="website-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          disabled={loading}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Website"}
        </button>
      </div>
    </form>
  );
}