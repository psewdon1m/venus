// Common utility types

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Service result wrapper
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Nullable and Optional helpers
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Deep partial
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Make specific keys required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make specific keys optional
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Timestamp fields
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// Soft delete
export interface SoftDelete {
  deletedAt: Date | null;
}

// ID types
export type UUID = string;
export type Slug = string;

// Filter operators
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like';

export interface Filter<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
}

// Sort
export interface Sort<T> {
  field: keyof T;
  order: 'asc' | 'desc';
}

// Query options
export interface QueryOptions<T> {
  filters?: Filter<T>[];
  sort?: Sort<T>[];
  pagination?: PaginationParams;
}
