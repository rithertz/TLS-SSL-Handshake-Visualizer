from app.services.analysis_service import analyze_url


def test_analyze_url_integrates_validation_tls_and_security(monkeypatch):
    """Verify that URL validation, TLS analysis, and security scoring are integrated."""

    mock_tls_data = {
        "resolved_ips": ["93.184.216.34"],
        "tls_version": "TLSv1.3",
        "cipher": {
            "name": "TLS_AES_256_GCM_SHA384",
            "protocol": "TLSv1.3",
            "bits": 256,
        },
        "certificate": {
            "subject": "CN=example.com",
            "issuer": "CN=Example CA",
            "valid_from": "2026-01-01T00:00:00+00:00",
            "valid_until": "2027-01-01T00:00:00+00:00",
            "san": ["example.com"],
            "serial_number": "123456789",
            "hostname_match": True,
            "self_signed": False,
        },
    }

    mock_security_data = {
        "score": 92,
        "grade": "A",
        "findings": [],
        "recommendations": [],
    }

    monkeypatch.setattr(
        "app.services.analysis_service.analyze_tls",
        lambda hostname: mock_tls_data,
    )

    monkeypatch.setattr(
        "app.services.analysis_service.score_security",
        lambda tls_version, certificate: mock_security_data,
    )

    result = analyze_url("https://example.com")

    assert result["analysis_status"] == "SUCCESS"

    assert result["target"]["url"] == "https://example.com"
    assert result["target"]["hostname"] == "example.com"
    assert result["target"]["port"] == 443

    assert result["network"]["resolved_ips"] == ["93.184.216.34"]

    assert result["tls"]["version"] == "TLSv1.3"
    assert result["tls"]["cipher"]["name"] == "TLS_AES_256_GCM_SHA384"

    assert result["certificate"]["subject"] == "CN=example.com"
    assert result["certificate"]["issuer"] == "CN=Example CA"
    assert result["certificate"]["hostname_match"] is True

    assert result["security"] == mock_security_data

    assert result["visualization"] is None
    assert result["error"] is None


def test_analyze_url_handles_connection_timeout(monkeypatch):
    """Verify that a TLS connection timeout returns a structured failure response."""

    def raise_timeout(hostname):
        raise TimeoutError()

    monkeypatch.setattr(
        "app.services.analysis_service.analyze_tls",
        raise_timeout,
    )

    result = analyze_url("https://example.com")

    assert result["analysis_status"] == "FAILED"

    assert result["target"]["url"] == "https://example.com"
    assert result["target"]["hostname"] == "example.com"
    assert result["target"]["port"] == 443

    assert result["network"] is None
    assert result["tls"] is None
    assert result["certificate"] is None
    assert result["security"] is None
    assert result["visualization"] is None

    assert result["error"]["code"] == "CONNECTION_TIMEOUT"
    assert result["error"]["message"] == (
        "The target server did not respond within the allowed time."
    )


def test_analyze_url_handles_network_error(monkeypatch):
    """Verify that a network error returns a structured failure response."""

    def raise_network_error(hostname):
        raise OSError("Connection refused")

    monkeypatch.setattr(
        "app.services.analysis_service.analyze_tls",
        raise_network_error,
    )

    result = analyze_url("https://example.com")

    assert result["analysis_status"] == "FAILED"

    assert result["target"]["url"] == "https://example.com"
    assert result["target"]["hostname"] == "example.com"
    assert result["target"]["port"] == 443

    assert result["network"] is None
    assert result["tls"] is None
    assert result["certificate"] is None
    assert result["security"] is None
    assert result["visualization"] is None

    assert result["error"]["code"] == "NETWORK_ERROR"
    assert result["error"]["message"] == "Connection refused"

def test_analyze_url_handles_unexpected_analysis_error(monkeypatch):
    """Verify that an unexpected analysis error returns a structured failure response."""

    def raise_analysis_error(hostname):
        raise RuntimeError("Unexpected analysis failure")

    monkeypatch.setattr(
        "app.services.analysis_service.analyze_tls",
        raise_analysis_error,
    )

    result = analyze_url("https://example.com")

    assert result["analysis_status"] == "FAILED"

    assert result["target"]["url"] == "https://example.com"
    assert result["target"]["hostname"] == "example.com"
    assert result["target"]["port"] == 443

    assert result["network"] is None
    assert result["tls"] is None
    assert result["certificate"] is None
    assert result["security"] is None
    assert result["visualization"] is None

    assert result["error"]["code"] == "ANALYSIS_ERROR"
    assert result["error"]["message"] == "Unexpected analysis failure"


def test_analyze_url_handles_dns_resolution_error(monkeypatch):
    """Verify that a DNS resolution failure returns a structured failure response."""
    import socket

    def raise_dns_error(hostname):
        raise socket.gaierror(-2, "Name or service not known")

    monkeypatch.setattr(
        "app.services.analysis_service.analyze_tls",
        raise_dns_error,
    )

    result = analyze_url("https://invalid.domain.example")

    assert result["analysis_status"] == "FAILED"

    assert result["target"]["url"] == "https://invalid.domain.example"
    assert result["target"]["hostname"] == "invalid.domain.example"
    assert result["target"]["port"] == 443

    assert result["network"] is None
    assert result["tls"] is None
    assert result["certificate"] is None
    assert result["security"] is None
    assert result["visualization"] is None

    assert result["error"]["code"] == "NETWORK_ERROR"
    assert "Name or service not known" in result["error"]["message"]
