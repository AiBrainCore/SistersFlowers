"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import {
  JOURNAL_INTERNAL_LINKS,
  localePath,
} from "@/lib/journal-internal-links";

type Lang = "en" | "vi";

export function JournalRichEditor({
  name,
  locale,
  initialHtml,
  placeholder,
}: {
  name: string;
  locale: Lang;
  initialHtml: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(initialHtml || "");
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write the article…",
      }),
    ],
    content: initialHtml || "",
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => setHtml(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "journal-editor-prose min-h-[280px] px-3 py-3 text-sm leading-7 outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((initialHtml || "") !== current && !editor.isFocused) {
      editor.commands.setContent(initialHtml || "", { emitUpdate: false });
      setHtml(initialHtml || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when switching posts
  }, [initialHtml, editor]);

  if (!editor) {
    return (
      <div className="admin-field">
        <textarea name={name} defaultValue={initialHtml} rows={10} />
      </div>
    );
  }

  function insertInternal(path: string) {
    const href = localePath(locale, path);
    const { from, to } = editor!.state.selection;
    const selected = editor!.state.doc.textBetween(from, to, " ");
    if (selected) {
      editor!.chain().focus().extendMarkRange("link").setLink({ href }).run();
    } else {
      editor!
        .chain()
        .focus()
        .insertContent(
          `<a href="${href}">${locale === "vi" ? "Xem thêm" : "Learn more"}</a>`,
        )
        .run();
    }
    setLinkOpen(false);
  }

  function setExternalLink() {
    const prev = editor!.getAttributes("link").href as string | undefined;
    const href = window.prompt("URL", prev || "https://");
    if (href === null) return;
    if (href === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const safe = href.startsWith("http") || href.startsWith("/") ? href : `https://${href}`;
    editor!.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
  }

  const btn = (active: boolean) =>
    ({
      padding: "6px 10px",
      borderRadius: 8,
      border: "1px solid rgba(45,58,40,0.15)",
      background: active ? "rgba(194,71,18,0.12)" : "#fff",
      fontSize: 12,
      cursor: "pointer",
    }) as const;

  return (
    <div style={{ marginBottom: 16 }}>
      <input type="hidden" name={name} value={html} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          style={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          style={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          style={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button
          type="button"
          style={btn(editor.isActive("heading", { level: 3 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </button>
        <button
          type="button"
          style={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          type="button"
          style={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>
        <button type="button" style={btn(false)} onClick={setExternalLink}>
          Link
        </button>
        <button
          type="button"
          style={btn(linkOpen)}
          onClick={() => setLinkOpen((v) => !v)}
        >
          Internal link
        </button>
        <button
          type="button"
          style={btn(false)}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          Unlink
        </button>
        <button
          type="button"
          style={btn(false)}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          type="button"
          style={btn(false)}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>

      {linkOpen ? (
        <div
          style={{
            marginBottom: 8,
            padding: 10,
            border: "1px solid rgba(45,58,40,0.12)",
            borderRadius: 12,
            background: "#fffaf5",
            display: "grid",
            gap: 6,
          }}
        >
          {JOURNAL_INTERNAL_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => insertInternal(item.path)}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid rgba(45,58,40,0.1)",
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {locale === "vi" ? item.labelVi : item.labelEn}
              <span style={{ opacity: 0.55, marginLeft: 8 }}>
                {localePath(locale, item.path)}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid rgba(45,58,40,0.15)",
          borderRadius: 12,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .journal-editor-prose h2 {
          font-family: inherit;
          font-size: 1.25rem;
          margin: 1rem 0 0.5rem;
          color: #2d3a28;
        }
        .journal-editor-prose h3 {
          font-size: 1.05rem;
          margin: 0.85rem 0 0.4rem;
          color: #2d3a28;
        }
        .journal-editor-prose p {
          margin: 0.55rem 0;
        }
        .journal-editor-prose a {
          color: #c24712;
          text-decoration: underline;
        }
        .journal-editor-prose ul {
          padding-left: 1.25rem;
          list-style: disc;
        }
        .journal-editor-prose ol {
          padding-left: 1.25rem;
          list-style: decimal;
        }
        .journal-editor-prose p.is-editor-empty:first-child::before {
          color: #9a9288;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
