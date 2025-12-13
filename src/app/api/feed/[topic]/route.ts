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

  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 10;

  const topicName = getTopicName(topic) ?? topic;
  const results = await searchLinkedInPosts(topicName, Math.min(limit, 10));

  // Log all discovered links
  console.log(
    `[Google Search] Found ${results.length} links for "${topicName}":`
  );
  results.forEach((r, i) => console.log(`  ${i + 1}. ${r.link}`));

  // Map to LinkedInPost-like structure
  const items = results.map((r, i) => ({
    id: `google-${i}-${Date.now()}`,
    topic,
    url: r.link,
    author: { fullName: "LinkedIn" },
    text: `${r.title}\n\n${r.snippet}`,
    createdAt: new Date().toISOString(),
  }));

  return NextResponse.json({ items, nextCursor: null });
}
