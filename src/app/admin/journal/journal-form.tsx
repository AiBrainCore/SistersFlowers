"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { saveJournalPostAction } from "@/app/admin/actions";
import type { AdminDictionary } from "@/i18n/admin-dictionaries";
import type { JournalPostPublic } from "@/lib/journal";
import { JournalRichEditor } from "@/components/admin/journal-rich-editor";
import { isJournalHtml, markdownLiteToHtml } from "@/lib/journal-html";

function asEditorHtml(body: string | undefined) {
  if (!body) return "";
  return isJournalHtml(body) ? body : markdownLiteToHtml(body);
}

export function JournalForm({
  post,
  t,
}: {
  post?: JournalPostPublic;
  t: AdminDictionary;
}) {
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [preview, setPreview] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [clearCover, setClearCover] = useState(false);

  const bodyEn = asEditorHtml(post?.bodyEn);
  const bodyVi = asEditorHtml(post?.bodyVi);
  const slugHint = post?.slug || "draft";

  const shownCover = useMemo(() => {
    if (clearCover) return null;
    if (coverPreview) return coverPreview;
    return post?.coverImage || null;
  }, [clearCover, coverPreview, post?.coverImage]);

  return (
    <form
      action={saveJournalPostAction}
      className="admin-card"
      encType="multipart/form-data"
    >
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input
        type="hidden"
        name="existingCover"
        value={clearCover ? "" : post?.coverImage || ""}
      />
      <input type="hidden" name="clearCover" value={clearCover ? "1" : ""} />

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>{t.journal.titleEn}</span>
          <input name="titleEn" required defaultValue={post?.titleEn} />
        </label>
        <label className="admin-field">
          <span>{t.journal.titleVi}</span>
          <input name="titleVi" required defaultValue={post?.titleVi} />
        </label>
      </div>

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>{t.common.slug}</span>
          <input
            name="slug"
            defaultValue={post?.slug}
            placeholder={t.journal.slugPlaceholder}
          />
        </label>
        <label className="admin-field">
          <span>{t.common.sort}</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={post?.sortOrder ?? 0}
          />
        </label>
      </div>

      <div className="admin-grid-2">
        <label className="admin-field">
          <span>{t.journal.kind}</span>
          <select name="kind" defaultValue={post?.kind ?? "tip"}>
            <option value="tip">{t.journal.kindTip}</option>
            <option value="story">{t.journal.kindStory}</option>
            <option value="news">{t.journal.kindNews}</option>
            <option value="partnership">{t.journal.kindPartnership}</option>
          </select>
        </label>
        <label className="admin-field">
          <span>{t.journal.cityScope}</span>
          <select name="cityScope" defaultValue={post?.cityScope ?? "both"}>
            <option value="both">{t.journal.cityBoth}</option>
            <option value="danang">Da Nang</option>
            <option value="dalat">Da Lat</option>
          </select>
        </label>
      </div>

      <fieldset
        style={{
          border: "1px solid rgba(45,58,40,0.12)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          background: "#fffaf5",
        }}
      >
        <legend
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.75,
            padding: "0 6px",
          }}
        >
          {t.journal.cover}
        </legend>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 0 }}>
          {t.journal.coverHint}
        </p>
        {shownCover ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 420,
              aspectRatio: "16 / 9",
              marginBottom: 12,
              borderRadius: 12,
              overflow: "hidden",
              background: "#eee",
            }}
          >
            <Image
              src={shownCover}
              alt={post?.coverAltEn || ""}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <p style={{ fontSize: 13, opacity: 0.55 }}>{t.journal.coverEmpty}</p>
        )}
        <label className="admin-field">
          <span>{t.journal.coverChange}</span>
          <input
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setCoverPreview(null);
                return;
              }
              setClearCover(false);
              setCoverPreview(URL.createObjectURL(file));
            }}
          />
        </label>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>Cover alt EN</span>
            <input name="coverAltEn" defaultValue={post?.coverAltEn || ""} />
          </label>
          <label className="admin-field">
            <span>Cover alt VI</span>
            <input name="coverAltVi" defaultValue={post?.coverAltVi || ""} />
          </label>
        </div>
        {post?.coverImage || coverPreview ? (
          <label
            className="admin-field"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <input
              type="checkbox"
              checked={clearCover}
              onChange={(e) => {
                setClearCover(e.target.checked);
                if (e.target.checked) setCoverPreview(null);
              }}
              style={{ width: "auto" }}
            />
            <span style={{ margin: 0 }}>{t.journal.coverRemove}</span>
          </label>
        ) : null}
      </fieldset>

      <label className="admin-field">
        <span>{t.journal.excerptEn}</span>
        <textarea name="excerptEn" rows={2} defaultValue={post?.excerptEn} />
      </label>
      <label className="admin-field">
        <span>{t.journal.excerptVi}</span>
        <textarea name="excerptVi" rows={2} defaultValue={post?.excerptVi} />
      </label>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="admin-btn secondary"
          onClick={() => setLang("en")}
          style={{ opacity: lang === "en" ? 1 : 0.55 }}
        >
          English
        </button>
        <button
          type="button"
          className="admin-btn secondary"
          onClick={() => setLang("vi")}
          style={{ opacity: lang === "vi" ? 1 : 0.55 }}
        >
          Tiếng Việt
        </button>
        <button
          type="button"
          className="admin-btn secondary"
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? "Edit" : "Preview"}
        </button>
        <span style={{ fontSize: 12, opacity: 0.65 }}>{t.journal.imageTip}</span>
      </div>

      <div style={{ display: lang === "en" && !preview ? "block" : "none" }}>
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          {t.journal.bodyEn}
        </p>
        <JournalRichEditor
          name="bodyEn"
          locale="en"
          initialHtml={bodyEn}
          placeholder="English article body…"
          postSlug={slugHint}
        />
      </div>
      <div style={{ display: lang === "vi" && !preview ? "block" : "none" }}>
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          {t.journal.bodyVi}
        </p>
        <JournalRichEditor
          name="bodyVi"
          locale="vi"
          initialHtml={bodyVi}
          placeholder="Nội dung bài tiếng Việt…"
          postSlug={slugHint}
        />
      </div>

      {preview ? (
        <div
          className="admin-card"
          style={{ background: "#fffaf5", marginBottom: 16 }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Preview · {lang.toUpperCase()}
          </p>
          <div
            className="journal-article-body"
            dangerouslySetInnerHTML={{
              __html: lang === "vi" ? bodyVi : bodyEn,
            }}
          />
          <p style={{ fontSize: 12, opacity: 0.55, marginTop: 8 }}>
            Live preview uses last saved HTML until you save again.
          </p>
        </div>
      ) : null}

      <fieldset style={{ border: "none", padding: 0, marginBottom: 16 }}>
        <legend
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 8,
          }}
        >
          SEO
        </legend>
        <div className="admin-grid-2">
          <label className="admin-field">
            <span>SEO title EN</span>
            <input name="seoTitleEn" defaultValue={post?.seoTitleEn || ""} />
          </label>
          <label className="admin-field">
            <span>SEO title VI</span>
            <input name="seoTitleVi" defaultValue={post?.seoTitleVi || ""} />
          </label>
        </div>
        <label className="admin-field">
          <span>Meta description EN</span>
          <textarea
            name="seoDescriptionEn"
            rows={2}
            defaultValue={post?.seoDescriptionEn || ""}
          />
        </label>
        <label className="admin-field">
          <span>Meta description VI</span>
          <textarea
            name="seoDescriptionVi"
            rows={2}
            defaultValue={post?.seoDescriptionVi || ""}
          />
        </label>
      </fieldset>

      <label
        className="admin-field"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published ?? false}
          style={{ width: "auto" }}
        />
        <span style={{ margin: 0 }}>{t.journal.published}</span>
      </label>

      <button type="submit" className="admin-btn">
        {t.journal.save}
      </button>
    </form>
  );
}
