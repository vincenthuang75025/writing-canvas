"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import HealthCheck from "@/components/HealthCheck";
import { saveState, fetchNodes, BackendNode } from "@/lib/api";

const Canvas = dynamic(() => import("@/components/Canvas"), { ssr: false });
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });
const ChatPanel = dynamic(() => import("@/components/ChatPanel"), { ssr: false });

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelView, setPanelView] = useState<"chat" | "editor">("chat");
  const [nodes, setNodes] = useState<BackendNode[]>([]);
  const [saveLabel, setSaveLabel] = useState("Save State");
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Fetch nodes on mount + poll every 3s
  useEffect(() => {
    const load = () => fetchNodes().then(setNodes).catch(() => {});
    load();
    intervalRef.current = setInterval(load, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleSaveState = useCallback(async () => {
    try {
      await saveState();
      setSaveLabel("Saved!");
      setTimeout(() => setSaveLabel("Save State"), 1500);
    } catch {
      setSaveLabel("Error");
      setTimeout(() => setSaveLabel("Save State"), 1500);
    }
  }, []);

  // View toggle — always top-left
  const viewTabs = (
    <div
      style={{
        display: "flex",
        gap: 0,
        background: "white",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {(["chat", "editor"] as const).map((view) => (
        <button
          key={view}
          onClick={() => setPanelView(view)}
          style={{
            padding: "6px 14px",
            border: "none",
            background: panelView === view ? "#7c3aed" : "transparent",
            color: panelView === view ? "white" : "#6b7280",
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
            textTransform: "capitalize",
          }}
        >
          {view}
        </button>
      ))}
    </div>
  );

  // Full-screen editor mode
  if (panelView === "editor") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Top bar */}
        <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {viewTabs}
          </div>
          <button
            onClick={handleSaveState}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: saveLabel === "Saved!" ? "#86efac" : "white",
              color: saveLabel === "Saved!" ? "#14532d" : "#374151",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {saveLabel}
          </button>
        </div>
        {/* Editor body */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Editor nodes={nodes} />
        </div>
      </div>
    );
  }

  // Canvas + chat panel mode
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Canvas area */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas />

        {/* Top-left controls */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 300,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          {viewTabs}

          <button
            onClick={handleSaveState}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: saveLabel === "Saved!" ? "#86efac" : "white",
              color: saveLabel === "Saved!" ? "#14532d" : "#374151",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {saveLabel}
          </button>
        </div>

        <HealthCheck />
      </div>

      {/* Chat panel toggle button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        style={{
          position: "absolute",
          top: 12,
          right: panelOpen ? 412 : 12,
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
        {panelOpen ? "Close Chat" : "Open Chat"}
      </button>

      {/* Chat panel */}
      {panelOpen && (
        <div
          style={{
            width: 400,
            borderLeft: "1px solid #e5e7eb",
            background: "white",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ChatPanel />
          </div>
        </div>
      )}
    </div>
  );
}
