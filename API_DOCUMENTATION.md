# MKChat API

The backend runs from `server/` and exposes REST endpoints under `/api`.

## Health

`GET /api/health`

Returns `{ "ok": true, "service": "mkchat-api", "timestamp": "..." }`.

## Authentication

### `POST /api/auth/register`

Request:

```json
{
  "name": "Alex Morgan",
  "username": "alexmorgan",
  "email": "alex@example.com",
  "password": "password123"
}
```

Returns a public user and short-lived `accessToken`. The refresh token is stored in an HttpOnly cookie.

### `POST /api/auth/login`

Accepts `email` and `password`. Returns a public user and access token.

### `POST /api/auth/refresh`

Rotates the HttpOnly refresh cookie and returns a new access token.

### `POST /api/auth/logout`

Revokes the current refresh session and clears the cookie.

### `GET /api/auth/me`

Requires `Authorization: Bearer <accessToken>`.

All authentication errors return a JSON `message` and an appropriate HTTP status.
