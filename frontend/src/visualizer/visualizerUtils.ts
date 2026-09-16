import { TLS_1_2_STEPS, TLS_1_3_STEPS } from "./handshakeData";
import type {
  ProtocolModel,
  ResolvedSequence,
  VisualStep,
  VisualizationInfo,
} from "./handshakeTypes";

/**
 * Map a reported TLS version string onto one of the two protocol models.
 *
 * Accepts the shapes Python's ssl module produces ("TLSv1.3"), the shapes
 * people type ("TLS 1.3", "tls1.3") and returns null for anything we do not
 * recognise, including older versions such as TLS 1.0.
 */
export function toProtocolModel(
  version: string | null | undefined,
): ProtocolModel | null {
  if (!version) {
    return null;
  }

  const normalized = version.toUpperCase().replace(/[\s_]/g, "");

  if (normalized.includes("1.3")) {
    return "TLS1.3";
  }

  if (normalized.includes("1.2")) {
    return "TLS1.2";
  }

  return null;
}

/**
 * Human-readable label for a reported version.
 *
 * Older protocol versions are named honestly rather than being relabelled as
 * TLS 1.2 just because the TLS 1.2 sequence is what gets drawn.
 */
export function describeVersion(version: string | null | undefined): string {
  if (!version) {
    return "TLS version not reported";
  }

  return version;
}

export function selectSequence(model: ProtocolModel): VisualStep[] {
  return model === "TLS1.3" ? TLS_1_3_STEPS : TLS_1_2_STEPS;
}

function isUsableStep(step: unknown): step is VisualStep {
  if (typeof step !== "object" || step === null) {
    return false;
  }

  const candidate = step as Partial<VisualStep>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.message === "string" &&
    (candidate.sender === "client" || candidate.sender === "server") &&
    (candidate.receiver === "client" || candidate.receiver === "server")
  );
}

/**
 * Decide what to render.
 *
 * Prefers the backend's own sequence, because that is the one carrying real
 * observed data. Falls back to the built-in model when the backend sent
 * nothing usable, so the component still renders something correct offline.
 */
export function resolveSequence(
  visualization: VisualizationInfo | null | undefined,
  fallbackVersion?: string | null,
): ResolvedSequence {
  const reportedVersion =
    visualization?.protocol_version ?? fallbackVersion ?? null;

  const model = toProtocolModel(reportedVersion) ?? "TLS1.2";

  const backendSteps = (visualization?.steps ?? []).filter(isUsableStep);

  if (backendSteps.length > 0) {
    const ordered = [...backendSteps].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
    );

    return {
      steps: ordered,
      source: "backend",
      model,
      reportedVersion,
    };
  }

  return {
    steps: selectSequence(model),
    source: "local",
    model,
    reportedVersion,
  };
}

const FIELD_LABELS: Record<string, string> = {
  sni_hostname: "Hostname requested (SNI)",
  negotiated_tls_version: "Negotiated version",
  cipher_suite: "Cipher suite",
  cipher_protocol: "Cipher protocol",
  symmetric_key_bits: "Symmetric key size",
  subject: "Subject",
  issuer: "Issuer",
  valid_from: "Valid from",
  valid_until: "Valid until",
  serial_number: "Serial number",
  hostname_match: "Covers this hostname",
  self_signed: "Self-signed",
  san_count: "Alternative names",
};

export interface DisplayField {
  key: string;
  label: string;
  value: string;
}

function formatValue(key: string, value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return key === "symmetric_key_bits" ? `${value} bits` : String(value);
  }

  if (typeof value === "string") {
    if (key === "valid_from" || key === "valid_until") {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    }

    return value;
  }

  return JSON.stringify(value);
}

function toLabel(key: string): string {
  if (FIELD_LABELS[key]) {
    return FIELD_LABELS[key];
  }

  const spaced = key.replace(/_/g, " ");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Turn a step's `actual_data` into rows for the details panel.
 *
 * Null and undefined values are dropped rather than shown as "null", because
 * an absent value means the backend did not observe it.
 */
export function toDisplayFields(
  actualData: Record<string, unknown> | null | undefined,
): DisplayField[] {
  if (!actualData) {
    return [];
  }

  return Object.entries(actualData)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      label: toLabel(key),
      value: formatValue(key, value),
    }));
}
