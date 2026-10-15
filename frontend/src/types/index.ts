export interface User {
  id: string;
  employeeId: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  isContentAdmin: boolean;
}

export interface CategoryFolder {
  id: number;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  mainCategoryId: number;
  parentId: number | null;
  children?: CategoryFolder[];
  systems?: System[];
  videos?: Video[];
  _count?: {
    systems: number;
    videos: number;
    children: number;
  };
  breadcrumbs?: Array<{ id: number; name: string }>;
}

/** Backward compatibility alias */
export type SubCategory = CategoryFolder;

export interface MainCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  folders?: CategoryFolder[];
  systems?: System[];
  videos?: Video[];
  createdAt: string;
  updatedAt: string;
}

export interface System {
  id: number;
  name: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
  folderId: number | null;
  folder?: CategoryFolder & { mainCategory?: MainCategory };
  subCategoryId?: number | null;
  subCategory?: CategoryFolder & { mainCategory?: MainCategory };
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
  tags: string[];
  folderId: number | null;
  folder?: CategoryFolder & { mainCategory?: MainCategory };
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
  folderId?: number | null;
  tags?: string[];
}

/** DTO for updating video metadata */
export interface UpdateVideoDto {
  title?: string;
  description?: string;
  thumbnailName?: string | null;
  duration?: number;
  sortOrder?: number;
  folderId?: number | null;
  tags?: string[];
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

export interface SystemNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

export interface SearchResult {
  systems: System[];
  videos: Video[];
  folders: CategoryFolder[];
  total: number;
}

export interface AnalyticsOverview {
  totals: {
    visits: number;
    systems: number;
    folders: number;
    videos: number;
  };
  topSystems: Array<{
    systemId: number;
    name: string;
    folderName: string;
    clickCount: number;
    percentage: number;
  }>;
  topUsers: Array<{
    userId: string;
    employeeId: string;
    displayName: string;
    email: string;
    clickCount: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
}

export interface SystemAnalyticsBreakdown {
  system: System;
  totalClicks: number;
  userBreakdown: Array<{
    userId: string;
    employeeId: string;
    displayName: string;
    count: number;
  }>;
}
