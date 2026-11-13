import Image from "next/image";
import { saveJournalPostAction } from "@/app/admin/actions";
import type { AdminDictionary } from "@/i18n/admin-dictionaries";
import type { JournalPostPublic } from "@/lib/journal";

export function JournalForm({
  post,
  t,
}: {
  post?: JournalPostPublic;
  t: AdminDictionary;
}) {
  return (
    <form
      action={saveJournalPostAction}
      className="admin-card"
      encType="multipart/form-data"
    >
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="existingCover" value={post?.coverImage || ""} />

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

      <label className="admin-field">
        <span>{t.journal.excerptEn}</span>
        <textarea name="excerptEn" rows={2} defaultValue={post?.excerptEn} />
      </label>
      <label className="admin-field">
        <span>{t.journal.excerptVi}</span>
        <textarea name="excerptVi" rows={2} defaultValue={post?.excerptVi} />
      </label>
      <label className="admin-field">
        <span>{t.journal.bodyEn}</span>
        <textarea name="bodyEn" rows={8} defaultValue={post?.bodyEn} />
      </label>
      <label className="admin-field">
        <span>{t.journal.bodyVi}</span>
        <textarea name="bodyVi" rows={8} defaultValue={post?.bodyVi} />
      </label>

      <label className="admin-field">
        <span>{t.journal.cover}</span>
        <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      {post?.coverImage ? (
        <div style={{ position: "relative", width: 160, height: 100, marginBottom: 16 }}>
          <Image
            src={post.coverImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

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
