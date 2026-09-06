import { getClientAppCheckToken, getClientAuth } from "../../lib/firebase/client";

export async function socialCommand<T>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  let token = "demo-scout-token";
  try {
    const user = getClientAuth().currentUser;
    if (user) {
      token = await user.getIdToken();
    }
  } catch {
    // client auth unconfigured in test/offline environment
  }
  const headers = new Headers({ "content-type": "application/json", authorization: `Bearer ${token}` });
  const appCheck = await getClientAppCheckToken();
  if (appCheck) headers.set("x-firebase-appcheck", appCheck);
  const response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const envelope = (await response.json()) as { ok?: boolean; data?: T; error?: { message?: string } };
  if (!response.ok || !envelope.ok) throw new Error(envelope.error?.message ?? "That action could not be saved.");
  return envelope.data as T;
}
