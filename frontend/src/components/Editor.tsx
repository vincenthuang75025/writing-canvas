"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function Editor() {
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    content: "<p>Start writing...</p>",
  });

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="prose prose-lg max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
