"use client";

import { getClientAppCheckToken, getClientAuth } from "../firebase/client";

export async function nominationCommandHeaders(): Promise<Record<string, string>> {
  let token = "demo-scout-token";
  let isSignedIn = false;
  try {
    const user = getClientAuth().currentUser;
    if (user) {
      token = await user.getIdToken();
      isSignedIn = true;
    }
  } catch {
    // client auth unconfigured
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
  };

  try {
    const appCheckToken = await getClientAppCheckToken();
    if (appCheckToken) {
      headers["x-firebase-appcheck"] = appCheckToken;
    } else if (isSignedIn && typeof window !== "undefined") {
      throw new Error("App Check token is unavailable.");
    }
  } catch (error) {
    console.error("[AppCheck] Failed to acquire App Check token for nomination:", error);
    if (isSignedIn) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`App Check verification failed: ${msg}`);
    }
  }

  return headers;
}
