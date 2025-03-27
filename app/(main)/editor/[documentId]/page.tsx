"use client";

import { useParams } from "next/navigation";
import RichTextEditor from "@/components/editor/RichTextEditor";

export default function EditorPage() {
  const params = useParams();
  const documentId = params?.documentId as string;

  return <RichTextEditor documentId={documentId} />;
}
