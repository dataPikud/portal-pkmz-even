export interface User {
  id: string;
  employeeId: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
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
