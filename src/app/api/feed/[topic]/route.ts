import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getTopicName } from "@/lib/radar";
import { searchLinkedInPosts } from "@/lib/googleCustomSearch";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params;

  const topicName = getTopicName(topic) ?? topic;
  const results = await searchLinkedInPosts(topicName);

  // Map to LinkedInPost-like structure
  const items = results.map((r, i) => ({
    id: `google-${i}-${Date.now()}`,
    topic,
    url: r.link,
    author: {
      fullName: r.authorName,
      avatarUrl: r.authorAvatar,
      profileUrl: r.authorProfileUrl,
    },
    text: r.content,
    relativeDate: r.relativeDate,
    metrics: {
      likes: r.likes,
      comments: r.comments,
    },
  }));

  return NextResponse.json({ items, nextCursor: null });
}
