from fastapi.testclient import TestClient

from app.main import app


# Create a test client for sending requests directly to the FastAPI application.
client = TestClient(app)


def test_health_endpoint():
    """Verify that the backend health endpoint is available and operational."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_endpoint_rejects_non_https_url():
    """Verify that the analyze endpoint rejects URLs using HTTP instead of HTTPS."""
    response = client.post(
        "/analyze",
        json={"url": "http://example.com"},
    )

    assert response.status_code == 400

    body = response.json()

    assert "detail" in body
    assert body["detail"] == "Only HTTPS URLs are supported."


def test_analyze_endpoint_rejects_empty_url():
    """Verify that the analyze endpoint rejects an empty URL request."""
    response = client.post(
        "/analyze",
        json={"url": ""},
    )

    assert response.status_code == 422

    body = response.json()

    assert "detail" in body


def test_analyze_endpoint_rejects_credentials_in_url():
    """Verify that URLs containing usernames or passwords are rejected."""
    response = client.post(
        "/analyze",
        json={"url": "https://user:password@example.com"},
    )

    assert response.status_code == 400

    body = response.json()

    assert body["detail"] == "URLs containing credentials are not allowed."


def test_analyze_endpoint_rejects_non_443_https_port():
    """Verify that HTTPS URLs using a port other than 443 are rejected."""
    response = client.post(
        "/analyze",
        json={"url": "https://example.com:8443"},
    )

    assert response.status_code == 400

    body = response.json()

    assert body["detail"] == "Only HTTPS port 443 is supported."

def test_analyze_endpoint_rejects_missing_hostname():
    """Verify that HTTPS URLs without a valid hostname are rejected."""
    response = client.post(
        "/analyze",
        json={"url": "https://"},
    )

    assert response.status_code == 400

    body = response.json()

    assert body["detail"] == "URL must contain a valid hostname."


def test_analyze_endpoint_returns_success_response(monkeypatch):
    """Verify that a successful analysis returns the expected top-level API structure."""

    mock_result = {
        "analysis_status": "SUCCESS",
        "target": {
            "url": "https://example.com",
            "hostname": "example.com",
            "port": 443,
        },
        "network": {
            "resolved_ips": ["93.184.216.34"],
        },
        "tls": {
            "version": "TLSv1.3",
            "cipher": {
                "name": "TLS_AES_256_GCM_SHA384",
                "protocol": "TLSv1.3",
                "bits": 256,
            },
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
        "security": {
            "score": 100,
            "grade": "A",
            "findings": [],
            "recommendations": [],
        },
        "visualization": None,
        "error": None,
    }

    monkeypatch.setattr(
        "app.api.routes.analyze.analyze_url",
        lambda url: mock_result,
    )

    response = client.post(
        "/analyze",
        json={"url": "https://example.com"},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["analysis_status"] == "SUCCESS"
    assert body["target"]["hostname"] == "example.com"
    assert body["target"]["port"] == 443
    assert body["network"]["resolved_ips"] == ["93.184.216.34"]

    assert body["tls"]["version"] == "TLSv1.3"
    assert body["tls"]["cipher"]["name"] == "TLS_AES_256_GCM_SHA384"

    assert isinstance(body["certificate"], dict)
    assert isinstance(body["certificate"]["subject"], str)
    assert isinstance(body["certificate"]["issuer"], str)
    assert isinstance(body["certificate"]["san"], list)

    assert 0 <= body["security"]["score"] <= 100
    assert body["security"]["grade"] in ["A", "B", "C", "D", "E", "F"]

    assert body["visualization"] is None
    assert body["error"] is None

def test_analyze_endpoint_returns_structured_failure_response(monkeypatch):
    """Verify that a failed analysis returns the expected structured error response."""

    mock_result = {
        "analysis_status": "FAILED",
        "target": None,
        "network": None,
        "tls": None,
        "certificate": None,
        "security": None,
        "visualization": None,
        "error": {
            "code": "TLS_HANDSHAKE_FAILED",
            "message": "Unable to complete the TLS handshake.",
        },
    }

    monkeypatch.setattr(
        "app.api.routes.analyze.analyze_url",
        lambda url: mock_result,
    )

    response = client.post(
        "/analyze",
        json={"url": "https://example.com"},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["analysis_status"] == "FAILED"
    assert body["target"] is None
    assert body["network"] is None
    assert body["tls"] is None
    assert body["certificate"] is None
    assert body["security"] is None
    assert body["visualization"] is None

    assert isinstance(body["error"], dict)
    assert body["error"]["code"] == "TLS_HANDSHAKE_FAILED"
    assert body["error"]["message"] == "Unable to complete the TLS handshake."

def test_analyze_endpoint_handles_unexpected_analysis_error(monkeypatch):
    """Verify that an unexpected analysis exception is returned as an HTTP error."""

    def raise_analysis_error(url):
        raise RuntimeError("Unexpected analysis failure")

    monkeypatch.setattr(
        "app.api.routes.analyze.analyze_url",
        raise_analysis_error,
    )

    response = client.post(
        "/analyze",
        json={"url": "https://example.com"},
    )
    # NOTE: Current implementation returns 502.
    # API_CONTRACT.md specifies 500 for unexpected server-level failures.
    # This should be aligned to 500 after the backend changes are merged.
    assert response.status_code == 502

    body = response.json()

    assert "detail" in body
    assert body["detail"] == (
        "Unable to analyze the target: Unexpected analysis failure"
    )

def test_analyze_endpoint_matches_api_contract(monkeypatch):
    """Verify that a successful response matches the API contract structure and types."""

    mock_result = {
        "analysis_status": "SUCCESS",
        "target": {
            "url": "https://example.com",
            "hostname": "example.com",
            "port": 443,
        },
        "network": {
            "resolved_ips": ["93.184.216.34"],
        },
        "tls": {
            "version": "TLSv1.3",
            "cipher": {
                "name": "TLS_AES_256_GCM_SHA384",
                "protocol": "TLSv1.3",
                "bits": 256,
            },
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
        "security": {
            "score": 92,
            "grade": "A",
            "findings": [
                {
                    "rule_id": "TLS_VERSION",
                    "status": "PASS",
                    "severity": "INFO",
                    "title": "TLS version is supported",
                    "explanation": "The server negotiated TLS 1.3.",
                    "evidence": "TLSv1.3",
                }
            ],
            "recommendations": [
                {
                    "rule_id": "TLS_VERSION",
                    "text": "Prefer modern TLS configurations.",
                }
            ],
        },
        "visualization": None,
        "error": None,
    }

    monkeypatch.setattr(
        "app.api.routes.analyze.analyze_url",
        lambda url: mock_result,
    )

    response = client.post(
        "/analyze",
        json={"url": "https://example.com"},
    )

    assert response.status_code == 200

    body = response.json()

    # Verify required top-level fields.
    expected_fields = {
        "analysis_status",
        "target",
        "network",
        "tls",
        "certificate",
        "security",
        "visualization",
        "error",
    }

    assert set(body.keys()) == expected_fields

    # Verify analysis status.
    assert body["analysis_status"] in ["SUCCESS", "PARTIAL", "FAILED"]

    # Verify target structure.
    assert isinstance(body["target"], dict)
    assert isinstance(body["target"]["url"], str)
    assert isinstance(body["target"]["hostname"], str)
    assert isinstance(body["target"]["port"], int)

    # Verify network structure.
    assert isinstance(body["network"], dict)
    assert isinstance(body["network"]["resolved_ips"], list)
    assert all(isinstance(ip, str) for ip in body["network"]["resolved_ips"])

    # Verify TLS structure.
    assert isinstance(body["tls"], dict)
    assert body["tls"]["version"] is None or isinstance(
        body["tls"]["version"], str
    )

    assert isinstance(body["tls"]["cipher"], dict)
    assert body["tls"]["cipher"]["name"] is None or isinstance(
        body["tls"]["cipher"]["name"], str
    )
    assert body["tls"]["cipher"]["protocol"] is None or isinstance(
        body["tls"]["cipher"]["protocol"], str
    )
    assert body["tls"]["cipher"]["bits"] is None or isinstance(
        body["tls"]["cipher"]["bits"], int
    )

    # Verify certificate structure and nullability.
    assert isinstance(body["certificate"], dict)

    assert body["certificate"]["subject"] is None or isinstance(
        body["certificate"]["subject"], str
    )
    assert body["certificate"]["issuer"] is None or isinstance(
        body["certificate"]["issuer"], str
    )

    assert body["certificate"]["valid_from"] is None or isinstance(
        body["certificate"]["valid_from"], str
    )
    assert body["certificate"]["valid_until"] is None or isinstance(
        body["certificate"]["valid_until"], str
    )

    assert isinstance(body["certificate"]["san"], list)
    assert all(isinstance(name, str) for name in body["certificate"]["san"])

    assert body["certificate"]["serial_number"] is None or isinstance(
        body["certificate"]["serial_number"], str
    )

    assert body["certificate"]["hostname_match"] in [True, False, None]
    assert body["certificate"]["self_signed"] in [True, False, None]

    # Verify security structure.
    assert isinstance(body["security"], dict)
    assert isinstance(body["security"]["score"], int)
    assert 0 <= body["security"]["score"] <= 100
    assert body["security"]["grade"] in ["A", "B", "C", "D", "E", "F"]

    assert isinstance(body["security"]["findings"], list)
    assert isinstance(body["security"]["recommendations"], list)

    # Verify finding structure.
    for finding in body["security"]["findings"]:
        assert isinstance(finding["rule_id"], str)
        assert finding["status"] in ["PASS", "WARN", "FAIL"]
        assert finding["severity"] in [
            "INFO",
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL",
        ]
        assert isinstance(finding["title"], str)
        assert isinstance(finding["explanation"], str)

        evidence = finding.get("evidence")
        assert evidence is None or isinstance(evidence, (str, list))

    # Verify recommendation structure.
    for recommendation in body["security"]["recommendations"]:
        assert isinstance(recommendation["rule_id"], str)
        assert isinstance(recommendation["text"], str)

    # Successful analysis must have no error.
    assert body["error"] is None