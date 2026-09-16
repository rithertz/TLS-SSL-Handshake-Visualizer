import { describe, expect, it } from "vitest";

import { TLS_1_2_STEPS, TLS_1_3_STEPS } from "../handshakeData";
import {
  resolveSequence,
  selectSequence,
  toDisplayFields,
  toProtocolModel,
} from "../visualizerUtils";

describe("protocol data", () => {
  const sequences = [
    ["TLS 1.2", TLS_1_2_STEPS],
    ["TLS 1.3", TLS_1_3_STEPS],
  ] as const;

  it.each(sequences)("%s has unique step ids", (_name, steps) => {
    const ids = steps.map((step) => step.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(sequences)("%s is numbered from one", (_name, steps) => {
    expect(steps.map((step) => step.sequence)).toEqual(
      steps.map((_step, position) => position + 1),
    );
  });

  it.each(sequences)("%s always moves between the two peers", (_name, steps) => {
    for (const step of steps) {
      expect(["client", "server"]).toContain(step.sender);
      expect(step.receiver).not.toBe(step.sender);
    }
  });

  it.each(sequences)("%s explains every step", (_name, steps) => {
    for (const step of steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(20);
      expect(step.purpose.length).toBeGreaterThan(10);
    }
  });

  it("models TLS 1.3 as the shorter handshake", () => {
    expect(TLS_1_3_STEPS.length).toBeLessThan(TLS_1_2_STEPS.length);
  });

  it("starts both sequences with ClientHello", () => {
    expect(TLS_1_2_STEPS[0].message).toBe("ClientHello");
    expect(TLS_1_3_STEPS[0].message).toBe("ClientHello");
  });
});

describe("toProtocolModel", () => {
  it("recognises the shapes Python's ssl module produces", () => {
    expect(toProtocolModel("TLSv1.3")).toBe("TLS1.3");
    expect(toProtocolModel("TLSv1.2")).toBe("TLS1.2");
  });

  it("tolerates spacing and casing", () => {
    expect(toProtocolModel("tls 1.3")).toBe("TLS1.3");
    expect(toProtocolModel("TLS_1_2")).toBe(null);
  });

  it("returns null for versions it has no model for", () => {
    expect(toProtocolModel("TLSv1.1")).toBe(null);
    expect(toProtocolModel("SSLv3")).toBe(null);
    expect(toProtocolModel(null)).toBe(null);
    expect(toProtocolModel("")).toBe(null);
  });
});

describe("selectSequence", () => {
  it("returns the matching model", () => {
    expect(selectSequence("TLS1.3")).toBe(TLS_1_3_STEPS);
    expect(selectSequence("TLS1.2")).toBe(TLS_1_2_STEPS);
  });
});

describe("resolveSequence", () => {
  const backendStep = {
    id: "client_hello",
    sequence: 1,
    sender: "client" as const,
    receiver: "server" as const,
    message: "ClientHello",
    title: "Client says hello",
    description: "d",
    purpose: "p",
    actual_data: { sni_hostname: "example.com" },
  };

  it("prefers the backend sequence", () => {
    const resolved = resolveSequence({
      protocol_version: "TLSv1.3",
      steps: [backendStep],
    });

    expect(resolved.source).toBe("backend");
    expect(resolved.steps).toHaveLength(1);
    expect(resolved.model).toBe("TLS1.3");
  });

  it("orders backend steps by sequence number", () => {
    const resolved = resolveSequence({
      protocol_version: "TLSv1.3",
      steps: [
        { ...backendStep, id: "b", sequence: 2 },
        { ...backendStep, id: "a", sequence: 1 },
      ],
    });

    expect(resolved.steps.map((step) => step.id)).toEqual(["a", "b"]);
  });

  it("drops malformed backend steps", () => {
    const resolved = resolveSequence({
      protocol_version: "TLSv1.2",
      steps: [
        backendStep,
        { ...backendStep, id: "broken", sender: "middlebox" },
      ] as never,
    });

    expect(resolved.steps).toHaveLength(1);
  });

  it("falls back to the local model when the backend sends nothing", () => {
    const resolved = resolveSequence({
      protocol_version: "TLSv1.3",
      steps: [],
    });

    expect(resolved.source).toBe("local");
    expect(resolved.steps).toBe(TLS_1_3_STEPS);
  });

  it("falls back to tls.version when protocol_version is missing", () => {
    const resolved = resolveSequence(
      { protocol_version: null, steps: [] },
      "TLSv1.3",
    );

    expect(resolved.model).toBe("TLS1.3");
    expect(resolved.reportedVersion).toBe("TLSv1.3");
  });

  it("handles a null visualization block", () => {
    const resolved = resolveSequence(null);

    expect(resolved.source).toBe("local");
    expect(resolved.model).toBe("TLS1.2");
    expect(resolved.reportedVersion).toBe(null);
  });
});

describe("toDisplayFields", () => {
  it("returns nothing for missing data", () => {
    expect(toDisplayFields(null)).toEqual([]);
    expect(toDisplayFields({})).toEqual([]);
  });

  it("drops null values instead of printing them", () => {
    const fields = toDisplayFields({ cipher_suite: null, san_count: 2 });

    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe("san_count");
  });

  it("formats booleans, key sizes and dates readably", () => {
    const fields = toDisplayFields({
      hostname_match: true,
      self_signed: false,
      symmetric_key_bits: 256,
      valid_until: "2026-08-30T23:59:59+00:00",
    });

    const byKey = Object.fromEntries(
      fields.map((field) => [field.key, field.value]),
    );

    expect(byKey.hostname_match).toBe("Yes");
    expect(byKey.self_signed).toBe("No");
    expect(byKey.symmetric_key_bits).toBe("256 bits");
    expect(byKey.valid_until).toBe("2026-08-30");
  });

  it("labels unknown keys instead of failing", () => {
    const fields = toDisplayFields({ some_new_field: "x" });

    expect(fields[0].label).toBe("Some new field");
  });
});
