"use client";

import { ToolbarProps } from "@/types";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline } from "lucide-react";

export default function EditorToolbar({
  editor,
}: ToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-slate-200" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-slate-200" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "bg-slate-200" : ""}
      >
        <Underline className="h-4 w-4" />
      </Button>

     
    </div>
  );
}
