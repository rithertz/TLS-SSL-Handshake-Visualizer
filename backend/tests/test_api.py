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