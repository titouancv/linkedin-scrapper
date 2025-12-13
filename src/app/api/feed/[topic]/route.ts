import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTopicName } from "@/lib/radar";
import { searchLinkedInPosts } from "@/lib/googleCustomSearch";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params;
  const url = new URL(req.url);

  // Pagination: start index (1-based, increments by 10)
  const startParam = url.searchParams.get("start");
  const start = startParam ? Math.max(1, parseInt(startParam, 10)) : 1;

  const topicName = getTopicName(topic) ?? topic;
  const { results, hasMore } = await searchLinkedInPosts(topicName, start);

  // Map to LinkedInPost-like structure
  const items = results.map((r, i) => ({
    id: `google-${start + i}-${Date.now()}`,
    topic,
    url: r.link,
    author: {
      fullName: r.authorName,
      avatarUrl: r.authorAvatar,
      profileUrl: r.authorProfileUrl,
    },
    text: r.content,
    relativeDate: r.relativeDate,
    imageUrl: r.imageUrl || undefined,
    metrics: {
      likes: r.likes,
      comments: r.comments,
    },
  }));

  // Next cursor is the next start index, or null if no more results
  const nextCursor = hasMore ? start + 10 : null;

  return NextResponse.json({ items, nextCursor });
}
