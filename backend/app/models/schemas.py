from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=1)


class TargetInfo(BaseModel):
    url: str
    hostname: str
    port: int


class NetworkInfo(BaseModel):
    resolved_ips: list[str]


class CipherInfo(BaseModel):
    name: str | None = None
    protocol: str | None = None
    bits: int | None = None


class TLSInfo(BaseModel):
    version: str | None = None
    cipher: CipherInfo | None = None


class CertificateInfo(BaseModel):
    subject: str | None = None
    issuer: str | None = None
    valid_from: str | None = None
    valid_until: str | None = None
    san: list[str] = []
    serial_number: str | None = None
    hostname_match: bool | None = None
    self_signed: bool | None = None


class SecurityFinding(BaseModel):
    rule_id: str
    status: Literal["PASS", "WARN", "FAIL"]
    severity: Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    title: str
    explanation: str
    evidence: str | list[str] | None = None


class Recommendation(BaseModel):
    rule_id: str
    text: str


class SecurityResult(BaseModel):
    score: int = Field(..., ge=0, le=100)
    grade: Literal["A", "B", "C", "D", "E", "F"]
    findings: list[SecurityFinding]
    recommendations: list[Recommendation]


class HandshakeStep(BaseModel):
    id: str
    sequence: int
    sender: Literal["client", "server"]
    receiver: Literal["client", "server"]
    message: str
    title: str
    description: str
    purpose: str
    actual_data: dict | None = None


class VisualizationInfo(BaseModel):
    protocol_version: str | None = None
    steps: list[HandshakeStep]


class ErrorInfo(BaseModel):
    code: str
    message: str


class AnalyzeResponse(BaseModel):
    analysis_status: Literal["SUCCESS", "PARTIAL", "FAILED"]
    target: TargetInfo | None = None
    network: NetworkInfo | None = None
    tls: TLSInfo | None = None
    certificate: CertificateInfo | None = None
    security: SecurityResult | None = None
    visualization: VisualizationInfo | None = None
    error: ErrorInfo | None = None
