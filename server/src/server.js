import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import express from "express";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import User from "./models/User.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const server = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const io = new Server(server, { cors: { origin: clientUrl, credentials: true } });
const refreshCookie = "mkchat_refresh";
const refreshDays = 7;
const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
  req.cookies = Object.fromEntries(
    (req.get("cookie") || "")
      .split(";")
      .filter(Boolean)
      .map((item) => {
        const [key, ...value] = item.trim().split("=");
        return [key, decodeURIComponent(value.join("="))];
      })
  );
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "mkchat-api", timestamp: new Date().toISOString() }));

function assertAuthConfig() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    const error = new Error("Authentication services are not configured.");
    error.status = 503;
    throw error;
  }
}

function publicUser(user) {
  return { id: user.id, name: user.name, username: user.username, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function issueTokens(user) {
  const accessToken = jwt.sign({ sub: user.id, type: "access" }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${refreshDays}d` });
  return { accessToken, refreshToken };
}

function setRefreshCookie(res, token) {
  res.cookie(refreshCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: refreshMaxAge,
    path: "/api/auth",
  });
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
}

app.post("/api/auth/register", async (req, res, next) => {
  try {
    assertAuthConfig();
    const { email, password, name } = req.body || {};
    const username = normalizeUsername(req.body?.username || name);
    if (!email || !password || !name || !username) return res.status(400).json({ message: "Name, username, email and password are required." });
    if (String(password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    if (!/^[a-z0-9_]{3,30}$/.test(username)) return res.status(400).json({ message: "Username must be 3-30 letters, numbers or underscores." });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (existing) return res.status(409).json({ message: "That email or username is already in use." });

    const user = await User.create({ name: String(name).trim(), username, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    const tokens = issueTokens(user);
    user.refreshTokens.push({ tokenHash: hashToken(tokens.refreshToken), expiresAt: new Date(Date.now() + refreshMaxAge), userAgent: req.get("user-agent") });
    await user.save();
    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({ user: publicUser(user), accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    assertAuthConfig();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Email or password is incorrect." });

    const tokens = issueTokens(user);
    user.refreshTokens.push({ tokenHash: hashToken(tokens.refreshToken), expiresAt: new Date(Date.now() + refreshMaxAge), userAgent: req.get("user-agent") });
    await user.save();
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user: publicUser(user), accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/refresh", async (req, res, next) => {
  try {
    assertAuthConfig();
    const token = req.cookies?.[refreshCookie];
    if (!token) return res.status(401).json({ message: "Refresh session not found." });
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (payload.type !== "refresh") return res.status(401).json({ message: "Refresh session is invalid." });
    const user = await User.findById(payload.sub);
    const tokenHash = hashToken(token);
    const stored = user?.refreshTokens.find((item) => item.tokenHash === tokenHash && item.expiresAt > new Date());
    if (!stored) return res.status(401).json({ message: "Refresh session is invalid or expired." });
    user.refreshTokens = user.refreshTokens.filter((item) => item.tokenHash !== tokenHash);
    const tokens = issueTokens(user);
    user.refreshTokens.push({ tokenHash: hashToken(tokens.refreshToken), expiresAt: new Date(Date.now() + refreshMaxAge), userAgent: req.get("user-agent") });
    await user.save();
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user: publicUser(user), accessToken: tokens.accessToken });
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") return res.status(401).json({ message: "Refresh session is invalid or expired." });
    next(error);
  }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    assertAuthConfig();
    const token = req.cookies?.[refreshCookie];
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        if (payload.type !== "refresh") throw new Error("Invalid refresh token type.");
        const user = await User.findById(payload.sub);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter((item) => item.tokenHash !== hashToken(token));
          await user.save();
        }
      } catch (error) {
        if (error.name !== "TokenExpiredError" && error.name !== "JsonWebTokenError") throw error;
      }
    }
    res.clearCookie(refreshCookie, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token || !process.env.JWT_SECRET) return next(new Error("Authentication required."));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "access") return next(new Error("Invalid access token."));
    socket.data.userId = payload.sub;
    next();
  } catch {
    next(new Error("Invalid or expired access token."));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.data.userId}`);
  socket.on("send-message", (message) => {
    if (!message?.recipientId || typeof message.text !== "string" || !message.text.trim()) return;
    io.to(`user:${message.recipientId}`).emit("message-received", {
      ...message,
      senderId: socket.data.userId,
      text: message.text.trim(),
    });
  });
  socket.on("typing", ({ recipientId, ...payload }) => io.to(`user:${recipientId}`).emit("typing", payload));
});

const port = Number(process.env.PORT) || 5000;
app.use((error, _req, res, _next) => {
  if (error.code === 11000) return res.status(409).json({ message: "That email or username is already in use." });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status === 500 ? "Something went wrong." : error.message });
});

async function start() {
  if (process.env.MONGODB_URI) await mongoose.connect(process.env.MONGODB_URI);
  else console.warn("MONGODB_URI is not configured; authentication routes will return 503.");
  server.listen(port, "0.0.0.0", () => console.log(`MKChat API listening on port ${port}`));
}

start().catch((error) => {
  console.error("Unable to start MKChat API:", error);
  process.exitCode = 1;
});
