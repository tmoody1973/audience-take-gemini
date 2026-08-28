"use client";

import { getClientAppCheckToken, getClientAuth } from "../firebase/client";

export async function nominationCommandHeaders(): Promise<Record<string, string>> {
  let token = "demo-scout-token";
  try {
    const user = getClientAuth().currentUser;
    if (user) {
      token = await user.getIdToken();
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
    if (appCheckToken) headers["x-firebase-appcheck"] = appCheckToken;
  } catch {
    // optional in demo
  }

  return headers;
}
