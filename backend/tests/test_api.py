from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_endpoint_rejects_non_https_url():
    response = client.post(
        "/analyze",
        json={"url": "http://example.com"},
    )

    assert response.status_code == 400

    body = response.json()

    assert "detail" in body
    assert body["detail"] == "Only HTTPS URLs are supported."