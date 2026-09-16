import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorMessage from "../components/ErrorMessage";

describe("ErrorHandling Component", () => {
  it("renders structured error message and error code badge", () => {
    render(
      <ErrorMessage
        error="DNS resolution failed for hostname non-existent.invalid"
        code="DNS_RESOLUTION_FAILED"
        targetUrl="https://non-existent.invalid"
      />
    );

    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-code")).toHaveTextContent("DNS_RESOLUTION_FAILED");
    expect(screen.getByTestId("error-text")).toHaveTextContent("DNS resolution failed");
    expect(screen.getByText(/non-existent.invalid/i)).toBeInTheDocument();
  });

  it("renders user-friendly troubleshooting hint based on error code", () => {
    render(
      <ErrorMessage
        error="Connection reset during handshake"
        code="TLS_HANDSHAKE_FAILED"
      />
    );

    expect(screen.getByText(/The remote host failed or rejected the TLS handshake/i)).toBeInTheDocument();
  });

  it("handles retry button callback when clicked", () => {
    const handleRetry = vi.fn();
    render(
      <ErrorMessage
        error="Timeout reaching endpoint"
        code="CONNECTION_TIMEOUT"
        onRetry={handleRetry}
      />
    );

    const retryBtn = screen.getByTestId("retry-btn");
    fireEvent.click(retryBtn);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders fallback text safely when missing error object or null fields", () => {
    render(<ErrorMessage error={null} />);

    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-code")).toHaveTextContent("ERR_UNKNOWN");
  });
});
