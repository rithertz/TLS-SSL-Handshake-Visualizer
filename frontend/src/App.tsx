<<<<<<< HEAD
import React, { useState } from "react";
import type { AnalyzeResponse, AnalysisState } from "./types/analysis";
=======
import { useState } from "react";

import AnalyzeForm from "./components/AnalyzeForm";
import HandshakeVisualizer from "./visualizer/HandshakeVisualizer";
>>>>>>> origin/main
import { analyzeWebsite } from "./services/api";

import UrlAnalyzer from "./components/UrlAnalyzer";
import EmptyState from "./components/EmptyState";
import LoadingState from "./components/LoadingState";
import ErrorMessage from "./components/ErrorMessage";
import AnalysisSummary from "./components/AnalysisSummary";
import TlsDetails from "./components/TlsDetails";
import CertificateDetails from "./components/CertificateDetails";
import SecurityScore from "./components/SecurityScore";
import FindingsList from "./components/FindingsList";
import Recommendations from "./components/Recommendations";
import HandshakeVisualizerEntry from "./components/HandshakeVisualizerEntry";

import "./styles/dashboard.css";

export const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisState>("idle");
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ message: string; code: string }>({
    message: "",
    code: "",
  });

  const handleAnalyze = async (targetUrl: string) => {
    setCurrentUrl(targetUrl);
    setStatus("loading");
    setAnalysis(null);
    setErrorDetails({ message: "", code: "" });

    try {
      const response = await analyzeWebsite(targetUrl);

      if (response.analysis_status === "FAILED") {
        setErrorDetails({
          message: response.error?.message ?? "Analysis failed for the specified host.",
          code: response.error?.code ?? "ERR_ANALYSIS_FAILED",
        });
        setStatus("error");
      } else {
        setAnalysis(response);
        setStatus("success");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to complete security analysis.";
      setErrorDetails({
        message: msg,
        code: "CONNECTION_TIMEOUT",
      });
      setStatus("error");
    }
  };

  const handleRetry = () => {
    if (currentUrl) {
      handleAnalyze(currentUrl);
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation / Header */}
      <header className="header-bar">
        <div className="header-content">
          <div className="logo-group">
            <span className="logo-icon">🔒</span>
            <div>
              <h1 className="app-title">TLS/SSL Handshake Visualizer</h1>
              <p className="app-subtitle font-mono">Website Security &amp; Protocol Analyzer</p>
            </div>
          </div>
          <div className="header-status">
            <span className="badge badge-info font-mono">
              <span className="pulse-dot"></span> System Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="dashboard-main">
        {/* Input Control */}
        <UrlAnalyzer onAnalyze={handleAnalyze} isLoading={status === "loading"} />

        {/* State Machine Views */}
        {status === "idle" && <EmptyState />}

        {status === "loading" && <LoadingState url={currentUrl} />}

<<<<<<< HEAD
        {status === "error" && (
          <ErrorMessage
            error={errorDetails.message}
            code={errorDetails.code}
            targetUrl={currentUrl}
            onRetry={handleRetry}
          />
        )}

        {status === "success" && analysis && (
          <div className="dashboard-grid">
            {/* Top Row: Security Score & Target Summary */}
            <div className="dashboard-grid-2col">
              <SecurityScore security={analysis.security} />
              <AnalysisSummary
                target={analysis.target}
                network={analysis.network}
                status={analysis.analysis_status}
              />
            </div>

            {/* Middle Row: TLS Protocol & Certificate Details */}
            <div className="dashboard-grid-2col">
              <TlsDetails tls={analysis.tls} />
              <CertificateDetails certificate={analysis.certificate} />
            </div>

            {/* Visualizer Row */}
            <HandshakeVisualizerEntry visualization={analysis.visualization} />

            {/* Bottom Row: Findings & Recommendations */}
            <div className="dashboard-grid-2col">
              <FindingsList findings={analysis.security?.findings ?? []} />
              <Recommendations
                recommendations={analysis.security?.recommendations ?? []}
                findings={analysis.security?.findings ?? []}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer-bar font-mono">
        Computer Networks Project • TLS/SSL Handshake Visualizer &amp; Security Dashboard
      </footer>
    </div>
=======
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
>>>>>>> origin/main
  );
};

export default App;