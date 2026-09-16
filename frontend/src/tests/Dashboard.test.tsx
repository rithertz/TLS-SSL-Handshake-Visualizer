import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AnalyzeResponse } from "../types/analysis";

import SecurityScore from "../components/SecurityScore";
import AnalysisSummary from "../components/AnalysisSummary";
import TlsDetails from "../components/TlsDetails";
import CertificateDetails from "../components/CertificateDetails";
import FindingsList from "../components/FindingsList";
import Recommendations from "../components/Recommendations";
import HandshakeVisualizerEntry from "../components/HandshakeVisualizerEntry";

const mockAnalysisData: AnalyzeResponse = {
  analysis_status: "SUCCESS",
  target: {
    url: "https://example.com",
    hostname: "example.com",
    port: 443,
  },
  network: {
    resolved_ips: ["93.184.215.14"],
  },
  tls: {
    version: "TLS 1.3",
    cipher: {
      name: "TLS_AES_256_GCM_SHA384",
      protocol: "TLSv1.3",
      bits: 256,
    },
  },
  certificate: {
    subject: "CN=example.com",
    issuer: "DigiCert TLS RSA SHA256 2020 CA1",
    valid_from: "2026-01-15T00:00:00Z",
    valid_until: "2027-01-16T23:59:59Z",
    san: ["example.com", "www.example.com"],
    serial_number: "0A:3F:81:9B:12",
    hostname_match: true,
    self_signed: false,
  },
  security: {
    score: 95,
    grade: "A",
    findings: [
      {
        rule_id: "TLS-MODERN-VERSION",
        status: "PASS",
        severity: "INFO",
        title: "Modern TLS Version Negotiated",
        explanation: "Negotiated TLS 1.3.",
        evidence: "TLS 1.3",
      },
      {
        rule_id: "HSTS-MISSING",
        status: "WARN",
        severity: "LOW",
        title: "HSTS Advisory",
        explanation: "Header missing.",
        evidence: "No max-age header.",
      },
    ],
    recommendations: [
      {
        rule_id: "HSTS-MISSING",
        text: "Add Strict-Transport-Security header.",
      },
    ],
  },
  visualization: {
    protocol_version: "TLS 1.3",
    steps: [
      {
        id: "step-1",
        sequence: 1,
        sender: "client",
        receiver: "server",
        message: "ClientHello",
        title: "Client Hello",
        description: "Initiate handshake",
        purpose: "Negotiate params",
        actual_data: { version: "TLS 1.3" },
      },
    ],
  },
  error: null,
};

describe("Dashboard Components Integration", () => {
  it("renders SecurityScore with score, grade, and findings breakdown", () => {
    render(<SecurityScore security={mockAnalysisData.security} />);

    expect(screen.getByTestId("security-score")).toBeInTheDocument();
    expect(screen.getByTestId("security-grade")).toHaveTextContent("A");
    expect(screen.getByTestId("numerical-score")).toHaveTextContent("95/100");
  });

  it("renders AnalysisSummary target and resolved IP addresses", () => {
    render(
      <AnalysisSummary
        target={mockAnalysisData.target}
        network={mockAnalysisData.network}
        status={mockAnalysisData.analysis_status}
      />
    );

    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("93.184.215.14")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge")).toHaveTextContent("SUCCESS");
  });

  it("renders TlsDetails negotiated version and cipher suite", () => {
    render(<TlsDetails tls={mockAnalysisData.tls} />);

    expect(screen.getByText("TLS 1.3")).toBeInTheDocument();
    expect(screen.getByText("TLS_AES_256_GCM_SHA384")).toBeInTheDocument();
    expect(screen.getByText("256 bits")).toBeInTheDocument();
  });

  it("renders CertificateDetails issuer, SANs, and match badges", () => {
    render(<CertificateDetails certificate={mockAnalysisData.certificate} />);

    expect(screen.getByText("DigiCert TLS RSA SHA256 2020 CA1")).toBeInTheDocument();
    expect(screen.getByTestId("hostname-match-badge")).toHaveTextContent("Hostname Match");
    expect(screen.getByTestId("self-signed-badge")).toHaveTextContent("CA Signed");
    expect(screen.getByText("www.example.com")).toBeInTheDocument();
  });

  it("renders FindingsList with categorized status badges", () => {
    render(<FindingsList findings={mockAnalysisData.security!.findings} />);

    expect(screen.getByText("Modern TLS Version Negotiated")).toBeInTheDocument();
    expect(screen.getByText("HSTS Advisory")).toBeInTheDocument();
  });

  it("renders Recommendations connected to security findings", () => {
    render(
      <Recommendations
        recommendations={mockAnalysisData.security!.recommendations}
        findings={mockAnalysisData.security!.findings}
      />
    );

    expect(screen.getByText("Add Strict-Transport-Security header.")).toBeInTheDocument();
    expect(screen.getByText("Related to: HSTS Advisory")).toBeInTheDocument();
  });

  it("renders HandshakeVisualizerEntry with dynamic protocol version", () => {
    render(<HandshakeVisualizerEntry visualization={mockAnalysisData.visualization} />);

    expect(screen.getByTestId("protocol-version-badge")).toHaveTextContent("Dynamic Mode: TLS 1.3");
    expect(screen.getByTestId("explore-handshake-btn")).toBeInTheDocument();
  });
});
