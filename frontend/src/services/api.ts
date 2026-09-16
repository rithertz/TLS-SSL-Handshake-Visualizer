import type {
  AnalyzeRequest,
  AnalyzeResponse,
} from "../types/analysis";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Creates a mock successful response compliant with 08_API_CONTRACT.md
 */
export function getMockSuccessResponse(url: string): AnalyzeResponse {
  let hostname = "example.com";
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
  } catch {
    // fallback
  }

  return {
    analysis_status: "SUCCESS",
    target: {
      url: url.startsWith("http") ? url : `https://${url}`,
      hostname: hostname,
      port: 443,
    },
    network: {
      resolved_ips: ["93.184.215.14", "2606:2800:21f:cb07:6820:80da:af6b:8b2c"],
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
      subject: `CN=${hostname}, O=Internet Corporation for Assigned Names and Numbers`,
      issuer: "DigiCert TLS RSA SHA256 2020 CA1",
      valid_from: "2026-01-15T00:00:00Z",
      valid_until: "2027-01-16T23:59:59Z",
      san: [hostname, `www.${hostname}`],
      serial_number: "0A:3F:81:9B:12:44:C9:88:55",
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
          explanation: "The connection negotiated TLS 1.3, providing optimal cryptographic performance and security.",
          evidence: "Negotiated Protocol: TLS 1.3",
        },
        {
          rule_id: "CERT-VALIDITY",
          status: "PASS",
          severity: "INFO",
          title: "Certificate Valid & CA Trusted",
          explanation: "The X.509 certificate is valid, within its validity window, and issued by a trusted public Certificate Authority.",
          evidence: "Issuer: DigiCert TLS RSA SHA256 2020 CA1",
        },
        {
          rule_id: "CERT-HOSTNAME-MATCH",
          status: "PASS",
          severity: "INFO",
          title: "Certificate Hostname Match",
          explanation: "The requested target hostname matches the Subject Alternative Name (SAN) list in the certificate.",
          evidence: `Requested: ${hostname}, SANs: [${hostname}, www.${hostname}]`,
        },
        {
          rule_id: "CIPHER-AEAD-STRONG",
          status: "PASS",
          severity: "INFO",
          title: "Strong AEAD Cipher Suite",
          explanation: "Uses TLS_AES_256_GCM_SHA384 which provides authenticated encryption with associated data (AEAD).",
          evidence: "Bits: 256",
        },
        {
          rule_id: "HSTS-HEADER-MISSING",
          status: "WARN",
          severity: "LOW",
          title: "HSTS Header Advisory",
          explanation: "HTTP Strict Transport Security header recommendation.",
          evidence: "max-age policy not enforced at socket level.",
        },
      ],
      recommendations: [
        {
          rule_id: "HSTS-HEADER-MISSING",
          text: "Configure Strict-Transport-Security header with max-age=31536000 and includeSubDomains on all HTTPS responses.",
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
          description: "Client initiates handshake offering TLS 1.3, key shares, and supported cipher suites.",
          purpose: "Negotiate version, key exchange parameters, and client random.",
          actual_data: {
            client_version: "TLS 1.3",
            supported_ciphers: ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
            key_share: "X25519",
          },
        },
        {
          id: "step-2",
          sequence: 2,
          sender: "server",
          receiver: "client",
          message: "ServerHello",
          title: "Server Hello",
          description: "Server selects cipher suite and returns server key share for Diffie-Hellman exchange.",
          purpose: "Establish shared secret key and confirm cipher selection.",
          actual_data: {
            selected_cipher: "TLS_AES_256_GCM_SHA384",
            server_key_share: "X25519",
          },
        },
        {
          id: "step-3",
          sequence: 3,
          sender: "server",
          receiver: "client",
          message: "Certificate & Finished",
          title: "Server Encrypted Extensions & Certificate",
          description: "Server sends encrypted X.509 certificate chain and Finished verification payload.",
          purpose: "Authenticate server identity and finalize handshake.",
          actual_data: {
            certificate_issuer: "DigiCert",
            handshake_status: "COMPLETED",
          },
        },
      ],
    },
    error: null,
  };
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
        target: { url, hostname: url, port: 443 },
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
      target: { url, hostname: url, port: 443 },
      network: null,
      tls: null,
      certificate: null,
      security: null,
      visualization: null,
      error: {
        code: "CONNECTION_FAILED",
        message: `Unable to connect to the backend analysis server at ${API_BASE_URL}. Please ensure the FastAPI server is running.`,
      },
    };
  }
}

export const analyzeUrl = analyzeWebsite;