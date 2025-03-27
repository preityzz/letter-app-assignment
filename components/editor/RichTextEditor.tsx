"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import { auth, db } from "@/firebase/client";
import { doc, setDoc, getDoc, collection, updateDoc } from "firebase/firestore";
import { getGoogleDriveToken } from "@/utils/googleAuth";
import { uploadToGoogleDrive, convertToGoogleDocs } from "@/utils/googleDrive";
import EditorToolbar from "./EditorToolbar";
import { Loader2, CloudUpload, ExternalLink, ChevronLeft } from "lucide-react";
import { EditorProps, Letter } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RichTextEditor({ documentId = "" }: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("Untitled Letter");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isLoading, setIsLoading] = useState(documentId ? true : false);
  const [driveStatus, setDriveStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [driveDocUrl, setDriveDocUrl] = useState<string | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(documentId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Heading.configure({
        levels: [1, 2],
      }),
      Placeholder.configure({
        placeholder: "Start writing your letter here...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: content || "",
    onUpdate({ editor }) {
      setContent(editor.getHTML());
      setSaveStatus("Unsaved changes");
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[calc(11in-4rem)] h-full prose max-w-none",
        style: "border: none; box-shadow: none;",
      },
    },
  });

  useEffect(() => {
    setCurrentDocumentId(documentId);

    if (documentId) {
      setIsLoading(true);

      const loadDocument = async () => {
        try {
          const docRef = doc(db, "letters", documentId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as Letter;
            setTitle(data.title || "Untitled Letter");

            if (data.content && data.content.trim() !== "") {
              setContent(data.content);

              if (editor) {
                editor.commands.setContent(data.content);
              }
            } else if (editor) {
              editor.commands.clearContent();
            }
          } else {
            if (editor) {
              editor.commands.clearContent();
            }
          }
        } catch (error) {
          console.log("Error loading document:", error);
          if (editor) {
            editor.commands.clearContent();
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadDocument();
    } else if (editor) {
      editor.commands.clearContent();
    }
  }, [documentId, editor]);

  const saveDraft = async () => {
    try {
      setIsSaving(true);
      setSaveStatus("Saving...");

      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to save drafts");
      }

      const letterData = {
        title,
        content: content,
        updatedAt: new Date().toISOString(),
        userId: user.uid,
        isDraft: true,
      };

      if (currentDocumentId) {
        const docRef = doc(db, "letters", currentDocumentId);
        await updateDoc(docRef, letterData);
        setSaveStatus("Saved successfully");
      } else {
        const docRef = doc(collection(db, "letters"));
        await setDoc(docRef, {
          ...letterData,
          createdAt: new Date().toISOString(),
        });

        setCurrentDocumentId(docRef.id);
        router.replace(`/editor/${docRef.id}`);
        setSaveStatus("Saved successfully");
      }
    } catch (error) {
      console.log("Error saving draft:", error);
      setSaveStatus("Error saving draft");
    } finally {
      setIsSaving(false);
    }
  };

  const saveToGoogleDrive = async () => {
    try {
      setDriveStatus("loading");
      setSaveStatus("Uploading to Google Drive...");

      const accessToken = await getGoogleDriveToken();
      const fileName = title || "Untitled Letter";
      const uploadResult = await uploadToGoogleDrive(
        content,
        fileName,
        accessToken
      );
      const docResult = await convertToGoogleDocs(uploadResult.id, accessToken);

      if (docResult.id) {
        const docUrl = `https://docs.google.com/document/d/${docResult.id}/edit`;
        setDriveDocUrl(docUrl);
      } else if (docResult.webViewLink) {
        if (!docResult.webViewLink.includes("/d/")) {
          const docId = docResult.webViewLink.split("/").pop()?.split("?")[0];
          if (docId) {
            setDriveDocUrl(`https://docs.google.com/document/d/${docId}/edit`);
          } else {
            setDriveDocUrl(docResult.webViewLink);
          }
        } else {
          setDriveDocUrl(docResult.webViewLink);
        }
      }

      setSaveStatus("Saved to Google Drive");
      setDriveStatus("success");
    } catch (error) {
      console.log("Error saving to Google Drive:", error);
      setSaveStatus("Error saving to Google Drive");
      setDriveStatus("error");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <style jsx global>{`
        .ProseMirror {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          min-height: calc(11in - 4rem);
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: "Start writing your letter here...";
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="border-b p-4">
            <div className="flex items-center mb-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-2">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
              {currentDocumentId && (
                <div className="text-xs text-gray-500">
                  Document ID: {currentDocumentId}
                </div>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold w-full outline-none border-none"
              placeholder="Untitled Letter"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 mt-1">{saveStatus}</div>
              <div className="flex gap-2 items-center">
                <Button
                  onClick={saveDraft}
                  disabled={isSaving || driveStatus === "loading"}
                  size="sm"
                >
                  Save Draft
                </Button>

                <Button
                  onClick={saveToGoogleDrive}
                  disabled={driveStatus === "loading"}
                  variant={driveStatus === "success" ? "default" : "outline"}
                  className={
                    driveStatus === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                  size="sm"
                >
                  {driveStatus === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving to Drive...
                    </>
                  ) : driveStatus === "success" ? (
                    <>
                      <CloudUpload className="h-4 w-4 mr-2" />
                      Saved to Drive
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-4 w-4 mr-2" />
                      Save as Google Doc
                    </>
                  )}
                </Button>

                {driveDocUrl && (
                  <a
                    href={driveDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View in Google Docs
                  </a>
                )}
              </div>
            </div>
          </div>

          {editor && (
            <EditorToolbar
              editor={editor}
              isSaving={isSaving}
              onSave={saveDraft}
              onSaveToDrive={saveToGoogleDrive}
            />
          )}

          <div className="grow p-4 overflow-auto bg-gray-50">
            <div className="mx-auto max-w-2xl bg-white p-8 min-h-[11in] shadow-sm">
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="border-t p-4 flex justify-between">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/drive">
              <Button variant="outline" size="sm">
                View Google Drive Files
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
