import {
  executeQuery,
  executeQuerySingle,
  executeInsert,
  executeUpdate,
} from "./connection.js";

// Type definitions
export interface ContentSubmission {
  id: number;
  type: "fort-info" | "guide-contact" | "additional-info" | "trek-enquiry";
  title: string;
  content: any;
  submitted_by: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FortInfo {
  id: number;
  submission_id: number;
  fort_name: string;
  location: string;
  description?: string;
  difficulty?: string;
  duration?: string;
  best_time_to_visit?: string;
  entry_fee?: string;
  facilities?: string;
  safety_tips?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface GuideContact {
  id: number;
  submission_id: number;
  guide_name: string;
  phone: string;
  email?: string;
  experience?: string;
  specialization?: string;
  languages?: string;
  rate?: string;
  availability?: string;
  description?: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdditionalInfo {
  id: number;
  submission_id: number;
  title: string;
  category: string;
  content: string;
  related_fort?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface TrekEnquiry {
  id: number;
  submission_id: number;
  fort_name: string;
  preferred_date: string;
  number_of_people: number;
  duration?: string;
  customer_name: string;
  phone: string;
  email: string;
  special_requests?: string;
  enquiry_status:
    | "new"
    | "contacted"
    | "quoted"
    | "booked"
    | "completed"
    | "cancelled";
  assigned_to?: string;
  estimated_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalSubmissions: number;
  pendingApproval: number;
  approvedContent: number;
  rejectedContent: number;
  trekEnquiries: number;
  guideContacts: number;
  fortInfoSubmissions: number;
  additionalInfoSubmissions: number;
}

// Content Submissions Model
export class ContentSubmissionModel {
  static async getAll(
    filters: {
      type?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<ContentSubmission[]> {
    let query = "SELECT * FROM content_submissions WHERE 1=1";
    const params: any[] = [];

    if (filters.type && filters.type !== "all") {
      query += " AND type = ?";
      params.push(filters.type);
    }

    if (filters.status && filters.status !== "all") {
      query += " AND status = ?";
      params.push(filters.status);
    }

    query += " ORDER BY submitted_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(filters.offset);
      }
    }

    return await executeQuery<ContentSubmission>(query, params);
  }

  static async getById(id: number): Promise<ContentSubmission | null> {
    return await executeQuerySingle<ContentSubmission>(
      "SELECT * FROM content_submissions WHERE id = ?",
      [id],
    );
  }

  static async create(
    data: Omit<
      ContentSubmission,
      "id" | "submitted_at" | "created_at" | "updated_at"
    >,
  ): Promise<number> {
    const result = await executeInsert(
      `
      INSERT INTO content_submissions (type, title, content, submitted_by, status, admin_notes, reviewed_by, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        data.type,
        data.title,
        JSON.stringify(data.content),
        data.submitted_by,
        data.status || "pending",
        data.admin_notes || null,
        data.reviewed_by || null,
        data.reviewed_at || null,
      ],
    );

    return result.insertId;
  }

  static async updateStatus(
    id: number,
    status: "pending" | "approved" | "rejected",
    adminNotes?: string,
    reviewedBy?: string,
  ): Promise<boolean> {
    const result = await executeUpdate(
      `
      UPDATE content_submissions 
      SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `,
      [status, adminNotes || null, reviewedBy || null, id],
    );

    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await executeUpdate(
      "DELETE FROM content_submissions WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  static async getStats(): Promise<AdminStats> {
    const [totalResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions",
    );
    const [pendingResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions WHERE status = 'pending'",
    );
    const [approvedResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions WHERE status = 'approved'",
    );
    const [rejectedResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions WHERE status = 'rejected'",
    );
    const [trekResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions WHERE type = 'trek-enquiry'",
    );
    const [guideResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions WHERE type = 'guide-contact'",
    );
    const [fortResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions WHERE type = 'fort-info'",
    );
    const [infoResult] = await executeQuery(
      "SELECT COUNT(*) as count FROM content_submissions WHERE type = 'additional-info'",
    );

    return {
      totalSubmissions: totalResult.count,
      pendingApproval: pendingResult.count,
      approvedContent: approvedResult.count,
      rejectedContent: rejectedResult.count,
      trekEnquiries: trekResult.count,
      guideContacts: guideResult.count,
      fortInfoSubmissions: fortResult.count,
      additionalInfoSubmissions: infoResult.count,
    };
  }
}

// Guide Contacts Model
export class GuideContactModel {
  static async getApproved(
    filters: {
      searchTerm?: string;
      limit?: number;
    } = {},
  ): Promise<GuideContact[]> {
    let query = `
      SELECT gc.*, cs.submitted_at 
      FROM guide_contacts gc
      JOIN content_submissions cs ON gc.submission_id = cs.id
      WHERE cs.status = 'approved'
    `;
    const params: any[] = [];

    if (filters.searchTerm) {
      query +=
        " AND (gc.guide_name LIKE ? OR gc.specialization LIKE ? OR gc.description LIKE ?)";
      const searchPattern = `%${filters.searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += " ORDER BY gc.rating DESC, cs.submitted_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    return await executeQuery<GuideContact>(query, params);
  }

  static async create(submissionId: number, data: any): Promise<number> {
    const result = await executeInsert(
      `
      INSERT INTO guide_contacts (
        submission_id, guide_name, phone, email, experience, specialization,
        languages, rate, availability, description, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        submissionId,
        data.guideName,
        data.phone,
        data.email || null,
        data.experience || null,
        data.specialization || null,
        data.languages || null,
        data.rate || null,
        data.availability || null,
        data.description || null,
        1, // Auto-verify guides when approved (SQLite uses 1 for true)
      ],
    );

    return result.insertId;
  }

  static async updateRating(
    id: number,
    rating: number,
    totalReviews: number,
  ): Promise<boolean> {
    const result = await executeUpdate(
      `
      UPDATE guide_contacts 
      SET rating = ?, total_reviews = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [rating, totalReviews, id],
    );

    return result.affectedRows > 0;
  }
}

// Fort Info Model
export class FortInfoModel {
  static async getApproved(
    filters: {
      searchTerm?: string;
      difficulty?: string;
      limit?: number;
    } = {},
  ): Promise<FortInfo[]> {
    let query = `
      SELECT fi.*, cs.submitted_at, cs.submitted_by
      FROM fort_info fi
      JOIN content_submissions cs ON fi.submission_id = cs.id
      WHERE cs.status = 'approved'
    `;
    const params: any[] = [];

    if (filters.searchTerm) {
      query +=
        " AND (fi.fort_name LIKE ? OR fi.location LIKE ? OR fi.description LIKE ?)";
      const searchPattern = `%${filters.searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (filters.difficulty) {
      query += " AND fi.difficulty = ?";
      params.push(filters.difficulty);
    }

    query += " ORDER BY cs.submitted_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    const results = await executeQuery<any>(query, params);

    // Parse JSON fields
    return results.map((row) => ({
      ...row,
      images: row.images ? (typeof row.images === "string" ? JSON.parse(row.images) : row.images) : [],
    })) as FortInfo[];
  }

  static async getById(id: number): Promise<FortInfo | null> {
    const results = await executeQuery<any>(
      "SELECT * FROM fort_info WHERE id = ?",
      [id],
    );

    if (results.length === 0) return null;

    const row = results[0];
    return {
      ...row,
      images: row.images ? (typeof row.images === "string" ? JSON.parse(row.images) : row.images) : [],
    } as FortInfo;
  }

  static async create(submissionId: number, data: any): Promise<number> {
    const result = await executeInsert(
      `
      INSERT INTO fort_info (
        submission_id, fort_name, location, description, difficulty, duration,
        best_time_to_visit, entry_fee, facilities, safety_tips, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        submissionId,
        data.fortName,
        data.location,
        data.description || null,
        data.difficulty || null,
        data.duration || null,
        data.bestTimeToVisit || null,
        data.entryFee || null,
        data.facilities || null,
        data.safetyTips || null,
        JSON.stringify(data.images || []),
      ],
    );

    return result.insertId;
  }

  static async update(id: number, data: any): Promise<boolean> {
    // Get current fort data to merge with new images
    const currentFort = await FortInfoModel.getById(id);
    if (!currentFort) return false;

    let updatedImages = currentFort.images || [];

    // Add new images if provided
    if (data.newImages && data.newImages.length > 0) {
      updatedImages = [...updatedImages, ...data.newImages];
    }

    const result = await executeUpdate(
      `
      UPDATE fort_info SET
        fort_name = ?, location = ?, description = ?, difficulty = ?, duration = ?,
        best_time_to_visit = ?, entry_fee = ?, facilities = ?, safety_tips = ?, images = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        data.fortName,
        data.location,
        data.description || null,
        data.difficulty || null,
        data.duration || null,
        data.bestTimeToVisit || null,
        data.entryFee || null,
        data.facilities || null,
        data.safetyTips || null,
        JSON.stringify(updatedImages),
        id,
      ],
    );

    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await executeUpdate("DELETE FROM fort_info WHERE id = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  }
}

// Additional Info Model
export class AdditionalInfoModel {
  static async getApproved(
    filters: {
      category?: string;
      relatedFort?: string;
      limit?: number;
    } = {},
  ): Promise<AdditionalInfo[]> {
    let query = `
      SELECT ai.*, cs.submitted_at, cs.submitted_by
      FROM additional_info ai
      JOIN content_submissions cs ON ai.submission_id = cs.id
      WHERE cs.status = 'approved'
    `;
    const params: any[] = [];

    if (filters.category) {
      query += " AND ai.category = ?";
      params.push(filters.category);
    }

    if (filters.relatedFort) {
      query += " AND ai.related_fort LIKE ?";
      params.push(`%${filters.relatedFort}%`);
    }

    query += " ORDER BY ai.helpful_count DESC, cs.submitted_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    return await executeQuery<AdditionalInfo>(query, params);
  }

  static async create(submissionId: number, data: any): Promise<number> {
    const result = await executeInsert(
      `
      INSERT INTO additional_info (
        submission_id, title, category, content, related_fort
      ) VALUES (?, ?, ?, ?, ?)
    `,
      [
        submissionId,
        data.title,
        data.category,
        data.content,
        data.relatedFort || null,
      ],
    );

    return result.insertId;
  }

  static async incrementHelpfulCount(id: number): Promise<boolean> {
    const result = await executeUpdate(
      `
      UPDATE additional_info 
      SET helpful_count = helpful_count + 1, updated_at = NOW()
      WHERE id = ?
    `,
      [id],
    );

    return result.affectedRows > 0;
  }
}

// Trek Enquiry Model
export class TrekEnquiryModel {
  static async getAll(
    filters: {
      status?: string;
      fortName?: string;
      limit?: number;
    } = {},
  ): Promise<TrekEnquiry[]> {
    let query = `
      SELECT te.*, cs.submitted_at, cs.status as submission_status
      FROM trek_enquiries te
      JOIN content_submissions cs ON te.submission_id = cs.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status && filters.status !== "all") {
      query += " AND te.enquiry_status = ?";
      params.push(filters.status);
    }

    if (filters.fortName) {
      query += " AND te.fort_name LIKE ?";
      params.push(`%${filters.fortName}%`);
    }

    query += " ORDER BY cs.submitted_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    return await executeQuery<TrekEnquiry>(query, params);
  }

  static async create(submissionId: number, data: any): Promise<number> {
    const result = await executeInsert(
      `
      INSERT INTO trek_enquiries (
        submission_id, fort_name, preferred_date, number_of_people, duration,
        customer_name, phone, email, special_requests, enquiry_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        submissionId,
        data.fortName,
        data.preferredDate,
        parseInt(data.numberOfPeople),
        data.duration || null,
        data.customerName,
        data.phone,
        data.email,
        data.specialRequests || null,
        "new",
      ],
    );

    return result.insertId;
  }

  static async updateStatus(
    id: number,
    status: string,
    assignedTo?: string,
    estimatedCost?: number,
    notes?: string,
  ): Promise<boolean> {
    const result = await executeUpdate(
      `
      UPDATE trek_enquiries 
      SET enquiry_status = ?, assigned_to = ?, estimated_cost = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [status, assignedTo || null, estimatedCost || null, notes || null, id],
    );

    return result.affectedRows > 0;
  }

  static async getById(id: number): Promise<TrekEnquiry | null> {
    return await executeQuerySingle<TrekEnquiry>(
      "SELECT * FROM trek_enquiries WHERE id = ?",
      [id],
    );
  }
}

// File Upload Model
export class FileUploadModel {
  static async create(
    submissionId: number,
    fileData: {
      originalName: string;
      storedName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    },
  ): Promise<number> {
    const result = await executeInsert(
      `
      INSERT INTO file_uploads (
        submission_id, original_name, stored_name, file_path, file_size, mime_type, upload_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        submissionId,
        fileData.originalName,
        fileData.storedName,
        fileData.filePath,
        fileData.fileSize,
        fileData.mimeType,
        "completed",
      ],
    );

    return result.insertId;
  }

  static async getBySubmissionId(submissionId: number): Promise<any[]> {
    return await executeQuery(
      "SELECT * FROM file_uploads WHERE submission_id = ?",
      [submissionId],
    );
  }
}
