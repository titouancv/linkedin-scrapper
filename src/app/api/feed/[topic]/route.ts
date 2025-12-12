import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLinkedInFeed } from "@/lib/radar";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params;
  const url = new URL(req.url);

  const cursorParam = url.searchParams.get("cursor");
  const limitParam = url.searchParams.get("limit");
  const cursor = cursorParam ? Number(cursorParam) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  const { items, nextCursor } = getLinkedInFeed({
    topic,
    cursor: Number.isFinite(cursor) ? cursor : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json({ items, nextCursor });
}
