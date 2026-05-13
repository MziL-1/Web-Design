import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateImportFile, parseMarkdown, parseDocx } from "@/lib/import";

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
    let result;
    if (ext === ".md") {
      result = await parseMarkdown(file);
    } else {
      result = await parseDocx(file);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json({ error: "文件解析失败" }, { status: 500 });
  }
}
