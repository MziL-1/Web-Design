export interface ImportResult {
  content: string;
  filename: string;
  wordCount: number;
  warnings: string[];
}

export async function parseMarkdown(file: File): Promise<ImportResult> {
  const content = await file.text();
  return {
    content,
    filename: file.name,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    warnings: [],
  };
}

export async function parseDocx(file: File): Promise<ImportResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const warnings: string[] = [];
  if (result.messages.length > 0) {
    warnings.push(...result.messages.map((m: { message: string }) => `Parse note: ${m.message}`));
  }
  return {
    content: result.value,
    filename: file.name,
    wordCount: result.value.split(/\s+/).filter(Boolean).length,
    warnings,
  };
}

export function validateImportFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['.md', '.docx', '.doc'];
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported format: ${ext}. Allowed: .md, .docx, .doc` };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB` };
  }
  return { valid: true };
}
