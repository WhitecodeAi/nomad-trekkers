import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { FortReviewModel } from "../database/review-models.js";
import { requireAuth, requireAdmin } from "./auth.js";

const router = Router();

// Ensure upload directory exists for review photos
const uploadDir = "uploads/review-photos/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for review photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "review-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Validation schema
const reviewSchema = z.object({
  fort_name: z.string().min(1, "Fort name is required"),
  rating: z.number().min(1).max(5),
  review_text: z.string().optional(),
  visit_date: z.string().optional(),
});

// Submit a review
router.post("/submit", upload.array("photos", 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const photoFilenames = files ? files.map((file) => `/uploads/review-photos/${file.filename}`) : [];

    const validatedData = reviewSchema.parse({
      fort_name: req.body.fort_name,
      rating: parseInt(req.body.rating),
      review_text: req.body.review_text,
      visit_date: req.body.visit_date,
    });

    const reviewId = await FortReviewModel.create({
      user_id: (req as any).user?.id || null, // Allow null for non-authenticated users
      fort_name: validatedData.fort_name,
      rating: validatedData.rating,
      review_text: validatedData.review_text,
      photos: photoFilenames,
      visit_date: validatedData.visit_date,
    });

    res.json({
      success: true,
      message: "Review submitted successfully!",
      data: { id: reviewId },
    });
  } catch (error) {
    console.error("Error submitting review:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get approved reviews for a fort
router.get("/fort/:fortName", async (req, res) => {
  try {
    const { fortName } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const reviews = await FortReviewModel.getApproved({
      fort_name: decodeURIComponent(fortName),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
});

// Get fort rating summary
router.get("/fort/:fortName/summary", async (req, res) => {
  try {
    const { fortName } = req.params;
    const decodedFortName = decodeURIComponent(fortName);

    const [averageRating, reviewCount] = await Promise.all([
      FortReviewModel.getAverageRating(decodedFortName),
      FortReviewModel.getReviewCount(decodedFortName),
    ]);

    res.json({
      success: true,
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount,
        fortName: decodedFortName,
      },
    });
  } catch (error) {
    console.error("Error fetching rating summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rating summary",
    });
  }
});

// Get user's reviews
router.get("/my-reviews", requireAuth, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const reviews = await FortReviewModel.getUserReviews((req as any).user.id, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
});

// Admin: Get pending reviews
router.get("/admin/pending", requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const reviews = await FortReviewModel.getPending({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending reviews",
    });
  }
});

// Admin: Approve/reject review
router.patch("/admin/:id/approval", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Approved field must be a boolean",
      });
    }

    const reviewId = parseInt(id);
    if (isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const updated = await FortReviewModel.updateApprovalStatus(reviewId, approved);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      message: `Review ${approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error("Error updating review approval:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review approval",
    });
  }
});

// Admin: Delete review
router.delete("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // Get review to delete associated photos
    const review = await FortReviewModel.getById(reviewId);
    
    if (review && review.photos) {
      // Delete photo files
      review.photos.forEach((photo: string) => {
        const photoPath = path.join(process.cwd(), 'uploads', 'review-photos', path.basename(photo));
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      });
    }

    const deleted = await FortReviewModel.delete(reviewId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
});

// Get all approved reviews (for general display)
router.get("/approved", async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const reviews = await FortReviewModel.getApproved({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching approved reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
});

// User delete review (no authentication required - just match by review ID)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // Get review to delete associated photos
    const review = await FortReviewModel.getById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.photos) {
      // Delete photo files
      review.photos.forEach((photo: string) => {
        const photoPath = path.join(process.cwd(), 'uploads', 'review-photos', path.basename(photo));
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      });
    }

    const deleted = await FortReviewModel.delete(reviewId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
});

export default router;
