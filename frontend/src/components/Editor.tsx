"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as api from "@/lib/api";

export default function Editor() {
  const [loaded, setLoaded] = useState(false);
  const [rewriteSnippet, setRewriteSnippet] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: "<p>Loading...</p>",
    onUpdate: ({ editor }) => {
      if (!loaded) return;
      // Debounced sync to backend
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        api.updateDocument(editor.getJSON());
      }, 1000);
    },
  });

  // Load document from backend
  useEffect(() => {
    if (!editor) return;
    api.fetchDocument().then((doc) => {
      if (doc.content && Object.keys(doc.content).length > 0) {
        editor.commands.setContent(doc.content);
      } else {
        editor.commands.setContent("<p>Start writing...</p>");
      }
      setLoaded(true);
    }).catch(() => {
      editor.commands.setContent("<p>Start writing...</p>");
      setLoaded(true);
    });
  }, [editor]);

  const handleRewrite = useCallback(async () => {
    if (!editor || !rewriteSnippet.trim()) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) {
      alert("Select some text in the editor first, then click Rewrite.");
      return;
    }

    setIsRewriting(true);
    try {
      const result = await api.aiRewrite(rewriteSnippet, selectedText);
      // Replace the selection with the rewritten text
      editor.chain().focus().deleteSelection().insertContent(result.rewritten).run();
      setRewriteSnippet("");
    } catch (err) {
      console.error("Rewrite failed:", err);
    }
    setIsRewriting(false);
  }, [editor, rewriteSnippet]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 20px",
        }}
      >
        <div className="prose prose-lg max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Rewrite panel */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: 12,
          background: "#f9fafb",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
          AI Rewrite (select text above, paste a snippet reference below)
        </div>
        <textarea
          value={rewriteSnippet}
          onChange={(e) => setRewriteSnippet(e.target.value)}
          placeholder="Paste a snippet or style reference here..."
          style={{
            width: "100%",
            height: 60,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 13,
            resize: "none",
            outline: "none",
          }}
        />
        <button
          onClick={handleRewrite}
          disabled={isRewriting || !rewriteSnippet.trim()}
          style={{
            marginTop: 6,
            padding: "6px 14px",
            borderRadius: 6,
            border: "none",
            background: isRewriting ? "#9ca3af" : "#7c3aed",
            color: "white",
            fontWeight: 600,
            fontSize: 12,
            cursor: isRewriting ? "not-allowed" : "pointer",
          }}
        >
          {isRewriting ? "Rewriting..." : "Rewrite Selection"}
        </button>
      </div>
    </div>
  );
}
