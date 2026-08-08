import { Router } from "express";
import { z } from "zod";
import { AuthService, UserModel, SessionModel, RegisterData, LoginData } from "../database/auth-models.js";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Middleware to extract auth token
const extractAuthToken = (req: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies
  return req.cookies?.authToken;
};

// Middleware to require authentication
export const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = extractAuthToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Middleware to require admin role
export const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = extractAuthToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await AuthService.getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    // if (user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Admin access required",
    //   });
    // }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }
};

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterData;
    
    const authResponse = await AuthService.register(validatedData);
    
    // Set HTTP-only cookie for token
    res.cookie('authToken', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: "Registration successful",
      data: {
        user: authResponse.user,
        expiresAt: authResponse.expiresAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginData;
    
    const authResponse = await AuthService.login(validatedData);
    
    // Set HTTP-only cookie for token
    res.cookie('authToken', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: authResponse.user,
        expiresAt: authResponse.expiresAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
});

// Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const token = extractAuthToken(req);
    
    if (token) {
      await AuthService.logout(token);
    }
    
    res.clearCookie('authToken');
    
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// Get current user endpoint
router.get("/me", async (req, res) => {
  try {
    const token = extractAuthToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const user = await AuthService.getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
});

// Change password endpoint
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await UserModel.findById((req as any).user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isValidCurrentPassword = await UserModel.verifyPassword(currentPassword, user.password_hash);
    if (!isValidCurrentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const updated = await UserModel.updatePassword(user.id, newPassword);
    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update password",
      });
    }

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
});

// Admin: Get all users
router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const { role, limit, offset } = req.query;
    
    const filters = {
      role: role as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const users = await UserModel.getAllUsers(filters);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
});

// Clean up expired sessions (can be called by a cron job)
router.post("/cleanup-sessions", async (req, res) => {
  try {
    await SessionModel.cleanExpiredSessions();
    
    res.json({
      success: true,
      message: "Expired sessions cleaned up",
    });
  } catch (error) {
    console.error("Session cleanup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup sessions",
    });
  }
});

export default router;
