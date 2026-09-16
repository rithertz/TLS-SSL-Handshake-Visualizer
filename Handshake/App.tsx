import { useState } from "react";

import AnalyzeForm from "./components/AnalyzeForm";
import HandshakeVisualizer from "./visualizer/HandshakeVisualizer";
import { analyzeWebsite } from "./services/api";
import type { AnalyzeResponse } from "./types/analysis";

function App() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(url: string) {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeWebsite(url);

      if (result.analysis_status === "FAILED") {
        setError(
          result.error?.message ?? "The website analysis failed.",
        );
      } else {
        setAnalysis(result);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the analysis server.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>TLS/SSL Handshake Visualizer</h1>

      <p>
        Analyze a website's TLS connection and certificate security.
      </p>

      <AnalyzeForm
        onAnalyze={handleAnalyze}
        loading={loading}
      />

      {error && (
        <section>
          <h2>Analysis Error</h2>
          <p>{error}</p>
        </section>
      )}

      {analysis && (
        <section>
          <h2>Analysis Complete</h2>
          <p>
            Analyzed: {analysis.target?.hostname}
          </p>
          <p>
            TLS Version: {analysis.tls?.version ?? "Unavailable"}
          </p>

          <HandshakeVisualizer
            visualization={analysis.visualization}
            tlsVersion={analysis.tls?.version}
          />
        </section>
      )}
    </main>
  );
}

export default App;