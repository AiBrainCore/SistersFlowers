export type CategoryPublic = {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  sortOrder: number;
  productCount?: number;
};

/** Primary occasions shown first in catalog chips */
export const FEATURED_CATEGORY_SLUGS = [
  "birthday",
  "romance",
  "graduation",
  "wedding",
  "condolences",
] as const;
