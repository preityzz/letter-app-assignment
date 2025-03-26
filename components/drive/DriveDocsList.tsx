"use client";

import { useState, useEffect } from "react";
import { getGoogleDriveToken } from "@/utils/googleAuth";
import { listGoogleDriveFiles } from "@/utils/googleDrive";
import { DriveFile } from "@/types";
import { Loader2, FileText, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function DriveDocsList() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsUserAction, setNeedsUserAction] = useState(false);

 
  useEffect(() => {
    setNeedsUserAction(true);
  }, []);

  const fetchDriveFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsUserAction(false);

    
      const accessToken = await getGoogleDriveToken();
      const driveFiles = await listGoogleDriveFiles(accessToken);

      setFiles(driveFiles);
    } catch (error: unknown) {
      console.log("Error fetching Drive files:", error);

     
      if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" && error.message.includes("cancelled")) {
        setError("Authentication was cancelled. Please try again.");
      } else if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "auth/popup-blocked") {
        setError(
          "Popup was blocked by your browser. Please allow popups for this site."
        );
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load files from Google Drive"
        );
      }

      setNeedsUserAction(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 border rounded-lg bg-red-50">
        <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchDriveFiles}>Try Again</Button>
      </div>
    );
  }

  if (needsUserAction) {
    return (
      <div className="text-center p-6 border rounded-lg bg-blue-50">
        <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
        <h2 className="text-lg font-medium mb-2">
          Access Your Google Drive Files
        </h2>
        <p className="text-gray-600 mb-4">
          Click the button below to connect to Google Drive and view your files.
        </p>
        <Button onClick={fetchDriveFiles}>Connect to Google Drive</Button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center p-6 border rounded-lg bg-gray-50">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-600 mb-2">
          No files found
        </h2>
        <p className="text-gray-500 mb-6">
          You haven&apos;t saved any letters to Google Drive yet.
        </p>
        <Button onClick={fetchDriveFiles} variant="outline" size="sm">
          Refresh Files
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Google Drive Documents</h2>
        <Button onClick={fetchDriveFiles} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-4 border rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-xs text-gray-500">
                    Modified {formatDistanceToNow(new Date(file.modifiedTime))}{" "}
                    ago
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <Link href={`/drive/${file.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
