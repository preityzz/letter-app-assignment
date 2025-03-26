// Get Drive API URLs from environment variables
const DRIVE_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_URL ||
  "https://www.googleapis.com/drive/v3";

// List files from Google Drive
export async function listGoogleDriveFiles(
  accessToken: string
): Promise<{ id: string; name: string; mimeType: string; createdTime: string; modifiedTime: string; webViewLink: string }[]> {
  try {
    const response = await fetch(
      `${DRIVE_API_URL}/files?orderBy=modifiedTime desc&fields=files(id,name,mimeType,createdTime,modifiedTime,webViewLink)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error (${response.status})`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.log("Error listing Google Drive files:", error);
    throw error;
  }
}

// Get file content from Google Drive
export async function getGoogleDriveFile(
  fileId: string,
  accessToken: string
): Promise<string> {
  try {
    // First, get the file metadata to check its mimeType
    const metadataResponse = await fetch(
      `${DRIVE_API_URL}/files/${fileId}?fields=mimeType,name`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!metadataResponse.ok) {
      const errorResponse = await metadataResponse.text();
      console.log("Error getting file metadata:", errorResponse);
      throw new Error(
        `Google Drive API error (${metadataResponse.status}): ${errorResponse}`
      );
    }

    const metadata = await metadataResponse.json();
    console.log("File metadata:", metadata);

    let response;

    // Check if it's a Google Docs format file
    if (metadata.mimeType === "application/vnd.google-apps.document") {
      console.log("This is a Google Docs file - using export");
      // For Google Docs, we need to export it
      response = await fetch(
        `${DRIVE_API_URL}/files/${fileId}/export?mimeType=text/html`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } else {
      console.log("This is a regular file - downloading directly");
      // For regular files, we can download directly
      response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    if (!response.ok) {
      const errorResponse = await response.text();
      console.log("Error response from Google Drive API:", errorResponse);
      throw new Error(
        `Google Drive API error (${response.status}): ${errorResponse}`
      );
    }

    return await response.text();
  } catch (error) {
    console.log("Error getting Google Drive file:", error);
    throw error;
  }
}

// Upload to Google Drive
export async function uploadToGoogleDrive(
  content: string,
  fileName: string,
  accessToken: string
): Promise<{ id: string; name: string; mimeType: string; webViewLink: string }> {
  try {
    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";

    const metadata = {
      name: fileName,
      mimeType: "text/html",
    };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: text/html\r\n\r\n" +
      content +
      closeDelimiter;

    const response = await fetch(`${DRIVE_API_URL}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error uploading to Google Drive:", error);
    throw error;
  }
}

// Convert to Google Docs
export async function convertToGoogleDocs(
  fileId: string,
  accessToken: string
): Promise<{ id: string; name: string; mimeType: string; webViewLink: string }> {
  try {
    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}/copy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mimeType: "application/vnd.google-apps.document",
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.log("Error converting to Google Docs:", error);
    throw error;
  }
}
