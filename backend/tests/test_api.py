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