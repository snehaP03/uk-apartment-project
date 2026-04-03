/**
 * Field-Level Encryption Utility
 * ──────────────────────────────
 * Algorithm : AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode)
 * Key Deriv.: SHA-256 hash of ENCRYPTION_KEY environment variable → 32-byte key
 * IV        : 16 random bytes per encryption (unique per ciphertext)
 * Auth Tag  : 16 bytes (GCM integrity verification)
 * Output    : hex string formatted as  iv:authTag:ciphertext
 *
 * AES-256-GCM provides both confidentiality (encryption) and integrity (authentication tag).
 * Each encryption produces a unique ciphertext even for the same plaintext due to the random IV.
 *
 * For deterministic lookups (e.g. finding a user by email), a separate SHA-256 hash is stored.
 * SHA-256 is a one-way cryptographic hash — it cannot be reversed, but identical inputs always
 * produce the same hash, enabling exact-match queries on encrypted fields.
 */

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte encryption key from the ENCRYPTION_KEY environment variable.
 * Uses SHA-256 to normalise any-length secret into the exact key size AES-256 requires.
 */
function getKey() {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "default-dev-key";
    return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt
 * @returns {string} Encrypted string in format  iv:authTag:ciphertext  (all hex-encoded)
 */
function encrypt(text) {
    if (!text) return text;
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * @param {string} encryptedText - The encrypted string in  iv:authTag:ciphertext  format
 * @returns {string} The original plaintext
 */
function decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    // If text doesn't look encrypted (no colons), return as-is (backward compat)
    if (!encryptedText.includes(":")) return encryptedText;
    try {
        const parts = encryptedText.split(":");
        if (parts.length !== 3) return encryptedText;
        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = parts[2];
        const key = getKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch {
        // If decryption fails, return original (handles legacy unencrypted data)
        return encryptedText;
    }
}

/**
 * Create a deterministic SHA-256 hash for lookup purposes.
 * Used to find users by email without exposing the plaintext in the database.
 * @param {string} text - The plaintext to hash (e.g. normalised email)
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashForLookup(text) {
    if (!text) return text;
    return crypto.createHash("sha256").update(text.toLowerCase().trim()).digest("hex");
}

module.exports = { encrypt, decrypt, hashForLookup };
