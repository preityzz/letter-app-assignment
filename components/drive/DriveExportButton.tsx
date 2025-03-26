"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2, Check } from "lucide-react";
import { getGoogleDriveToken } from "@/utils/googleAuth";
import { uploadToGoogleDrive, convertToGoogleDocs } from "@/utils/googleDrive";

interface DriveExportButtonProps {
  content: string;
  title: string;
}

export default function DriveExportButton({
  content,
  title,
}: DriveExportButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setStatus("loading");

 
      const accessToken = await getGoogleDriveToken();

      // Upload HTML content
      const uploadResult = await uploadToGoogleDrive(
        content,
        title,
        accessToken
      );

      // Convert to Google Docs format
      const docResult = await convertToGoogleDocs(uploadResult.id, accessToken);

      // Store the web view link
      if (docResult.webViewLink) {
        setDocUrl(docResult.webViewLink);
      }

      setStatus("success");
    } catch (error) {
      console.error("Error exporting to Drive:", error);
      setStatus("error");
    }
  };

  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={status === "loading"}
        variant={status === "success" ? "default" : "outline"}
        className={
          status === "success" ? "bg-green-600 hover:bg-green-700" : ""
        }
        size="sm"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving to Drive...
          </>
        ) : status === "success" ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Saved to Drive
          </>
        ) : status === "error" ? (
          "Error Saving"
        ) : (
          <>
            <CloudUpload className="h-4 w-4 mr-2" />
            Save as Google Doc
          </>
        )}
      </Button>

      {docUrl && (
        <div className="mt-2">
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View in Google Docs
          </a>
        </div>
      )}
    </div>
  );
}
