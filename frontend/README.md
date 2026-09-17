# TLS/SSL Handshake Visualizer Frontend

React + TypeScript + Vite frontend for the TLS/SSL Handshake Visualizer &
Website Security Analyzer.

## Configuration

The frontend calls the FastAPI backend through `VITE_API_BASE_URL`.

Local development defaults to:

```text
http://127.0.0.1:8000
```

To configure it explicitly, copy the example file:

```powershell
Copy-Item .env.example .env
```

Keep `.env` local. It is ignored by Git.

Production builds must define `VITE_API_BASE_URL`; do not rely on the local
development default for deployed environments.

## Development

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173/
```

Keep the backend running separately from `../backend`:

```powershell
uvicorn app.main:app --reload
```

## Validation

```powershell
npm run test
npm run lint
npm run build
```

The visualizer renders conceptual TLS 1.2 / TLS 1.3 handshake steps enriched
with observed values from the backend response where available. It is not a raw
packet capture or browser network trace.
