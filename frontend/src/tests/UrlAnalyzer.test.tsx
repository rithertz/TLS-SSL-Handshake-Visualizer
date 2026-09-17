import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UrlAnalyzer from "../components/UrlAnalyzer";

describe("UrlAnalyzer Component", () => {
  it("renders input field and submit button", () => {
    render(<UrlAnalyzer onAnalyze={vi.fn()} isLoading={false} />);
    
    expect(screen.getByLabelText(/TARGET HTTPS ENDPOINT/i)).toBeInTheDocument();
    expect(screen.getByTestId("analyze-submit-btn")).toBeInTheDocument();
  });

  it("handles empty submission with validation error", () => {
    const handleAnalyze = vi.fn();
    render(<UrlAnalyzer onAnalyze={handleAnalyze} isLoading={false} />);

    const submitBtn = screen.getByTestId("analyze-submit-btn");
    fireEvent.click(submitBtn);

    expect(screen.getByTestId("validation-error")).toBeInTheDocument();
    expect(screen.getByTestId("validation-error")).toHaveTextContent("Please enter a target website URL");
    expect(handleAnalyze).not.toHaveBeenCalled();
  });

  it("validates and normalizes valid HTTPS URL on submission", () => {
    const handleAnalyze = vi.fn();
    render(<UrlAnalyzer onAnalyze={handleAnalyze} isLoading={false} />);

    const input = screen.getByLabelText(/TARGET HTTPS ENDPOINT/i);
    fireEvent.change(input, { target: { value: "example.com" } });

    const submitBtn = screen.getByTestId("analyze-submit-btn");
    fireEvent.click(submitBtn);

    expect(handleAnalyze).toHaveBeenCalledWith("https://example.com");
  });

  it("rejects non-HTTPS URLs with explicit error", () => {
    const handleAnalyze = vi.fn();
    render(<UrlAnalyzer onAnalyze={handleAnalyze} isLoading={false} />);

    const input = screen.getByLabelText(/TARGET HTTPS ENDPOINT/i);
    fireEvent.change(input, { target: { value: "http://insecure-site.com" } });

    const submitBtn = screen.getByTestId("analyze-submit-btn");
    fireEvent.click(submitBtn);

    expect(screen.getByTestId("validation-error")).toHaveTextContent("Only HTTPS endpoints are supported");
    expect(handleAnalyze).not.toHaveBeenCalled();
  });

  it("disables input and button during loading state", () => {
    render(<UrlAnalyzer onAnalyze={vi.fn()} isLoading={true} />);

    const input = screen.getByLabelText(/TARGET HTTPS ENDPOINT/i);
    const submitBtn = screen.getByTestId("analyze-submit-btn");

    expect(input).toBeDisabled();
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Analyzing\.\.\./i)).toBeInTheDocument();
  });
});
