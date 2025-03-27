"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getGoogleDriveToken } from "@/utils/googleAuth";
import { getGoogleDriveFile } from "@/utils/googleDrive";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { auth } from "@/firebase/client";

interface DriveImportButtonProps {
  fileId: string;
  fileName: string;
}

export default function DriveImportButton({
  fileId,
  fileName,
}: DriveImportButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImport = async () => {
    try {
      setLoading(true);

      const accessToken = await getGoogleDriveToken();

      const content = await getGoogleDriveFile(fileId, accessToken);

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const letterData = {
        title: fileName.replace(".html", ""),
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.uid,
        isDraft: true,
      };

      const docRef = await addDoc(collection(db, "letters"), letterData);

      // Navigate to editor with the new letter ID
      router.push(`/editor/${docRef.id}`);
    } catch (error) {
      console.log("Error importing from Drive:", error);
      alert("Failed to import document from Drive");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleImport} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Importing...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Import to Editor
        </>
      )}
    </Button>
  );
}
