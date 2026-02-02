export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key';
}
