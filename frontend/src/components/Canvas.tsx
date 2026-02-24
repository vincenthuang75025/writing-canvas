"use client";

import { Tldraw } from "tldraw";

export default function Canvas() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw />
    </div>
  );
}
