"use client";

import { useState, useCallback } from "react";
import * as api from "@/lib/api";

type Phase = "select" | "analyzing" | "checklist" | "rewriting" | "done";

interface StyleChatProps {
  selectedText: string;
  styleReferences: string[];
  onClose: () => void;
}

export default function StyleChat({
  selectedText,
  styleReferences,
  onClose,
}: StyleChatProps) {
  const nonEmpty = styleReferences
    .map((ref, i) => ({ ref, index: i }))
    .filter((r) => r.ref.trim());

  const [phase, setPhase] = useState<Phase>("select");
  const [chosenRef, setChosenRef] = useState<string>(
    nonEmpty.length === 1 ? nonEmpty[0].ref : ""
  );
  const [elements, setElements] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [rewrittenText, setRewrittenText] = useState("");

  const handleAnalyze = useCallback(async () => {
    if (!chosenRef.trim()) return;
    setPhase("analyzing");
    try {
      const elems = await api.aiStyleAnalyze(selectedText, chosenRef);
      setElements(elems);
      setChecked(new Set(elems.map((_, i) => i)));
      setPhase("checklist");
    } catch (err) {
      console.error("Style analyze error:", err);
      setPhase("select");
    }
  }, [selectedText, chosenRef]);

  const handleRewrite = useCallback(async () => {
    const checkedElements = elements.filter((_, i) => checked.has(i));
    if (checkedElements.length === 0) return;
    setPhase("rewriting");
    try {
      const result = await api.aiStyleRewrite(
        selectedText,
        chosenRef,
        checkedElements
      );
      setRewrittenText(result);
      setPhase("done");
    } catch (err) {
      console.error("Style rewrite error:", err);
      setPhase("checklist");
    }
  }, [selectedText, chosenRef, elements, checked]);

  const toggleCheck = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (nonEmpty.length === 0) {
    return (
      <div style={{ padding: 20, color: "#6b7280", fontSize: 13 }}>
        <p>No style references found. Add some in the left panel first.</p>
        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "white",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontSize: 13,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600, color: "#374151" }}>
          Style Rewrite
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "#9ca3af",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* Selected text preview */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#9ca3af",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Selected Text
          </div>
          <div
            style={{
              padding: "8px 12px",
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              color: "#374151",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              maxHeight: 120,
              overflow: "auto",
            }}
          >
            {selectedText}
          </div>
        </div>

        {/* Phase: Select reference */}
        {(phase === "select" || phase === "analyzing") && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Choose Style Reference
            </div>
            {nonEmpty.map(({ ref, index }) => (
              <label
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 12px",
                  marginBottom: 6,
                  borderRadius: 8,
                  border: `1px solid ${
                    chosenRef === ref ? "#7c3aed" : "#e5e7eb"
                  }`,
                  background: chosenRef === ref ? "#f5f3ff" : "white",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="style-ref"
                  checked={chosenRef === ref}
                  onChange={() => setChosenRef(ref)}
                  style={{ marginTop: 2 }}
                />
                <span
                  style={{
                    color: "#374151",
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    maxHeight: 80,
                    overflow: "hidden",
                  }}
                >
                  {ref.length > 200 ? ref.slice(0, 200) + "..." : ref}
                </span>
              </label>
            ))}
            <button
              onClick={handleAnalyze}
              disabled={!chosenRef.trim() || phase === "analyzing"}
              style={{
                marginTop: 8,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background:
                  !chosenRef.trim() || phase === "analyzing"
                    ? "#d1d5db"
                    : "#ede9fe",
                color: !chosenRef.trim() || phase === "analyzing" ? "white" : "#6d28d9",
                fontWeight: 600,
                cursor:
                  !chosenRef.trim() || phase === "analyzing"
                    ? "not-allowed"
                    : "pointer",
                width: "100%",
              }}
            >
              {phase === "analyzing" ? "Analyzing style..." : "Analyze Style"}
            </button>
          </div>
        )}

        {/* Phase: Checklist */}
        {(phase === "checklist" || phase === "rewriting") && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Stylistic Elements
            </div>
            <div style={{ marginBottom: 12, color: "#6b7280", fontSize: 12 }}>
              Uncheck any elements you don't want applied:
            </div>
            {elements.map((elem, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "6px 0",
                  cursor: "pointer",
                  color: "#374151",
                  lineHeight: 1.4,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked.has(i)}
                  onChange={() => toggleCheck(i)}
                  style={{ marginTop: 2 }}
                />
                <span>{elem}</span>
              </label>
            ))}
            <button
              onClick={handleRewrite}
              disabled={checked.size === 0 || phase === "rewriting"}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background:
                  checked.size === 0 || phase === "rewriting"
                    ? "#d1d5db"
                    : "#ede9fe",
                color: checked.size === 0 || phase === "rewriting" ? "white" : "#6d28d9",
                fontWeight: 600,
                cursor:
                  checked.size === 0 || phase === "rewriting"
                    ? "not-allowed"
                    : "pointer",
                width: "100%",
              }}
            >
              {phase === "rewriting" ? "Rewriting..." : "Rewrite"}
            </button>
          </div>
        )}

        {/* Phase: Done — show full history then result */}
        {phase === "done" && (
          <div>
            {/* Checklist recap (read-only) */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Applied Elements
            </div>
            <div style={{ marginBottom: 16 }}>
              {elements.map((elem, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "4px 0",
                    color: checked.has(i) ? "#374151" : "#b0b0b0",
                    lineHeight: 1.4,
                    fontSize: 12,
                    textDecoration: checked.has(i) ? "none" : "line-through",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{checked.has(i) ? "✓" : "–"}</span>
                  <span>{elem}</span>
                </div>
              ))}
            </div>

            {/* Rewritten result */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#9ca3af",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Rewritten Text
            </div>
            <div
              style={{
                padding: "12px 16px",
                background: "#f0fdf4",
                borderRadius: 8,
                border: "1px solid #86efac",
                color: "#374151",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {rewrittenText}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rewrittenText);
                }}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dcfce7",
                  color: "#166534",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Copy
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
