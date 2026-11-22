import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mailPublicSiteUrl } from "@/lib/mail/config";

describe("mailPublicSiteUrl", () => {
  it("never emits localhost even when NEXT_PUBLIC_SITE_URL is local", () => {
    const prevMail = process.env.MAIL_PUBLIC_SITE_URL;
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      delete process.env.MAIL_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
      const url = mailPublicSiteUrl("/auth/confirm?x=1");
      assert.match(url, /^https:\/\/sistersflowers\.vn\/auth\/confirm/);
      assert.doesNotMatch(url, /localhost|127\.0\.0\.1/i);
    } finally {
      if (prevMail === undefined) delete process.env.MAIL_PUBLIC_SITE_URL;
      else process.env.MAIL_PUBLIC_SITE_URL = prevMail;
      if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
    }
  });
});
