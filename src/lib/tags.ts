export const PRESET_TAGS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'CSS',
  'Frontend', 'Backend', 'Fullstack', 'Design', 'Life',
  'Tutorial', 'Opinion',
];

export function validateTagName(name: unknown): { valid: boolean; error?: string } {
  if (typeof name !== 'string') return { valid: false, error: 'Tag name must be a string' };
  if (name.length < 1 || name.length > 30) return { valid: false, error: 'Tag name must be 1-30 characters' };
  if (!/^[a-zA-Z0-9\u4e00-\u9fff\s._-]+$/.test(name)) return { valid: false, error: 'Tag name contains invalid characters' };
  return { valid: true };
}
