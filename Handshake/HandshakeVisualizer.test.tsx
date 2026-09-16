import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HandshakeVisualizer from "../HandshakeVisualizer";
import { TLS_1_2_STEPS, TLS_1_3_STEPS } from "../handshakeData";
import type { VisualizationInfo } from "../handshakeTypes";

const BACKEND_RESULT: VisualizationInfo = {
  protocol_version: "TLSv1.3",
  steps: [
    {
      id: "client_hello",
      sequence: 1,
      sender: "client",
      receiver: "server",
      message: "ClientHello",
      title: "Client says hello",
      description: "The client opens the handshake and offers its parameters.",
      purpose: "Start negotiation.",
      actual_data: { sni_hostname: "example.com" },
    },
    {
      id: "server_hello",
      sequence: 2,
      sender: "server",
      receiver: "client",
      message: "ServerHello",
      title: "Server picks the parameters",
      description: "The server selects a cipher suite and answers.",
      purpose: "Fix the connection parameters.",
      actual_data: {
        negotiated_tls_version: "TLSv1.3",
        cipher_suite: "TLS_AES_256_GCM_SHA384",
        symmetric_key_bits: 256,
      },
    },
    {
      id: "server_finished",
      sequence: 3,
      sender: "server",
      receiver: "client",
      message: "Finished",
      title: "Server confirms the handshake",
      description: "A MAC over the whole handshake.",
      purpose: "Verify integrity.",
      actual_data: null,
    },
  ],
};

afterEach(cleanup);

function progressText() {
  return screen.getByText(/Message \d+ of \d+/).textContent;
}

describe("rendering", () => {
  it("renders the backend sequence when one is supplied", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(progressText()).toBe("Message 1 of 3");
  });

  it("shows the reported TLS version", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    expect(screen.getByText("TLSv1.3")).toBeTruthy();
  });

  it("falls back to the TLS 1.3 model when the backend sends no steps", () => {
    render(
      <HandshakeVisualizer
        visualization={{ protocol_version: "TLSv1.3", steps: [] }}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(TLS_1_3_STEPS.length);
    expect(screen.getByText(/built-in TLS 1.3 model/)).toBeTruthy();
  });

  it("falls back to the TLS 1.2 model when nothing at all is supplied", () => {
    render(<HandshakeVisualizer />);

    expect(screen.getAllByRole("listitem")).toHaveLength(TLS_1_2_STEPS.length);
  });

  it("selects the model from tls.version when protocol_version is null", () => {
    render(
      <HandshakeVisualizer
        visualization={{ protocol_version: null, steps: [] }}
        tlsVersion="TLSv1.3"
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(TLS_1_3_STEPS.length);
  });

  it("never claims to have captured packets", () => {
    const { container } = render(
      <HandshakeVisualizer visualization={BACKEND_RESULT} />,
    );

    expect(container.textContent).toContain("not a packet capture");
  });
});

describe("real data", () => {
  it("shows observed values for the step that has them", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    fireEvent.click(screen.getByTestId("hv-row-server_hello").querySelector("button")!);

    expect(screen.getByText("TLS_AES_256_GCM_SHA384")).toBeTruthy();
    expect(screen.getByText("256 bits")).toBeTruthy();
  });

  it("explains the absence rather than showing null", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    fireEvent.click(
      screen.getByTestId("hv-row-server_finished").querySelector("button")!,
    );

    expect(screen.getByText(/No measured values for this message/)).toBeTruthy();
    expect(screen.queryByText("null")).toBeNull();
  });

  it("does not break when actual_data is missing entirely", () => {
    render(
      <HandshakeVisualizer
        visualization={{
          protocol_version: "TLSv1.2",
          steps: [
            {
              ...BACKEND_RESULT.steps[0],
              actual_data: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Client says hello")).toBeTruthy();
  });
});

describe("controls", () => {
  it("advances and rewinds one step at a time", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(progressText()).toBe("Message 2 of 3");

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(progressText()).toBe("Message 1 of 3");
  });

  it("disables Previous at the start and Next at the end", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    const previous = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });

    expect((previous as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(next);
    fireEvent.click(next);

    expect((next as HTMLButtonElement).disabled).toBe(true);
  });

  it("returns to the first step on Reset", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(progressText()).toBe("Message 1 of 3");
  });

  it("marks the current step for assistive technology", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const active = screen
      .getAllByRole("listitem")
      .filter((item) => item.getAttribute("aria-current") === "step");

    expect(active).toHaveLength(1);
    expect(active[0].getAttribute("data-testid")).toBe("hv-row-server_hello");
  });

  it("jumps to a step when its row is clicked", () => {
    render(<HandshakeVisualizer visualization={BACKEND_RESULT} />);

    fireEvent.click(
      screen.getByTestId("hv-row-server_finished").querySelector("button")!,
    );

    expect(progressText()).toBe("Message 3 of 3");
  });
});

describe("playback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Each step schedules the next timeout from an effect that only runs once
   * React has committed, so the clock has to be advanced one step at a time
   * rather than in a single jump.
   */
  function advanceSteps(count: number, stepDurationMs = 100) {
    for (let i = 0; i < count; i += 1) {
      act(() => {
        vi.advanceTimersByTime(stepDurationMs);
      });
    }
  }

  it("advances automatically while playing", () => {
    render(
      <HandshakeVisualizer visualization={BACKEND_RESULT} stepDurationMs={100} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(progressText()).toBe("Message 2 of 3");
  });

  it("stops advancing once paused", () => {
    render(
      <HandshakeVisualizer visualization={BACKEND_RESULT} stepDurationMs={100} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(progressText()).toBe("Message 2 of 3");
  });

  it("settles on the final step and offers a replay", () => {
    render(
      <HandshakeVisualizer visualization={BACKEND_RESULT} stepDurationMs={100} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    advanceSteps(2);

    expect(progressText()).toBe("Message 3 of 3");
    expect(screen.getByRole("button", { name: "Replay" })).toBeTruthy();
  });

  it("restarts from the beginning when replayed", () => {
    render(
      <HandshakeVisualizer visualization={BACKEND_RESULT} stepDurationMs={100} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    advanceSteps(2);

    fireEvent.click(screen.getByRole("button", { name: "Replay" }));

    expect(progressText()).toBe("Message 1 of 3");
  });

  it("runs one timer at a time", () => {
    const spy = vi.spyOn(window, "setTimeout");

    render(
      <HandshakeVisualizer visualization={BACKEND_RESULT} stepDurationMs={100} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);

    spy.mockRestore();
  });

  it("stops playing when the user steps manually", () => {
    render(
      <HandshakeVisualizer visualization={BACKEND_RESULT} stepDurationMs={100} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });
});
