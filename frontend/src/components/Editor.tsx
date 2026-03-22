"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as api from "@/lib/api";

interface CmdKState {
  text: string;
  from: number;
  to: number;
  instruction: string;
  result: string | null;
  loading: boolean;
  top: number;
  left: number;
}

interface EditorProps {
  onCmdL?: (selectedText: string) => void;
}

export default function Editor({ onCmdL }: EditorProps) {
  const [loaded, setLoaded] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Style references
  const [styleRefs, setStyleRefs] = useState<string[]>(["", "", "", ""]);
  const styleRefsLoadedRef = useRef(false);

  // Cmd+K state
  const [cmdK, setCmdK] = useState<CmdKState | null>(null);
  const cmdKInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    editable: true,
    content: "<p>Loading...</p>",
    onUpdate: ({ editor }) => {
      if (!loaded) return;
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        api.updateDocument(editor.getJSON());
      }, 1000);
    },
  });

  // Load document
  useEffect(() => {
    if (!editor) return;
    api
      .fetchDocument()
      .then((doc) => {
        if (doc.content && Object.keys(doc.content).length > 0) {
          editor.commands.setContent(doc.content);
        } else {
          editor.commands.setContent("<p>Start writing...</p>");
        }
        setLoaded(true);
      })
      .catch(() => {
        editor.commands.setContent("<p>Start writing...</p>");
        setLoaded(true);
      });
  }, [editor]);

  // Load style references
  useEffect(() => {
    api
      .fetchStyleReferences()
      .then((refs) => {
        setStyleRefs(refs);
        styleRefsLoadedRef.current = true;
      })
      .catch(() => {
        styleRefsLoadedRef.current = true;
      });
  }, []);

  // Save style references (debounced)
  const handleRefChange = useCallback(
    (index: number, value: string) => {
      setStyleRefs((prev) => {
        const next = [...prev];
        next[index] = value;

        // Debounced save
        clearTimeout(refSyncTimeoutRef.current);
        refSyncTimeoutRef.current = setTimeout(() => {
          api.updateStyleReferences(next);
        }, 1000);

        return next;
      });
    },
    []
  );

  // Cmd+K handler
  const handleCmdK = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return; // no selection

    const text = editor.state.doc.textBetween(from, to, " ");
    if (!text.trim()) return;

    // Get position for the popup
    const coords = editor.view.coordsAtPos(from);
    const containerRect = editorContainerRef.current?.getBoundingClientRect();
    const top = coords.top - (containerRect?.top ?? 0) + 24;
    const left = coords.left - (containerRect?.left ?? 0);

    setCmdK({
      text,
      from,
      to,
      instruction: "",
      result: null,
      loading: false,
      top,
      left,
    });

    setTimeout(() => cmdKInputRef.current?.focus(), 50);
  }, [editor]);

  // Cmd+L handler
  const handleCmdL = useCallback(() => {
    if (!editor || !onCmdL) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;

    const text = editor.state.doc.textBetween(from, to, " ");
    if (!text.trim()) return;

    onCmdL(text);
  }, [editor, onCmdL]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleCmdK();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        handleCmdL();
      }
      if (e.key === "Escape" && cmdK) {
        setCmdK(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCmdK, handleCmdL, cmdK]);

  // Cmd+K submit
  const handleCmdKSubmit = useCallback(async () => {
    if (!cmdK || !cmdK.instruction.trim() || cmdK.loading) return;
    setCmdK((prev) => (prev ? { ...prev, loading: true } : null));
    try {
      const result = await api.aiInlineRewrite(cmdK.text, cmdK.instruction);
      setCmdK((prev) => (prev ? { ...prev, result, loading: false } : null));
    } catch (err) {
      console.error("Inline rewrite error:", err);
      setCmdK((prev) =>
        prev ? { ...prev, result: "Error — please try again.", loading: false } : null
      );
    }
  }, [cmdK]);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Style references column */}
      <div
        style={{
          width: 300,
          minWidth: 220,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e5e7eb",
          background: "#fafafa",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderBottom: i < 3 ? "1px solid #e5e7eb" : undefined,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Reference {i + 1}
            </div>
            <textarea
              value={styleRefs[i]}
              onChange={(e) => handleRefChange(i, e.target.value)}
              placeholder="Paste a style reference here..."
              style={{
                flex: 1,
                resize: "none",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12,
                lineHeight: 1.5,
                fontFamily: "inherit",
                outline: "none",
                background: "white",
                color: "#374151",
              }}
            />
          </div>
        ))}
      </div>

      {/* TipTap editor */}
      <div
        ref={editorContainerRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px",
          cursor: "text",
          position: "relative",
        }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />

        {/* Cmd+K popup */}
        {cmdK && (
          <div
            style={{
              position: "absolute",
              top: cmdK.top,
              left: Math.min(cmdK.left, 400),
              zIndex: 1000,
              background: "white",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              padding: 12,
              width: 380,
              maxWidth: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Rewrite Selection
              </div>
              <button
                onClick={() => setCmdK(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "#9ca3af",
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginBottom: 8,
                padding: "4px 8px",
                background: "#f9fafb",
                borderRadius: 6,
                maxHeight: 60,
                overflow: "hidden",
                whiteSpace: "pre-wrap",
                lineHeight: 1.4,
              }}
            >
              {cmdK.text.length > 150
                ? cmdK.text.slice(0, 150) + "..."
                : cmdK.text}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                ref={cmdKInputRef}
                type="text"
                value={cmdK.instruction}
                onChange={(e) =>
                  setCmdK((prev) =>
                    prev ? { ...prev, instruction: e.target.value } : null
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCmdKSubmit();
                  }
                  if (e.key === "Escape") {
                    setCmdK(null);
                  }
                }}
                placeholder="How should this be rewritten?"
                disabled={cmdK.loading}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleCmdKSubmit}
                disabled={cmdK.loading || !cmdK.instruction.trim()}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background:
                    cmdK.loading || !cmdK.instruction.trim()
                      ? "#d1d5db"
                      : "#ede9fe",
                  color: cmdK.loading || !cmdK.instruction.trim() ? "white" : "#6d28d9",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor:
                    cmdK.loading || !cmdK.instruction.trim()
                      ? "not-allowed"
                      : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cmdK.loading ? "..." : "Go"}
              </button>
            </div>
            {cmdK.result && (
              <>
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "#f0fdf4",
                    borderRadius: 6,
                    border: "1px solid #86efac",
                    fontSize: 12,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    color: "#374151",
                  }}
                >
                  {cmdK.result}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      if (editor && cmdK) {
                        editor
                          .chain()
                          .focus()
                          .setTextSelection({ from: cmdK.from, to: cmdK.to })
                          .insertContent(cmdK.result!)
                          .run();
                      }
                      setCmdK(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "#dcfce7",
                      color: "#166534",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setCmdK(null)}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
