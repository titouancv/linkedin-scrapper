import type {
  GoogleCseResponse,
  LinkedInPostData,
  SearchResult,
} from "@/types";
import { parseLinkedInPost, truncateText } from "./linkedinParser";

const API_KEY = process.env.GOOGLE_API_KEY!;
const CX = process.env.GOOGLE_CX!;

export async function searchLinkedInPosts(
  topic: string
): Promise<SearchResult[]> {
  const query = `site:linkedin.com/posts "${topic}"`;

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx", CX);
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "date:r");

  const res = await fetch(url.toString());
  const data: GoogleCseResponse = await res.json();

  if (!data.items) return [];

  // Fetch and parse HTML for each result
  const results: SearchResult[] = [];

  for (const item of data.items) {
    const snippet = item.snippet ?? "";
    const link = item.link ?? "";

    let linkedInData: LinkedInPostData = {
      authorName: "Unknown",
      authorAvatar: "",
      authorProfileUrl: "",
      content: "",
      relativeDate: "",
      likes: 0,
      comments: 0,
    };

    try {
      const html = await fetchLinkedInPage(link);
      if (html) {
        linkedInData = parseLinkedInPost(html);
      }
    } catch (error) {
      console.error(`Failed to fetch/parse ${link}:`, error);
    }

    results.push({
      title: item.title ?? "",
      link,
      snippet,
      authorName: linkedInData.authorName,
      authorAvatar: linkedInData.authorAvatar,
      authorProfileUrl: linkedInData.authorProfileUrl,
      content: truncateText(linkedInData.content || snippet, 500),
      relativeDate: linkedInData.relativeDate,
      likes: linkedInData.likes,
      comments: linkedInData.comments,
    });
  }

  return results;
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
