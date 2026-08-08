import {
  executeQuery,
  executeQuerySingle,
  executeInsert,
  executeUpdate,
} from "./connection.js";

export interface FortReview {
  id: number;
  user_id: number | null; // Allow null for non-authenticated users
  fort_id?: number;
  fort_name: string;
  rating: number;
  review_text?: string;
  photos?: string[];
  visit_date?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string; // Joined from users table
  user_email?: string; // Joined from users table
}

export interface CreateReviewData {
  user_id: number | null; // Allow null for non-authenticated users
  fort_name: string;
  rating: number;
  review_text?: string;
  photos?: string[];
  visit_date?: string;
}

export class FortReviewModel {
  static async create(reviewData: CreateReviewData): Promise<number> {
    const result = await executeInsert(
      `
      INSERT INTO fort_reviews (user_id, fort_name, rating, review_text, photos, visit_date, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        reviewData.user_id,
        reviewData.fort_name,
        reviewData.rating,
        reviewData.review_text || null,
        JSON.stringify(reviewData.photos || []),
        reviewData.visit_date || null,
        1, // Auto-approve all reviews
      ],
    );

    return result.insertId;
  }

  static async getApproved(filters: {
    fort_name?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FortReview[]> {
    let query = `
      SELECT r.*, u.full_name as user_name, u.email as user_email
      FROM fort_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.is_approved = 1
    `;
    const params: any[] = [];

    if (filters.fort_name) {
      query += " AND r.fort_name = ?";
      params.push(filters.fort_name);
    }

    query += " ORDER BY r.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(filters.offset);
      }
    }

    const reviews = await executeQuery<FortReview>(query, params);
    
    // Parse photos JSON for each review
    return reviews.map(review => ({
      ...review,
      photos: review.photos ? JSON.parse(review.photos as any) : []
    }));
  }

  static async getPending(filters: {
    limit?: number;
    offset?: number;
  } = {}): Promise<FortReview[]> {
    let query = `
      SELECT r.*, u.full_name as user_name, u.email as user_email
      FROM fort_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.is_approved = 0
      ORDER BY r.created_at DESC
    `;
    const params: any[] = [];

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(filters.offset);
      }
    }

    const reviews = await executeQuery<FortReview>(query, params);
    
    return reviews.map(review => ({
      ...review,
      photos: review.photos ? JSON.parse(review.photos as any) : []
    }));
  }

  static async getById(id: number): Promise<FortReview | null> {
    const review = await executeQuerySingle<FortReview>(
      `
      SELECT r.*, u.full_name as user_name, u.email as user_email
      FROM fort_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `,
      [id],
    );

    if (review) {
      review.photos = review.photos ? JSON.parse(review.photos as any) : [];
    }

    return review;
  }

  static async updateApprovalStatus(id: number, isApproved: boolean): Promise<boolean> {
    const result = await executeUpdate(
      `
      UPDATE fort_reviews 
      SET is_approved = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [isApproved ? 1 : 0, id],
    );

    return result.affectedRows > 0;
  }

  static async getUserReviews(userId: number, filters: {
    limit?: number;
    offset?: number;
  } = {}): Promise<FortReview[]> {
    let query = `
      SELECT r.*, u.full_name as user_name, u.email as user_email
      FROM fort_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `;
    const params: any[] = [userId];

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(filters.offset);
      }
    }

    const reviews = await executeQuery<FortReview>(query, params);
    
    return reviews.map(review => ({
      ...review,
      photos: review.photos ? JSON.parse(review.photos as any) : []
    }));
  }

  static async delete(id: number): Promise<boolean> {
    const result = await executeUpdate(
      "DELETE FROM fort_reviews WHERE id = ?",
      [id],
    );

    return result.affectedRows > 0;
  }

  static async getAverageRating(fortName: string): Promise<number> {
    const result = await executeQuerySingle<{ avg_rating: number }>(
      `
      SELECT AVG(rating) as avg_rating 
      FROM fort_reviews 
      WHERE fort_name = ? AND is_approved = 1
    `,
      [fortName],
    );

    return result?.avg_rating || 0;
  }

  static async getReviewCount(fortName: string): Promise<number> {
    const result = await executeQuerySingle<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM fort_reviews 
      WHERE fort_name = ? AND is_approved = 1
    `,
      [fortName],
    );

    return result?.count || 0;
  }
}
