"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { Loader2 } from "lucide-react";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const documentId =
    params && typeof params.documentId === "string" ? params.documentId : "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <>
      {isLoading ? (
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          <header className="bg-white border-b p-4">
            <h1 className="text-xl font-semibold">Letter Editor</h1>
          </header>
          <main className="flex-grow overflow-hidden">
            <RichTextEditor
              documentId={documentId === "new" ? "" : documentId}
            />
          </main>
        </div>
      )}
    </>
  );
}
