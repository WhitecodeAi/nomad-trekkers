import { string } from "zod";
import { executeQuery, executeUpdate, executeInsert } from "./connection";

function formatMySQLTimestamp(date: Date | string): string {
  if(typeof(date) == 'string'){
    return date.slice(0, 19).replace('T', ' ');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function safeParseJSON<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string') {
    if (Array.isArray(value) || typeof value === 'object') {
      return value as T;
    }
    return fallback;
  }

  const normalizeJsonLike = (text: string): string => {
    // Accept JS-style arrays/objects with single quotes
    return text
      .replace(/(['"])?([a-zA-Z0-9_\- ]+)(['"])?:/g, '"$2":')
      .replace(/'/g, '"');
  };

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    try {
      const normalized = normalizeJsonLike(value);
      return JSON.parse(normalized) as T;
    } catch (normalizedError) {
      console.warn('Failed to parse JSON value:', value, normalizedError);
      return fallback;
    }
  }
}

export interface TrekPlanDB {
  id: string;
  user_id?: number;
  name: string;
  description?: string;
  selected_forts: string; // JSON string
  trek_date?: string;
  group_size?: string;
  experience?: string;
  preferences?: string; // JSON string
  notes?: string;
  estimated_duration?: string;
  total_distance?: number;
  difficulty?: 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
  gear_checklist?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface TrekPlan {
  id: string;
  userId?: number;
  name: string;
  description?: string;
  selectedForts: number[];
  trekDate?: string;
  groupSize?: string;
  experience?: string;
  preferences: string[];
  notes?: string;
  estimatedDuration?: string;
  totalDistance?: number;
  difficulty?: 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
  gearChecklist: GearItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GearItem {
  id: string;
  item: string;
  essential: boolean;
  checked: boolean;
  category: 'clothing' | 'equipment' | 'food' | 'safety' | 'navigation' | 'other';
}

export interface TrekPlanSummary {
  id: string;
  name: string;
  selectedFortsCount: number;
  trekDate?: string;
  difficulty?: string;
  createdAt: Date;
}

export class TrekPlanService {
  static generateId(): string {
    return `trek-plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async create(data: Omit<TrekPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrekPlan> {
    const id = this.generateId();
    let now = new Date().toISOString();
    now = now.slice(0, 19).replace('T', ' ');
    data.trekDate = data.trekDate.slice(0, 19).replace('T', ' ');

    await executeInsert(`
      INSERT INTO trek_plans (
        id, user_id, name, description, selected_forts, trek_date,
        group_size, experience, preferences, notes, estimated_duration,
        total_distance, difficulty, gear_checklist, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.userId || null,
      data.name,
      data.description || null,
      JSON.stringify(data.selectedForts),
      data.trekDate || null,
      data.groupSize || null,
      data.experience || null,
      JSON.stringify(data.preferences),
      data.notes || null,
      data.estimatedDuration || null,
      data.totalDistance || null,
      data.difficulty || null,
      JSON.stringify(data.gearChecklist),
      now,
      now
    ]);

    return {
      ...data,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  static async findById(id: string): Promise<TrekPlan | null> {
    const result = await executeQuery<TrekPlanDB>(
      'SELECT * FROM trek_plans WHERE id = ?',
      [id]
    );

    if (result.length === 0) {
      return null;
    }

    return this.dbToModel(result[0]);
  }

  static async findAll(options: {
    userId?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
  } = {}): Promise<TrekPlan[]> {
    let query = 'SELECT * FROM trek_plans';
    const params: any[] = [];

    if (options.userId) {
      query += ' WHERE user_id = ?';
      params.push(options.userId);
    }

    // Add sorting
    const sortBy = options.sortBy || 'created_at';
    const sortColumn = sortBy === 'name' ? 'name' :
                      sortBy === 'updatedAt' ? 'updated_at' :
                      sortBy === 'trekDate' ? 'trek_date' :
                      'created_at';
    
    query += ` ORDER BY ${sortColumn} DESC`;

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const result = await executeQuery<TrekPlanDB>(query, params);
    return result.map(this.dbToModel);
  }

  static async update(id: string, data: Partial<Omit<TrekPlan, 'id' | 'createdAt'>>): Promise<TrekPlan | null> {
    const updateFields: string[] = [];
    const params: any[] = [];
    data.trekDate = formatMySQLTimestamp(data.trekDate);

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      params.push(data.description);
    }
    if (data.selectedForts !== undefined) {
      updateFields.push('selected_forts = ?');
      params.push(JSON.stringify(data.selectedForts));
    }
    if (data.trekDate !== undefined) {
      updateFields.push('trek_date = ?');
      params.push(data.trekDate);
    }
    if (data.groupSize !== undefined) {
      updateFields.push('group_size = ?');
      params.push(data.groupSize);
    }
    if (data.experience !== undefined) {
      updateFields.push('experience = ?');
      params.push(data.experience);
    }
    if (data.preferences !== undefined) {
      updateFields.push('preferences = ?');
      params.push(JSON.stringify(data.preferences));
    }
    if (data.notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(data.notes);
    }
    if (data.estimatedDuration !== undefined) {
      updateFields.push('estimated_duration = ?');
      params.push(data.estimatedDuration);
    }
    if (data.totalDistance !== undefined) {
      updateFields.push('total_distance = ?');
      params.push(data.totalDistance);
    }
    if (data.difficulty !== undefined) {
      updateFields.push('difficulty = ?');
      params.push(data.difficulty);
    }
    if (data.gearChecklist !== undefined) {
      updateFields.push('gear_checklist = ?');
      params.push(JSON.stringify(data.gearChecklist));
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updated_at = ?');
    params.push(formatMySQLTimestamp(new Date()));
    params.push(id);

    await executeUpdate(
      `UPDATE trek_plans SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await executeUpdate(
      'DELETE FROM trek_plans WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  static async getCount(userId?: number): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM trek_plans';
    const params: any[] = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }

    const result = await executeQuery<{count: number}>(query, params);
    return result[0].count;
  }

  static createSummary(plan: TrekPlan): TrekPlanSummary {
    return {
      id: plan.id,
      name: plan.name,
      selectedFortsCount: plan.selectedForts.length,
      trekDate: plan.trekDate,
      difficulty: plan.difficulty,
      createdAt: plan.createdAt
    };
  }

  private static dbToModel(dbRow: TrekPlanDB): TrekPlan {
    return {
      id: dbRow.id,
      userId: dbRow.user_id || undefined,
      name: dbRow.name,
      description: dbRow.description || undefined,
      selectedForts: safeParseJSON<number[]>(dbRow.selected_forts, []),
      trekDate: dbRow.trek_date || undefined,
      groupSize: dbRow.group_size || undefined,
      experience: dbRow.experience || undefined,
      preferences: safeParseJSON<string[]>(dbRow.preferences, []),
      notes: dbRow.notes || undefined,
      estimatedDuration: dbRow.estimated_duration || undefined,
      totalDistance: dbRow.total_distance || undefined,
      difficulty: dbRow.difficulty || undefined,
      gearChecklist: safeParseJSON<GearItem[]>(dbRow.gear_checklist, []),
      createdAt: new Date(dbRow.created_at),
      updatedAt: new Date(dbRow.updated_at)
    };
  }
}
