import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import mammoth from "mammoth";

const ALLOWED_EXTENSIONS = [".md", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024;

function validateImportFile(file: File): { valid: boolean; error?: string } {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported format: ${ext}. Allowed: .md, .docx` };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 10MB` };
  }
  return { valid: true };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "127.0.0.1";
  if (!(await checkRateLimit(ip, "import"))) {
    return NextResponse.json({ error: "操作太频繁，请稍后再试" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const validation = validateImportFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    let content: string;
    let warnings: string[] = [];

    if (ext === ".md") {
      content = await file.text();
    } else {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
      if (result.messages.length > 0) {
        warnings = result.messages.map((m) => `Parse note: ${m.message}`);
      }
    }

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      content,
      filename: file.name,
      wordCount,
      warnings,
    });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json({ error: "文件解析失败" }, { status: 500 });
  }
}
