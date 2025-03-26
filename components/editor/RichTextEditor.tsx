"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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

const PLACEHOLDER_CONTENT = "<p>Start writing your letter here...</p>";

export default function RichTextEditor({ documentId = "" }: EditorProps) {
  const [title, setTitle] = useState("Untitled Letter");
  const [content, setContent] = useState(PLACEHOLDER_CONTENT);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isLoading, setIsLoading] = useState(documentId ? true : false);
  const [driveStatus, setDriveStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [driveDocUrl, setDriveDocUrl] = useState<string | null>(null);

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
    ],
    content,
    onUpdate({ editor }) {
      setContent(editor.getHTML());
      setSaveStatus("Unsaved changes");
    },
  });

  useEffect(() => {
    // Load document if documentId is provided
    if (documentId) {
      const loadDocument = async () => {
        try {
          const docRef = doc(db, "letters", documentId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as Letter;
            setTitle(data.title);

            // Only set content if it exists and is not empty
            if (data.content && data.content.trim() !== "") {
              setContent(data.content);

              if (editor) {
                editor.commands.setContent(data.content);
              }
            } else {
              // If content is empty, set the placeholder
              if (editor) {
                editor.commands.setContent(PLACEHOLDER_CONTENT);
              }
            }
          } else {
         
            if (editor) {
              editor.commands.setContent(PLACEHOLDER_CONTENT);
            }
          }
        } catch (error) {
          console.log("Error loading document:", error);
        
          if (editor) {
            editor.commands.setContent(PLACEHOLDER_CONTENT);
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadDocument();
    } else {
   
      if (editor && editor.isEmpty) {
        editor.commands.setContent(PLACEHOLDER_CONTENT);
      }
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

     
      const contentToSave =
        content === PLACEHOLDER_CONTENT && editor && editor.isEmpty
          ? PLACEHOLDER_CONTENT
          : content;

      const letterData = {
        title,
        content: contentToSave,
        updatedAt: new Date().toISOString(),
        userId: user.uid,
        isDraft: true,
      };

      let docRef;
      if (documentId) {
        docRef = doc(db, "letters", documentId);
        await updateDoc(docRef, letterData);
      } else {
  
        docRef = doc(collection(db, "letters"));
        await setDoc(docRef, {
          ...letterData,
          createdAt: new Date().toISOString(),
        });
      }

      setSaveStatus("Saved successfully");
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

      if (docResult.webViewLink) {
        setDriveDocUrl(docResult.webViewLink);
      }

      setSaveStatus("Saved to Google Drive");
      setDriveStatus("success");
    } catch (error) {
      console.log("Error saving to Google Drive:", error);
      setSaveStatus("Error saving to Google Drive");
      setDriveStatus("error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center mb-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
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

      <div className="grow p-4 overflow-auto">
        <div className="mx-auto max-w-2xl bg-white p-8 min-h-[11in] shadow-sm border">
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
    </div>
  );
}
