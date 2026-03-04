"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as api from "@/lib/api";
import { BackendNode } from "@/lib/api";

const NODE_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  vibe: { bg: "#ede9fe", border: "#c4b5fd", label: "#581c87" },
  sketch: { bg: "#fef9c3", border: "#fcd34d", label: "#713f12" },
  snippet: { bg: "#dcfce7", border: "#86efac", label: "#14532d" },
};

interface EditorProps {
  nodes: BackendNode[];
}

export default function Editor({ nodes }: EditorProps) {
  const [loaded, setLoaded] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: "<p>Loading...</p>",
    onUpdate: ({ editor }) => {
      if (!loaded) return;
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        api.updateDocument(editor.getJSON());
      }, 1000);
    },
  });

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

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Nodes column */}
      <div
        style={{
          width: "40%",
          overflow: "auto",
          padding: "12px 8px",
          borderRight: "1px solid #e5e7eb",
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase" }}>
          Canvas Nodes
        </div>
        {nodes.length === 0 && (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>No nodes yet</div>
        )}
        {nodes.map((node) => {
          const colors = NODE_COLORS[node.type] || NODE_COLORS.vibe;
          return (
            <div
              key={node.id}
              style={{
                marginBottom: 8,
                padding: "8px 10px",
                borderRadius: 8,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.label, marginBottom: 2, textTransform: "uppercase" }}>
                {node.type}
              </div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                {node.content || "(empty)"}
              </div>
            </div>
          );
        })}
      </div>

      {/* TipTap editor */}
      <div
        style={{
          width: "60%",
          overflow: "auto",
          padding: "24px 16px",
        }}
      >
        <div className="prose prose-lg max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
