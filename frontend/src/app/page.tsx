"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import HealthCheck from "@/components/HealthCheck";

const Canvas = dynamic(() => import("@/components/Canvas"), { ssr: false });
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function Home() {
  const [abstractionLevel, setAbstractionLevel] = useState(3);
  const [editorOpen, setEditorOpen] = useState(true);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Canvas area */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas abstractionLevel={abstractionLevel} />

        {/* Abstraction level filter */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 300,
            display: "flex",
            gap: 0,
            background: "white",
            borderRadius: 8,
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {[
            { level: 1, label: "Vibes", bg: "#c4b5fd", text: "#581c87" },
            { level: 2, label: "+ Sketches", bg: "#fcd34d", text: "#713f12" },
            { level: 3, label: "+ Snippets", bg: "#86efac", text: "#14532d" },
          ].map(({ level, label, bg, text }) => (
            <button
              key={level}
              onClick={() => setAbstractionLevel(level)}
              style={{
                padding: "8px 14px",
                border: "none",
                background: abstractionLevel >= level ? bg : "transparent",
                color: abstractionLevel >= level ? text : "#6b7280",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                borderRight: level < 3 ? "1px solid #e5e7eb" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <HealthCheck />
      </div>

      {/* Editor toggle button */}
      <button
        onClick={() => setEditorOpen(!editorOpen)}
        style={{
          position: "absolute",
          top: 12,
          right: editorOpen ? 412 : 12,
          zIndex: 400,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "white",
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "right 0.2s ease",
        }}
      >
        {editorOpen ? "Close Editor" : "Open Editor"}
      </button>

      {/* Editor panel */}
      {editorOpen && (
        <div
          style={{
            width: 400,
            borderLeft: "1px solid #e5e7eb",
            background: "white",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              fontWeight: 700,
              fontSize: 14,
              color: "#374151",
            }}
          >
            Document Editor
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Editor />
          </div>
        </div>
      )}
    </div>
  );
}
