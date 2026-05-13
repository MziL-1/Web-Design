import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/search";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.length < 1) return NextResponse.json({ users: [], posts: [], tags: [] });
  const results = await searchAll(q);
  return NextResponse.json(results);
}
