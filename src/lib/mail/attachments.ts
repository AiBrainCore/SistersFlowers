import path from "node:path";
import { BRAND } from "@/lib/brand";
import { mailSocialLinks } from "@/lib/mail/studio";

export type MailInlineAttachment = {
  filename: string;
  path: string;
  cid: string;
  contentDisposition: "inline";
};

/** Absolute filesystem paths for CID inline images (logo + social). */
export function mailInlineAttachments(
  citySlug?: string | null,
  rootDir = process.cwd(),
): MailInlineAttachment[] {
  const publicDir = path.join(rootDir, "public");
  const logo = {
    filename: path.basename(BRAND.emailWordmarkWhite),
    path: path.join(publicDir, BRAND.emailWordmarkWhite.replace(/^\//, "")),
    cid: "sf-wordmark",
    contentDisposition: "inline" as const,
  };
  const social = mailSocialLinks(citySlug).map((item) => ({
    filename: path.basename(item.path),
    path: path.join(publicDir, item.path.replace(/^\//, "")),
    cid: item.cid,
    contentDisposition: "inline" as const,
  }));
  return [logo, ...social];
}
