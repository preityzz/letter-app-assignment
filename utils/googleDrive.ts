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
// Upload to Google Drive with fallback method
export async function uploadToGoogleDrive(
  content: string,
  fileName: string,
  accessToken: string
): Promise<{ id: string; name: string; mimeType: string; webViewLink?: string }> {
  try {
    // Try direct URL instead of using environment variables
    const apiUrl = "https://www.googleapis.com/drive/v3";
    
    try {
      // First attempt: Create file using 2-step method
      console.log("Creating Google Drive file using 2-step method");
      
      // Step 1: Create empty file with metadata
      const createResponse = await fetch(`${apiUrl}/files?fields=id,name,mimeType,webViewLink`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: "text/html",
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("Failed to create file:", errorText);
        throw new Error(`Failed to create file: ${createResponse.status}`);
      }

      const fileData = await createResponse.json();
      console.log("File created:", fileData);
      
      // Step 2: Update with content
      const updateResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileData.id}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/html',
          },
          body: content,
        }
      );

      if (!updateResponse.ok) {
        const updateErrorText = await updateResponse.text();
        console.error("Failed to update file content:", updateErrorText);
        throw new Error(`Failed to update file content: ${updateResponse.status}`);
      }
      
      // Get the updated file with webViewLink
      const getResponse = await fetch(
        `${apiUrl}/files/${fileData.id}?fields=id,name,mimeType,webViewLink`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!getResponse.ok) {
        throw new Error(`Failed to get updated file: ${getResponse.status}`);
      }
      
      return await getResponse.json();
      
    } catch (firstAttemptError) {
      console.error("First attempt method failed:", firstAttemptError);
      
      // Second attempt: Try with simpler approach
      console.log("Trying alternative upload method");
      
      // Create a simple text file
      const simpleResponse = await fetch(`${apiUrl}/files?fields=id,name,mimeType,webViewLink`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${fileName}.txt`,
          mimeType: "text/plain",
        }),
      });
      
      if (!simpleResponse.ok) {
        const simpleErrorText = await simpleResponse.text();
        console.error("Failed with simplified method:", simpleErrorText);
        throw new Error(`All upload methods failed`);
      }
      
      return await simpleResponse.json();
    }
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    throw error;
  }
}

// Convert to Google Docs
// Convert to Google Docs
export async function convertToGoogleDocs(
  fileId: string,
  accessToken: string
): Promise<{ id: string; name: string; mimeType: string; webViewLink?: string }> {
  try {
    // Use direct URL instead of environment variable
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/copy?fields=id,name,mimeType,webViewLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mimeType: "application/vnd.google-apps.document",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Docs conversion error:", errorText);
      throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("Conversion successful:", result);
    return result;
  } catch (error) {
    console.error("Error converting to Google Docs:", error);
    throw error;
  }
}
