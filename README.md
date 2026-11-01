# MKChat

MKChat is a greenfield social and real-time communication platform combining thoughtful publishing, communities, direct messaging, and AI-assisted discovery in one original product experience.

## Architecture

```text
client/                 React + Vite frontend (Vercel root)
  src/
server/                 Express + Socket.IO backend (Render root)
  src/server.js         HTTP and Socket.IO entry point
  src/models/           Mongoose models
  src/middleware/       Authentication middleware
API_DOCUMENTATION.md    REST API reference
```

## Run locally

```bash
npm install
npm install --prefix client
npm install --prefix server
npm run dev
npm run dev
```

- Web app: http://localhost:5173
- API health: http://localhost:5000/api/health

Copy `client/.env.example` to `client/.env` and `server/.env.example` to `server/.env`. The local setup uses MongoDB at `mongodb://127.0.0.1:27017/mkchat`. For MongoDB Atlas, replace only `server/.env`'s `MONGODB_URI` with the Atlas URI and never expose it to the client.

## Deployment

### Render backend

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Required variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, and `PORT` supplied by Render.
- Set `CLIENT_URL` to the deployed Vercel origin. Do not claim deployment until `/api/health` is reachable.

### Vercel frontend

- Root Directory: `client`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Required variables: `VITE_API_URL` pointing to the Render `/api` URL and `VITE_SOCKET_URL` pointing to the Render origin.
- `client/vercel.json` provides the React Router fallback.

## Status

The initial vertical slice includes the responsive MKChat shell, navigation, stories, composer interaction, feed cards, follow/toast interactions, theme switching, authenticated Socket.IO scaffolding, and a real login/register experience. The API includes database-backed registration, login, refresh rotation, protected profile lookup, and revocable logout when the required environment variables are configured.
