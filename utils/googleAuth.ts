import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase/client";

// Flag to prevent multiple popups
let isAuthenticating = false;

// Get Google OAuth token with Drive scopes
export async function getGoogleDriveToken(): Promise<string> {
  try {
    // Prevent multiple simultaneous auth attempts
    if (isAuthenticating) {
      throw new Error("Authentication already in progress");
    }

    isAuthenticating = true;
    console.log("Getting Google Drive token");

    // First verify the user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated. Please sign in first.");
    }

    // Create a new provider each time with required scope
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/drive.file");

    // Re-authenticate to get fresh token with Drive scope
    console.log("Starting Google sign-in popup with Drive scope");
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential || !credential.accessToken) {
      console.log("No credential or access token received");
      throw new Error("Failed to get access token");
    }

    console.log("Successfully obtained Google access token");
    return credential.accessToken;
  } catch (error: unknown) {
    console.log("Error getting Google Drive token:", error);

    // Log specific error information for debugging
    if (error instanceof Error && 'code' in error) {
      console.log(`Error code: ${error.code}`);
    }
    if (error instanceof Error && error.message) {
      console.log(`Error message: ${error.message}`);
    }

    // Special handling for common errors
    if (error instanceof Error && 'code' in error && error.code === "auth/cancelled-popup-request") {
      throw new Error(
        "Authentication was cancelled. Please try again and complete the sign-in process."
      );
    } else if (error instanceof Error && 'code' in error && error.code === "auth/popup-closed-by-user") {
      throw new Error(
        "Sign-in popup was closed. Please try again and complete the sign-in process."
      );
    }

    throw error;
  } finally {
    // Always reset the flag
    isAuthenticating = false;
  }
}

// Function to get drive token without showing popup again if already have permissions
export async function getTokenSilently(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    // Get the current ID token result which has the OAuth access token scopes
    const tokenResult = await currentUser.getIdTokenResult();
    const token = tokenResult.token;

    // If we have a token, use it - note this might not include Drive scope
    // without explicit user permission
    return token;
  } catch (error) {
    console.error("Error getting token silently:", error);
    return null;
  }
}

// Function to check if token includes Drive scope (for testing)
export async function checkTokenScopes(accessToken: string): Promise<string[]> {
  try {
    // add url to env file 
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" +
        accessToken
    );

    if (!response.ok) {
      console.log("Token info check failed:", await response.text());
      return [];
    }

    const data = await response.json();
    console.log("Token scopes:", data.scope);
    return data.scope.split(" ");
  } catch (error) {
    console.log("Token info check error:", error);
    return [];
  }
}

// Utility function to test drive access
export async function testDriveAccess(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.log("Drive access test failed:", await response.text());
      return false;
    }

    const data = await response.json();
    console.log("Drive access test succeeded:", data);
    return true;
  } catch (error) {
    console.log("Drive access test error:", error);
    return false;
  }
}
