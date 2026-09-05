import crypto from "crypto";

export function getSigningKey(secret: string): Buffer {
  const trimmed = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  return Buffer.from(trimmed, "base64");
}

export function computeParallelSignature(
  secret: string,
  webhookId: string,
  webhookTimestamp: string,
  rawBody: string
): string {
  const payload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const key = getSigningKey(secret);
  return crypto.createHmac("sha256", key).update(payload).digest("base64");
}

export function verifyParallelWebhookSignature(
  signatureHeader: string | null,
  secret: string,
  webhookId: string | null,
  webhookTimestamp: string | null,
  rawBody: string
): { valid: boolean; reason?: string } {
  if (!webhookId || !webhookTimestamp || !signatureHeader) {
    return { valid: false, reason: "Missing required webhook headers (webhook-id, webhook-timestamp, webhook-signature)" };
  }

  // Enforce timestamp freshness (within 300 seconds)
  const timestampNum = parseInt(webhookTimestamp, 10);
  const nowSec = Math.floor(Date.now() / 1000);
  if (isNaN(timestampNum) || Math.abs(nowSec - timestampNum) > 300) {
    return { valid: false, reason: "Webhook timestamp expired or too far in the future" };
  }

  try {
    const expectedSig = computeParallelSignature(secret, webhookId, webhookTimestamp, rawBody);
    const signatures = signatureHeader.split(" ");
    for (const part of signatures) {
      const [version, sig] = part.split(",", 2);
      if (version === "v1" && sig) {
        const expectedBuf = Buffer.from(expectedSig);
        const sigBuf = Buffer.from(sig);
        if (expectedBuf.length === sigBuf.length && crypto.timingSafeEqual(expectedBuf, sigBuf)) {
          return { valid: true };
        }
      }
    }
    return { valid: false, reason: "Signature mismatch" };
  } catch (err: unknown) {
    return { valid: false, reason: `Verification error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
