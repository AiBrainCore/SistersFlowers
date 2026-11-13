import { prisma } from "@/lib/db";
import { slugify } from "@/lib/products";

export const JOURNAL_KINDS = [
  "tip",
  "story",
  "news",
  "partnership",
] as const;
export type JournalKind = (typeof JOURNAL_KINDS)[number];

export const JOURNAL_CITY_SCOPES = ["both", "danang", "dalat"] as const;
export type JournalCityScope = (typeof JOURNAL_CITY_SCOPES)[number];

export type JournalPostPublic = {
  id: string;
  slug: string;
  kind: JournalKind;
  cityScope: JournalCityScope;
  titleEn: string;
  titleVi: string;
  excerptEn: string;
  excerptVi: string;
  bodyEn: string;
  bodyVi: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  sortOrder: number;
  updatedAt: Date;
};

function asKind(value: string): JournalKind {
  return JOURNAL_KINDS.includes(value as JournalKind)
    ? (value as JournalKind)
    : "tip";
}

function asScope(value: string): JournalCityScope {
  return JOURNAL_CITY_SCOPES.includes(value as JournalCityScope)
    ? (value as JournalCityScope)
    : "both";
}

function toPublic(row: {
  id: string;
  slug: string;
  kind: string;
  cityScope: string;
  titleEn: string;
  titleVi: string;
  excerptEn: string;
  excerptVi: string;
  bodyEn: string;
  bodyVi: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  sortOrder: number;
  updatedAt: Date;
}): JournalPostPublic {
  return {
    id: row.id,
    slug: row.slug,
    kind: asKind(row.kind),
    cityScope: asScope(row.cityScope),
    titleEn: row.titleEn,
    titleVi: row.titleVi,
    excerptEn: row.excerptEn,
    excerptVi: row.excerptVi,
    bodyEn: row.bodyEn,
    bodyVi: row.bodyVi,
    coverImage: row.coverImage,
    published: row.published,
    publishedAt: row.publishedAt,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt,
  };
}

export async function listAllJournalPosts(): Promise<JournalPostPublic[]> {
  const rows = await prisma.journalPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toPublic);
}

export async function listPublishedJournalPosts(): Promise<JournalPostPublic[]> {
  const rows = await prisma.journalPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { sortOrder: "asc" }],
  });
  return rows.map(toPublic);
}

export async function getJournalPostBySlug(
  slug: string,
  opts?: { includeDraft?: boolean },
): Promise<JournalPostPublic | null> {
  const row = await prisma.journalPost.findUnique({ where: { slug } });
  if (!row) return null;
  if (!opts?.includeDraft && !row.published) return null;
  return toPublic(row);
}

export async function getJournalPostById(
  id: string,
): Promise<JournalPostPublic | null> {
  const row = await prisma.journalPost.findUnique({ where: { id } });
  return row ? toPublic(row) : null;
}

export function makeJournalSlug(title: string) {
  return slugify(title) || `post-${Date.now().toString(36)}`;
}
