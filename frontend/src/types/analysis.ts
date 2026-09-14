export type AnalysisStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export type FindingStatus = "PASS" | "WARN" | "FAIL";

export type FindingSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SecurityGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface AnalyzeRequest {
  url: string;
}

export interface TargetInfo {
  url: string;
  hostname: string;
  port: number;
}

export interface NetworkInfo {
  resolved_ips: string[];
}

export interface CipherInfo {
  name: string | null;
  protocol: string | null;
  bits: number | null;
}

export interface TLSInfo {
  version: string | null;
  cipher: CipherInfo | null;
}

export interface CertificateInfo {
  subject: string | null;
  issuer: string | null;
  valid_from: string | null;
  valid_until: string | null;
  san: string[];
  serial_number: string | null;
  hostname_match: boolean | null;
  self_signed: boolean | null;
}

export interface SecurityFinding {
  rule_id: string;
  status: FindingStatus;
  severity: FindingSeverity;
  title: string;
  explanation: string;
  evidence: string | string[] | null;
}

export interface Recommendation {
  rule_id: string;
  text: string;
}

export interface SecurityResult {
  score: number;
  grade: SecurityGrade;
  findings: SecurityFinding[];
  recommendations: Recommendation[];
}

export interface HandshakeStep {
  id: string;
  sequence: number;
  sender: "client" | "server";
  receiver: "client" | "server";
  message: string;
  title: string;
  description: string;
  purpose: string;
  actual_data: Record<string, unknown> | null;
}

export interface VisualizationInfo {
  protocol_version: string | null;
  steps: HandshakeStep[];
}

export interface ErrorInfo {
  code: string;
  message: string;
}

export interface AnalyzeResponse {
  analysis_status: AnalysisStatus;
  target: TargetInfo | null;
  network: NetworkInfo | null;
  tls: TLSInfo | null;
  certificate: CertificateInfo | null;
  security: SecurityResult | null;
  visualization: VisualizationInfo | null;
  error: ErrorInfo | null;
}