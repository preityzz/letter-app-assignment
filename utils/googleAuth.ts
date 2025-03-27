import {
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
  User,
} from "firebase/auth";
import { auth } from "@/firebase/client";

let isAuthenticating = false;

interface CachedToken {
  token: string;
  expiry: number;
}

const TOKEN_CACHE_KEY = "googleDriveTokenCache";

export function getTokenFromCache(): CachedToken | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(TOKEN_CACHE_KEY);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached) as CachedToken;

    if (parsedCache.expiry > Date.now()) {
      return parsedCache;
    } else {
      sessionStorage.removeItem(TOKEN_CACHE_KEY);
      return null;
    }
  } catch (error) {
    console.log("Error reading token from cache:", error);
    return null;
  }
}

function saveTokenToCache(token: string): void {
  if (typeof window === "undefined") return;

  try {
    const tokenCache: CachedToken = {
      token,
      expiry: Date.now() + 3000 * 1000,
    };

    sessionStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(tokenCache));
  } catch (error) {
    console.log("Error saving token to cache:", error);
  }
}

export async function getGoogleDriveToken(
  forceRefresh = false
): Promise<string> {
  try {
    if (!forceRefresh) {
      const cachedToken = getTokenFromCache();
      if (cachedToken) {
        const isValid = await testDriveAccess(cachedToken.token);
        if (isValid) {
          return cachedToken.token;
        }
      }
    }

    if (isAuthenticating) {
      throw new Error("Authentication already in progress");
    }

    isAuthenticating = true;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated. Please sign in first.");
    }

    try {
      const token = await refreshTokenWithoutPopup(currentUser);
      if (token) {
        saveTokenToCache(token);
        return token;
      }
    } catch (refreshError) {
      console.log("Error refreshing token silently:", refreshError);
    }

    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/drive.file");

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential || !credential.accessToken) {
      throw new Error("Failed to get access token");
    }

    saveTokenToCache(credential.accessToken);
    return credential.accessToken;
  } catch (error: unknown) {
    console.log("Error getting Google Drive token:", error);

    if (error instanceof Error && "code" in error) {
      if (error.code === "auth/cancelled-popup-request") {
        throw new Error("Authentication was cancelled. Please try again.");
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in popup was closed. Please try again.");
      }
    }

    throw error;
  } finally {
    isAuthenticating = false;
  }
}

async function refreshTokenWithoutPopup(user: User): Promise<string | null> {
  try {
    await user.getIdToken(true);

    const providerData = user.providerData.find(
      (provider) => provider.providerId === "google.com"
    );

    if (!providerData) {
      return null;
    }

    const authInstance = getAuth();
    const internalTokens = await authInstance.currentUser?.getIdTokenResult();

    if (internalTokens?.token) {
      const hasAccess = await testDriveAccess(internalTokens.token);
      if (hasAccess) {
        return internalTokens.token;
      }
    }

    return null;
  } catch (error) {
    console.log("Error refreshing token silently:", error);
    return null;
  }
}

export async function checkTokenScopes(accessToken: string): Promise<string[]> {
  try {
    const TOKENINFO_URL =
      process.env.NEXT_PUBLIC_GOOGLE_TOKENINFO_URL ||
      "https://www.googleapis.com/oauth2/v1/tokeninfo";

    const response = await fetch(
      `${TOKENINFO_URL}?access_token=${accessToken}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.scope ? data.scope.split(" ") : [];
  } catch (error) {
    console.log("Token info check error:", error);
    return [];
  }
}

export async function testDriveAccess(accessToken: string): Promise<boolean> {
  try {
    const DRIVE_API_URL =
      process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_URL ||
      "https://www.googleapis.com/drive/v3";

    const response = await fetch(`${DRIVE_API_URL}/about?fields=user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.log("Drive access test error:", error);
    return false;
  }
}

export function clearTokenCache(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(TOKEN_CACHE_KEY);
    console.log("Google Drive token cache cleared");
  } catch (error) {
    console.log("Error clearing token cache:", error);
  }
}
