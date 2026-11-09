import crypto from 'crypto';
import fs from 'fs';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

/**
 * Derives a consistent 32-byte (256-bit) encryption key
 */
export const getVaultKey = () => {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.JWT_SECRET || 'smartfinance-secure-vault-master-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts a plaintext file on disk using AES-256-GCM.
 * Removes original plaintext file and writes ciphertext to encrypted destination.
 * 
 * @param {string} sourcePath - Path to unencrypted file
 * @param {string} [destPath] - Path to write encrypted file (defaults to sourcePath + '.enc')
 * @returns {Promise<{ storedFilePath: string, iv: string, authTag: string, algorithm: string }>}
 */
export const encryptVaultFile = async (sourcePath, destPath = null) => {
  const targetPath = destPath || `${sourcePath}.enc`;
  const key = getVaultKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const plainBuffer = fs.readFileSync(sourcePath);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  fs.writeFileSync(targetPath, ciphertext);

  // Safely delete unencrypted original if different destination
  if (sourcePath !== targetPath && fs.existsSync(sourcePath)) {
    try {
      fs.unlinkSync(sourcePath);
    } catch (err) {
      console.warn(`[VaultEncryption] Warning: unable to delete temporary unencrypted file ${sourcePath}:`, err.message);
    }
  }

  return {
    storedFilePath: targetPath,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    algorithm: ALGORITHM,
  };
};

/**
 * Decrypts an encrypted vault file into memory for download streaming.
 * Verifies authenticity via GCM authentication tag.
 * 
 * @param {string} encFilePath - Path to encrypted file on disk
 * @param {string} ivHex - Hex-encoded IV
 * @param {string} authTagHex - Hex-encoded authentication tag
 * @returns {Buffer} Decrypted plaintext buffer
 */
export const decryptVaultFile = (encFilePath, ivHex, authTagHex) => {
  if (!fs.existsSync(encFilePath)) {
    throw new Error(`Encrypted file not found on disk: ${encFilePath}`);
  }

  const encBuffer = fs.readFileSync(encFilePath);
  const key = getVaultKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(encBuffer), decipher.final()]);
    return decrypted;
  } catch (err) {
    throw new Error(`Document integrity check failed. File may be tampered or key is invalid: ${err.message}`);
  }
};
