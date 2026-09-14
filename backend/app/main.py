from fastapi import FastAPI

from app.api.routes.analyze import router as analyze_router


app = FastAPI(
    title="TLS/SSL Handshake Visualizer",
    description="Backend API for TLS handshake visualization and website security analysis.",
    version="0.1.0",
)

app.include_router(analyze_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
