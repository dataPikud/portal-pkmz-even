export interface User {
  id: string;
  employeeId: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  isContentAdmin: boolean;
}

export interface MainCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  mainCategoryId: number;
  systems?: System[];
}

export interface System {
  id: number;
  name: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  subCategoryId: number | null;
  subCategory?: SubCategory & { mainCategory?: MainCategory };
}

export type ContactType = 'תקלה' | 'רעיון' | 'דיווח' | 'אחר';

export interface ContactRequest {
  title: string;
  description: string;
  type: ContactType;
  employeeId: string;
}

// ===== חומרי הטמעה =====

export interface Video {
  id: number;
  title: string;
  description: string | null;
  fileName: string;
  thumbnailName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  duration: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

/** DTO for creating a video record (after file upload) */
export interface CreateVideoDto {
  title: string;
  description?: string;
  fileName: string;
  thumbnailName?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  sortOrder?: number;
}

/** DTO for updating video metadata */
export interface UpdateVideoDto {
  title?: string;
  description?: string;
  thumbnailName?: string | null;
  duration?: number;
  sortOrder?: number;
  isActive?: boolean;
}

/** Response from the file upload endpoint */
export interface UploadVideoResponse {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface UploadThumbnailResponse {
  fileName: string;
}

