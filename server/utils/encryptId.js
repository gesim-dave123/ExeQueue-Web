import crypto from "crypto";

const KEY = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET)
  .digest()
  .subarray(0, 16); // AES-128 key

/**
 * Encrypts a numeric queue ID into a short, tamper-resistant token.
 * Produces ~18–20 chars total.
 */
export function encryptQueueId(id) {
  const iv = crypto.randomBytes(8); // compact 8-byte IV
  const ivFull = Buffer.concat([iv, Buffer.alloc(8, 0)]); // pad to 16 bytes for AES-CTR
  const cipher = crypto.createCipheriv("aes-128-ctr", KEY, ivFull);

  const idBuffer = Buffer.alloc(4);
  idBuffer.writeUInt32BE(Number(id));

  const encrypted = Buffer.concat([cipher.update(idBuffer), cipher.final()]);

  // 6-byte HMAC-SHA256 tag for tamper detection
  const mac = crypto
    .createHmac("sha256", KEY)
    .update(Buffer.concat([iv, encrypted]))
    .digest()
    .subarray(0, 6);

  return Buffer.concat([iv, encrypted, mac]).toString("base64url");
}

/**
 * Decrypts a token back to the original queue ID.
 * Returns null if token is invalid or tampered.
 */
export function decryptQueueId(token) {
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length < 8 + 4 + 6) return null;

    const iv = raw.subarray(0, 8);
    const encrypted = raw.subarray(8, 12);
    const mac = raw.subarray(12);

    const expectedMac = crypto
      .createHmac("sha256", KEY)
      .update(Buffer.concat([iv, encrypted]))
      .digest()
      .subarray(0, 6);

    if (mac.length !== expectedMac.length) return null;
    if (!crypto.timingSafeEqual(mac, expectedMac)) return null;

    const ivFull = Buffer.concat([iv, Buffer.alloc(8, 0)]);
    const decipher = crypto.createDecipheriv("aes-128-ctr", KEY, ivFull);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.readUInt32BE(0);
  } catch (err) {
    return null;
  }
}
