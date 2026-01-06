import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.cookies?.token;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    if (!decoded) return res.status(401).json({ message: "Invalid token" });

    // Optionally fetch user to attach to request
    const user = await User.findById(decoded.id || decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = { id: user._id.toString(), name: user.name, email: user.email };
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
