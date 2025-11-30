import jwt from "jsonwebtoken";

// Enforce JWT_SECRET is configured
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  WARNING: JWT_SECRET not explicitly set. Using default fallback for development only.");
  console.warn("⚠️  For production, set JWT_SECRET in your .env file");
}

export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("[auth] No token provided in authorization header");
    return res.status(401).json({ message: "Access token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.error("[auth] Token verification failed");
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  console.log("[auth] Token verified for userId:", decoded.userId, "role:", decoded.role);
  req.user = decoded;
  next();
};

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    next();
  };
};
