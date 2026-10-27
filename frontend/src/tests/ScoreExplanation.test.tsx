import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SecurityResult } from "../types/analysis";
import ScoreExplanation from "../components/ScoreExplanation";
import SecurityScore from "../components/SecurityScore";

// Findings as the backend returns them: every finding carries points_deducted.
const f = (
  rule_id: string,
  status: "PASS" | "WARN" | "FAIL",
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  evidence: string,
  points_deducted = 0,
) => ({
  rule_id,
  status,
  severity,
  title: rule_id,
  explanation: "x",
  evidence,
  points_deducted,
});

describe("ScoreExplanation", () => {
  it("explains TLS 1.2 + self-signed as 100 - 10 - 25 = 65 using backend points", () => {
    const security: SecurityResult = {
      score: 65,
      grade: "D",
      findings: [
        f("TLS_VERSION", "WARN", "LOW", "TLSv1.2", 10),
        f("CERT_EXPIRY", "PASS", "INFO", "Valid"),
        f("HOSTNAME_MATCH", "PASS", "INFO", "example.com"),
        f("EXPIRY_PROXIMITY", "PASS", "INFO", "200 days remaining"),
        f("SELF_SIGNED", "WARN", "HIGH", "CN=example.com", 25),
      ],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);

    expect(screen.getByTestId("se-equation").textContent).toBe("100−10−25=65");
    expect(screen.getByTestId("se-reconciliation").className).toContain("se-recon-ok");
    expect(screen.queryByTestId("se-mismatch")).toBeNull();
    expect(screen.getByTestId("se-rule-TLS_VERSION")).toBeTruthy();
    expect(screen.getByTestId("se-whatif")).toBeTruthy();
  });

  it("uses the backend's numbers, not a local table", () => {
    // The backend says TLS 1.2 cost 20 here. The panel must show 20, not 10.
    const security: SecurityResult = {
      score: 80,
      grade: "B",
      findings: [f("TLS_VERSION", "WARN", "LOW", "TLSv1.2", 20)],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-equation").textContent).toBe("100−20=80");
    expect(screen.queryByTestId("se-mismatch")).toBeNull();
  });

  it("explains a perfect score with no deductions", () => {
    const security: SecurityResult = {
      score: 100,
      grade: "A",
      findings: [f("TLS_VERSION", "PASS", "INFO", "TLSv1.3")],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-whatif-none")).toBeTruthy();
    expect(screen.getByTestId("se-equation").textContent).toBe("100=100");
  });

  it("clamps overlapping penalties at 0 and still reconciles", () => {
    const security: SecurityResult = {
      score: 0,
      grade: "F",
      findings: [
        f("TLS_VERSION", "WARN", "LOW", "TLSv1.2", 10),
        f("CERT_EXPIRY", "FAIL", "HIGH", "expired", 30),
        f("HOSTNAME_MATCH", "FAIL", "CRITICAL", "mismatch", 35),
        f("SELF_SIGNED", "WARN", "HIGH", "self", 25),
      ],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-reconciliation").className).toContain("se-recon-ok");
  });

  it("renders a safe fallback when security data is missing", () => {
    render(<ScoreExplanation security={null} certificate={null} />);
    expect(screen.getByTestId("score-explanation")).toBeTruthy();
  });

  it("flags a mismatch instead of making the equation match the backend score", () => {
    const security: SecurityResult = {
      score: 70, // the reported deductions only explain 65
      grade: "C",
      findings: [
        f("TLS_VERSION", "WARN", "LOW", "TLSv1.2", 10),
        f("SELF_SIGNED", "WARN", "HIGH", "self", 25),
      ],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-equation").textContent).toBe("100−10−25=65");
    expect(screen.getByTestId("se-mismatch")).toBeTruthy();
    expect(screen.getByTestId("se-reconciliation").className).toContain("se-recon-warn");
  });

  it("includes rules it has no description for, using the backend's points", () => {
    const security: SecurityResult = {
      score: 90,
      grade: "A",
      findings: [f("HSTS", "FAIL", "HIGH", "missing", 10)],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-rule-HSTS")).toBeTruthy();
    expect(screen.getByTestId("se-equation").textContent).toBe("100−10=90");
    expect(screen.queryByTestId("se-mismatch")).toBeNull();
  });

  it("flags findings that lack points_deducted (older backend)", () => {
    const security: SecurityResult = {
      score: 90,
      grade: "A",
      findings: [
        {
          rule_id: "TLS_VERSION",
          status: "WARN",
          severity: "LOW",
          title: "TLS",
          explanation: "x",
          evidence: "TLSv1.2",
        },
      ],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-mismatch").textContent).toContain("points_deducted");
  });

  it("shows the backend grade as-is and flags a grade outside its documented band", () => {
    const security: SecurityResult = {
      score: 65,
      grade: "A",
      findings: [
        f("TLS_VERSION", "WARN", "LOW", "TLSv1.2", 10),
        f("SELF_SIGNED", "WARN", "HIGH", "self", 25),
      ],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-grade-mismatch").textContent).toContain("grade A");
    expect(screen.getByTestId("se-summary").textContent).toContain("grade A");
  });

  it("does not derive a grade for the what-if rows", () => {
    const security: SecurityResult = {
      score: 90,
      grade: "A",
      findings: [f("TLS_VERSION", "WARN", "LOW", "TLSv1.2", 10)],
      recommendations: [],
    };
    render(<ScoreExplanation security={security} certificate={null} />);
    expect(screen.getByTestId("se-whatif").textContent).not.toMatch(/grade/i);
  });
});

describe("SecurityScore grade styling", () => {
  it("gives grade E its own style instead of the F style", () => {
    const security: SecurityResult = {
      score: 55,
      grade: "E",
      findings: [],
      recommendations: [],
    };
    render(<SecurityScore security={security} />);
    const badge = screen.getByTestId("security-grade");
    expect(badge.className).toContain("grade-e");
    expect(badge.className).not.toContain("grade-f");
  });
});
