# MKChat

MKChat is a greenfield social and real-time communication platform combining thoughtful publishing, communities, direct messaging, and AI-assisted discovery in one original product experience.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

- Web app: http://localhost:5173
- API health: http://localhost:5000/api/health

The UI is runnable without external credentials. MongoDB and JWT secrets must be configured before authentication is enabled; Cloudinary and LLM credentials are still required for media uploads and AI features.

## Structure

- `src/` — React/Vite client and design system
- `server/` — Express and Socket.IO API entry point
- `.env.example` — required environment variable contract

## Status

The initial vertical slice includes the responsive MKChat shell, navigation, stories, composer interaction, feed cards, follow/toast interactions, theme switching, Socket.IO scaffolding, and a real login/register experience. The API includes database-backed registration, login, refresh rotation, protected profile lookup, and revocable logout when the required environment variables are configured.
