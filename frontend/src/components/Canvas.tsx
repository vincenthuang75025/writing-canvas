"use client";

import { useCallback, useRef, useState } from "react";
import { Editor, Tldraw, createShapeId } from "tldraw";
import {
  VibeShapeUtil,
  SketchShapeUtil,
  SnippetShapeUtil,
} from "./shapes";
import * as api from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

const shapeUtils = [VibeShapeUtil, SketchShapeUtil, SnippetShapeUtil];

const CUSTOM_TYPES = ["vibe", "sketch", "snippet"] as const;
type CustomType = (typeof CUSTOM_TYPES)[number];

export default function Canvas() {
  const editorRef = useRef<Editor | null>(null);
  const [loaded, setLoaded] = useState(false);
  const syncingRef = useRef(false);
  // Map from tldraw shape id string -> backend node id
  const idMapRef = useRef<Map<string, string>>(new Map());

  // Load nodes from backend on mount
  const loadNodes = useCallback(async (editor: Editor) => {
    try {
      const nodes = await api.fetchNodes();
      if (nodes.length === 0) {
        setLoaded(true);
        return;
      }
      syncingRef.current = true;
      const shapes = nodes.map((node) => {
        const shapeId = createShapeId(node.id);
        idMapRef.current.set(shapeId, node.id);
        return {
          id: shapeId,
          type: node.type as CustomType,
          x: node.x,
          y: node.y,
          props: { w: node.w, h: node.h, content: node.content },
        };
      });
      editor.createShapes(shapes as any);
      syncingRef.current = false;
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  // Sync changes to backend
  const syncToBackend = useCallback(
    async (editor: Editor) => {
      if (syncingRef.current || !loaded) return;

      const allShapes = editor.getCurrentPageShapes();
      const customShapes = allShapes.filter((s) =>
        CUSTOM_TYPES.includes(s.type as CustomType)
      ) as any[];

      for (const shape of customShapes) {
        const backendId = idMapRef.current.get(shape.id);
        const shapeProps = shape.props as {
          w: number;
          h: number;
          content: string;
        };
        if (backendId) {
          await api.updateNode(backendId, {
            content: shapeProps.content,
            x: shape.x,
            y: shape.y,
            w: shapeProps.w,
            h: shapeProps.h,
          });
        } else {
          const created = await api.createNode({
            type: shape.type as CustomType,
            content: shapeProps.content,
            x: shape.x,
            y: shape.y,
            w: shapeProps.w,
            h: shapeProps.h,
          });
          idMapRef.current.set(shape.id, created.id);
        }
      }

      // Delete nodes that no longer exist on canvas
      const currentShapeIds = new Set(customShapes.map((s) => s.id));
      for (const [shapeId, backendId] of idMapRef.current.entries()) {
        if (!currentShapeIds.has(shapeId as any)) {
          await api.deleteNode(backendId);
          idMapRef.current.delete(shapeId);
        }
      }
    },
    [loaded]
  );

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      loadNodes(editor);

      // Debounced sync on changes
      let timeout: ReturnType<typeof setTimeout>;
      editor.store.listen(
        () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => syncToBackend(editor), 1000);
        },
        { scope: "document", source: "user" }
      );
    },
    [loadNodes, syncToBackend]
  );

  const addShape = useCallback(
    (type: CustomType) => {
      const editor = editorRef.current;
      if (!editor) return;
      const center = editor.getViewportScreenCenter();
      const pagePoint = editor.screenToPage(center);
      editor.createShape({
        type: type as any,
        x: pagePoint.x - 110,
        y: pagePoint.y - 60,
        props: { w: 220, h: 120, content: "" },
      });
    },
    []
  );

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Tldraw
        shapeUtils={shapeUtils}
        onMount={handleMount}
        components={{
          MainMenu: null,
          PageMenu: null,
          StylePanel: null,
          NavigationPanel: null,
          Toolbar: null,
          HelpMenu: null,
          ActionsMenu: null,
          QuickActions: null,
          DebugMenu: null,
        }}
      />

      {/* Toolbar for creating shapes */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          zIndex: 300,
        }}
      >
        <button onClick={() => addShape("vibe")} style={toolbarBtnStyle("#c4b5fd", "#581c87")}>
          + Vibe
        </button>
        <button onClick={() => addShape("sketch")} style={toolbarBtnStyle("#fcd34d", "#713f12")}>
          + Sketch
        </button>
        <button onClick={() => addShape("snippet")} style={toolbarBtnStyle("#86efac", "#14532d")}>
          + Snippet
        </button>
      </div>
    </div>
  );
}

function toolbarBtnStyle(bg: string, text: string): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: bg,
    color: text,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  };
}
