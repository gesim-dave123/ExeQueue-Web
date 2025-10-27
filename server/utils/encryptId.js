import crypto from "crypto";

let KEY;
if (
  process.env.JWT_SECRET.match(/^[0-9a-fA-F]+$/) &&
  process.env.JWT_SECRET.length === 64
) {
  KEY = Buffer.from(process.env.JWT_SECRET, "hex");
} else {
  KEY = crypto.createHash("sha256").update(process.env.JWT_SECRET).digest();
}

console.log("Key length:", KEY.length); // Should be 32

export function encryptQueueId(id) {
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(id), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Token = iv + tag + ciphertext → base64url
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptQueueId(token) {
  const raw = Buffer.from(token, "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");

  return parseInt(decrypted, 10);
}
