import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
    return res.status(503).json({ message: "Authentication services are not configured." });
  }

  const header = req.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return res.status(401).json({ message: "Authentication required." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "access") return res.status(401).json({ message: "Your access token is invalid." });
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "Your session is no longer valid." });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your access token is invalid or expired." });
    }
    next(error);
  }
}
