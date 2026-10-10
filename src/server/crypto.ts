import crypto from 'crypto';

// Chave mestre de encriptação militar do 2º GAC (em produção fornecida via variável de ambiente)
const MASTER_SECRET = process.env.SYSTEM_CRYPTO_KEY || 'EB-2GAC-REGIMENTO-DEODORO-TI-SEC-KEY-2026';
const ALGORITHM = 'aes-256-cbc';
const SALT_ROUNDS = 10000;
const KEY_LEN = 32;

/**
 * Gera um hash SHA-256 com Salt criptográfico para senhas de militares
 */
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, SALT_ROUNDS, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Valida uma senha comparando com hash e salt salvos
 */
export function verifyPassword(password: string, savedHash: string, savedSalt: string): boolean {
  try {
    const { hash } = hashPassword(password, savedSalt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(savedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Criptografa dados confidenciais usando AES-256-CBC
 */
export function encryptPayload(data: string, secretKey: string = MASTER_SECRET): string {
  try {
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[Crypto] Erro ao criptografar payload:', err);
    return data;
  }
}

/**
 * Descriptografa dados confidenciais cifrados com AES-256-CBC
 */
export function decryptPayload(cipherText: string, secretKey: string = MASTER_SECRET): string {
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 2) return cipherText; // Retorna original se não estiver no formato esperado
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Erro ao descriptografar payload:', err);
    return cipherText;
  }
}

/**
 * Assina digitalmente uma requisição militar usando HMAC-SHA256 para evitar adulterações
 */
export function generateSignature(data: string, secretKey: string = MASTER_SECRET): string {
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
}

/**
 * Verifica a assinatura HMAC-SHA256 de uma requisição militar
 */
export function verifySignature(data: string, signature: string, secretKey: string = MASTER_SECRET): boolean {
  const expected = generateSignature(data, secretKey);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
