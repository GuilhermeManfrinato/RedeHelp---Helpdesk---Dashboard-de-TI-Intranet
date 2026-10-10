/**
 * Módulo Criptográfico do Cliente (Web Crypto API & Hashing Seguro)
 * Utilizado para segurança de ponta-a-ponta no sistema de Helpdesk da Intranet do 2º GAC
 */

export async function sha256Client(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}
