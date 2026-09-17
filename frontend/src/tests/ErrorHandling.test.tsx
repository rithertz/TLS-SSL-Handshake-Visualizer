import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorMessage from "../components/ErrorMessage";

describe("ErrorHandling Component", () => {
  it("renders structured error message and error code badge for NETWORK_ERROR", () => {
    // NETWORK_ERROR is the code the backend returns for DNS resolution failures
    render(
      <ErrorMessage
        error="DNS resolution failed for hostname non-existent.invalid"
        code="NETWORK_ERROR"
        targetUrl="https://non-existent.invalid"
      />
    );

    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-code")).toHaveTextContent("NETWORK_ERROR");
    expect(screen.getByTestId("error-text")).toHaveTextContent("DNS resolution failed");
    expect(screen.getByTestId("error-text")).toHaveTextContent("non-existent.invalid");
  });

  it("renders user-friendly troubleshooting hint for CONNECTION_FAILED", () => {
    // CONNECTION_FAILED is the code the backend/api layer returns for connection failures
    render(
      <ErrorMessage
        error="Connection reset during handshake"
        code="CONNECTION_FAILED"
      />
    );

    expect(screen.getByText(/The connection timed out while reaching the host/i)).toBeInTheDocument();
  });

  it("handles retry button callback when clicked", () => {
    const handleRetry = vi.fn();
    render(
      <ErrorMessage
        error="Unable to connect to the backend analysis server"
        code="CONNECTION_FAILED"
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
