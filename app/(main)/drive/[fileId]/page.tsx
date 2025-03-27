"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGoogleDriveToken } from "@/utils/googleAuth";
import { getGoogleDriveFile } from "@/utils/googleDrive";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import DriveImportButton from "@/components/drive/DriveImportButton";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";

const DRIVE_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_URL ||
  "https://www.googleapis.com/drive/v3";
const DOCS_BASE_URL =
  process.env.NEXT_PUBLIC_GOOGLE_DOCS_URL || "https://docs.google.com";

export default function DriveFilePage() {
  const params = useParams();
  const router = useRouter();
  const fileId =
    params && typeof params.fileId === "string" ? params.fileId : "";
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [webViewLink, setWebViewLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const getDocumentUrl = () => {
    if (webViewLink) {
      if (webViewLink.includes("/edit")) {
        return webViewLink;
      } else {
        return webViewLink.endsWith("/")
          ? `${webViewLink}edit`
          : `${webViewLink}/edit`;
      }
    }

    switch (mimeType) {
      case "application/vnd.google-apps.document":
        return `${DOCS_BASE_URL}/document/d/${fileId}/edit`;
      case "application/vnd.google-apps.spreadsheet":
        return `${DOCS_BASE_URL}/spreadsheets/d/${fileId}/edit`;
      case "application/vnd.google-apps.presentation":
        return `${DOCS_BASE_URL}/presentation/d/${fileId}/edit`;
      case "application/vnd.google-apps.drawing":
        return `${DOCS_BASE_URL}/drawings/d/${fileId}/edit`;
      case "application/vnd.google-apps.form":
        return `${DOCS_BASE_URL}/forms/d/${fileId}/edit`;
      case "text/html":
      case "text/plain":
      case "application/rtf":
        return `https://docs.google.com/document/d/${fileId}/edit`;
      default:
        return `https://drive.google.com/file/d/${fileId}/edit`;
    }
  };

  useEffect(() => {
    const fetchFileContent = async () => {
      try {
        if (authLoading) return;

        setLoading(true);
        setError(null);

        const accessToken = await getGoogleDriveToken();

        const response = await fetch(
          `${DRIVE_API_URL}/files/${fileId}?fields=name,mimeType,webViewLink,capabilities`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get file info: ${errorText}`);
        }

        const data = await response.json();
        setFileName(data.name || "Untitled");
        setMimeType(data.mimeType || "");

        if (data.webViewLink) {
          let editLink = data.webViewLink;
          if (!editLink.includes("/edit")) {
            editLink = editLink.endsWith("/")
              ? `${editLink}edit`
              : `${editLink}/edit`;
          }
          setWebViewLink(editLink);
        }

        try {
          const fileContent = await getGoogleDriveFile(fileId, accessToken);
          setContent(fileContent);
        } catch (downloadError) {
          console.log("Error downloading file:", downloadError);
          if (downloadError instanceof Error) {
            setError(`Error loading file: ${downloadError.message}`);
          } else {
            setError("Error loading file: An unknown error occurred");
          }
        }
      } catch (error: unknown) {
        console.log("Error fetching file:", error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to load file");
        }
      } finally {
        setLoading(false);
      }
    };

    if (fileId && !authLoading) {
      fetchFileContent();
    }
  }, [fileId, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const documentUrl = getDocumentUrl();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/drive">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Drive Files
          </Button>
        </Link>

        <div className="flex gap-2">
          <a href={documentUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Edit in Google{" "}
              {mimeType.includes("spreadsheet")
                ? "Sheets"
                : mimeType.includes("presentation")
                ? "Slides"
                : mimeType.includes("form")
                ? "Forms"
                : "Docs"}
            </Button>
          </a>

          <DriveImportButton fileId={fileId} fileName={fileName} />
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">{fileName}</h1>

      {error ? (
        <div className="border rounded-lg p-6 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 h-5 w-5 mt-0.5" />
            <div>
              <p className="text-yellow-800">{error}</p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Edit this document in Google Drive
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-8 bg-white shadow-sm">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
}
