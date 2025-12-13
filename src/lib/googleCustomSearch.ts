import type {
  GoogleCseResponse,
  LinkedInPostData,
  SearchResult,
} from "@/types";
import { parseLinkedInPost, truncateText } from "./linkedinParser";

const API_KEY = process.env.GOOGLE_API_KEY!;
const CX = process.env.GOOGLE_CX!;

export async function searchLinkedInPosts(
  topic: string,
  start: number = 1
): Promise<{ results: SearchResult[]; hasMore: boolean }> {
  const query = `site:linkedin.com/posts "${topic}"`;

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx", CX);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "10");
  url.searchParams.set("start", start.toString());
  url.searchParams.set("sort", "date:r");

  const res = await fetch(url.toString());
  const data: GoogleCseResponse = await res.json();

  if (!data.items) return { results: [], hasMore: false };

  // Fetch all LinkedIn pages in parallel for faster loading
  const htmlResults = await Promise.all(
    data.items.map(async (item) => {
      const link = item.link ?? "";
      try {
        const html = await fetchLinkedInPage(link);
        return { item, html };
      } catch {
        return { item, html: null };
      }
    })
  );

  // Parse all results
  const results: SearchResult[] = htmlResults.map(({ item, html }) => {
    const snippet = item.snippet ?? "";
    const link = item.link ?? "";

    let linkedInData: LinkedInPostData = {
      authorName: "Unknown",
      authorAvatar: "",
      authorProfileUrl: "",
      content: "",
      relativeDate: "",
      imageUrl: "",
      likes: 0,
      comments: 0,
    };

    if (html) {
      linkedInData = parseLinkedInPost(html);
    }

    return {
      title: item.title ?? "",
      link,
      snippet,
      authorName: linkedInData.authorName,
      authorAvatar: linkedInData.authorAvatar,
      authorProfileUrl: linkedInData.authorProfileUrl,
      content: truncateText(linkedInData.content || snippet, 500),
      relativeDate: linkedInData.relativeDate,
      imageUrl: linkedInData.imageUrl,
      likes: linkedInData.likes,
      comments: linkedInData.comments,
    };
  });

  // Google CSE limits to 100 results (10 pages of 10)
  const hasMore = start < 91 && results.length === 10;

  return { results, hasMore };
}

async function fetchLinkedInPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}
