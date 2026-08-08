import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sqliteHelpers } from "../database/sqlite-adapter.js";

const router = Router();

// Ensure upload directory exists
const uploadDir = "uploads/fort-images/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
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

// Submit fort information
router.post(
  "/submit-fort-info",
  upload.array("images", 5),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const imageFilenames = files ? files.map((file) => file.filename) : [];

      const fortData = {
        fortName: req.body.fortName,
        location: req.body.location,
        description: req.body.description,
        difficulty: req.body.difficulty,
        duration: req.body.duration,
        bestTimeToVisit: req.body.bestTimeToVisit,
        entryFee: req.body.entryFee,
        facilities: req.body.facilities,
        safetyTips: req.body.safetyTips,
        images: imageFilenames,
      };

      // Create content submission
      const result = sqliteHelpers.createSubmission(
        "fort-info",
        `${fortData.fortName} Information`,
        JSON.stringify(fortData),
        req.body.submittedBy || "Anonymous User",
        "pending",
      );

      // Save file upload records
      if (files && files.length > 0) {
        for (const file of files) {
          sqliteHelpers.createFileUpload(
            Number(result.lastInsertRowid),
            file.originalname,
            file.filename,
            file.path,
            file.size,
            file.mimetype,
          );
        }
      }

      res.json({
        success: true,
        message: "Fort information submitted successfully",
        data: { id: result.lastInsertRowid },
      });
    } catch (error) {
      console.error("Error submitting fort info:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit fort information",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Submit guide contact
router.post("/submit-guide-contact", async (req, res) => {
  try {
    const guideData = {
      guideName: req.body.guideName,
      phone: req.body.phone,
      email: req.body.email,
      experience: req.body.experience,
      specialization: req.body.specialization,
      languages: req.body.languages,
      rate: req.body.rate,
      availability: req.body.availability,
      description: req.body.description,
    };

    const result = sqliteHelpers.createSubmission(
      "guide-contact",
      `Guide Contact - ${guideData.guideName}`,
      JSON.stringify(guideData),
      req.body.submittedBy || guideData.guideName,
      "pending",
    );

    res.json({
      success: true,
      message: "Guide contact submitted successfully",
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error("Error submitting guide contact:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit guide contact",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Submit additional information
router.post("/submit-additional-info", async (req, res) => {
  try {
    const additionalData = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content,
      relatedFort: req.body.relatedFort,
    };

    const result = sqliteHelpers.createSubmission(
      "additional-info",
      additionalData.title,
      JSON.stringify(additionalData),
      req.body.submittedBy || "Anonymous User",
      "pending",
    );

    res.json({
      success: true,
      message: "Additional information submitted successfully",
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error("Error submitting additional info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit additional information",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Submit trek enquiry
router.post("/submit-trek-enquiry", async (req, res) => {
  try {
    const trekData = {
      fortName: req.body.fortName,
      preferredDate: req.body.preferredDate,
      numberOfPeople: req.body.numberOfPeople,
      duration: req.body.duration,
      customerName: req.body.customerName,
      phone: req.body.phone,
      email: req.body.email,
      specialRequests: req.body.specialRequests,
    };

    const result = sqliteHelpers.createSubmission(
      "trek-enquiry",
      `Trek Enquiry - ${trekData.fortName}`,
      JSON.stringify(trekData),
      trekData.customerName,
      "pending",
    );

    res.json({
      success: true,
      message:
        "Trek enquiry submitted successfully. Our team will contact you soon.",
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error("Error submitting trek enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit trek enquiry",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all content submissions (admin)
router.get("/admin/content-submissions", async (req, res) => {
  try {
    const { type = "all", status = "all", limit = 50, offset = 0 } = req.query;

    const submissions = sqliteHelpers.getAllSubmissions(
      type as string,
      status as string,
      parseInt(limit as string),
      parseInt(offset as string),
    );

    // Parse JSON content for each submission
    const formattedSubmissions = submissions.map((sub: any) => ({
      ...sub,
      content:
        typeof sub.content === "string" ? JSON.parse(sub.content) : sub.content,
    }));

    res.json({
      success: true,
      data: formattedSubmissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get admin statistics
router.get("/admin/content-stats", async (req, res) => {
  try {
    const stats = {
      totalSubmissions: (sqliteHelpers.getStats.total() as any)?.count || 0,
      pendingApproval: (sqliteHelpers.getStats.pending() as any)?.count || 0,
      approvedContent: (sqliteHelpers.getStats.approved() as any)?.count || 0,
      rejectedContent: (sqliteHelpers.getStats.rejected() as any)?.count || 0,
      trekEnquiries:
        (sqliteHelpers.getStats.byType("trek-enquiry") as any)?.count || 0,
      guideContacts:
        (sqliteHelpers.getStats.byType("guide-contact") as any)?.count || 0,
      fortInfoSubmissions:
        (sqliteHelpers.getStats.byType("fort-info") as any)?.count || 0,
      additionalInfoSubmissions:
        (sqliteHelpers.getStats.byType("additional-info") as any)?.count || 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update submission status (admin)
router.patch("/admin/content-submissions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const submissionId = parseInt(id);
    if (isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    // Check if submission exists
    const submission = sqliteHelpers.getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Update submission status
    const result = sqliteHelpers.updateSubmissionStatus(
      status,
      adminNotes || null,
      "admin",
      new Date().toISOString(),
      submissionId,
    );

    if (result.changes === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to update submission status",
      });
    }

    res.json({
      success: true,
      message: `Submission ${status} successfully`,
      data: { id: submissionId, status },
    });
  } catch (error) {
    console.error("Error updating submission status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update submission status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get approved guide contacts (public)
router.get("/approved-guides", async (req, res) => {
  try {
    const { search = "", limit = 50 } = req.query;

    const searchPattern = search ? `%${search}%` : "";
    const guides = sqliteHelpers.getApprovedGuides(
      searchPattern ? (search as string) : "",
      searchPattern,
      parseInt(limit as string),
    );

    // Parse and format guide data
    const formattedGuides = guides.map((guide: any) => {
      const content =
        typeof guide.content === "string"
          ? JSON.parse(guide.content)
          : guide.content;
      return {
        id: guide.id,
        ...content,
        submitted_at: guide.submitted_at,
      };
    });

    res.json({
      success: true,
      data: formattedGuides,
    });
  } catch (error) {
    console.error("Error fetching approved guides:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch guide contacts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get approved additional information (public)
router.get("/approved-info", async (req, res) => {
  try {
    const { fort = "", category = "", limit = 50 } = req.query;

    const fortPattern = fort ? `%${fort}%` : "";
    const categoryPattern = category ? `%${category}%` : "";

    const info = sqliteHelpers.getApprovedInfo(
      fortPattern ? (fort as string) : "",
      fortPattern,
      categoryPattern ? (category as string) : "",
      categoryPattern,
      parseInt(limit as string),
    );

    // Parse and format info data
    const formattedInfo = info.map((item: any) => {
      const content =
        typeof item.content === "string"
          ? JSON.parse(item.content)
          : item.content;
      return {
        id: item.id,
        title: item.title,
        ...content,
        submitted_at: item.submitted_at,
        submitted_by: item.submitted_by,
      };
    });

    res.json({
      success: true,
      data: formattedInfo,
    });
  } catch (error) {
    console.error("Error fetching approved info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch additional information",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get trek enquiries (for admin and trek organizers)
router.get("/trek-enquiries", async (req, res) => {
  try {
    const { status = "all", limit = 50 } = req.query;

    const enquiries = sqliteHelpers.getTrekEnquiries(
      status as string,
      parseInt(limit as string),
    );

    // Parse and format enquiry data
    const formattedEnquiries = enquiries.map((enquiry: any) => {
      const content =
        typeof enquiry.content === "string"
          ? JSON.parse(enquiry.content)
          : enquiry.content;
      return {
        id: enquiry.id,
        ...content,
        submitted_at: enquiry.submitted_at,
        status: enquiry.status,
      };
    });

    res.json({
      success: true,
      data: formattedEnquiries,
    });
  } catch (error) {
    console.error("Error fetching trek enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trek enquiries",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
