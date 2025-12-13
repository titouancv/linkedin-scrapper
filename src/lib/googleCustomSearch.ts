const API_KEY = process.env.GOOGLE_API_KEY!;
const CX = process.env.GOOGLE_CX!;

type GoogleCseItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

type GoogleCseResponse = {
  items?: GoogleCseItem[];
};

export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export async function searchLinkedInPosts(
  topic: string,
  numResults = 10
): Promise<SearchResult[]> {
  console.log("Searching LinkedIn posts for topic:", topic);
  const query = `site:linkedin.com/posts "${topic}"`;

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("cx", CX);
  url.searchParams.set("q", query);
  url.searchParams.set("num", numResults.toString());

  const res = await fetch(url.toString());
  const data: GoogleCseResponse = await res.json();

  if (!data.items) return [];

  console.log("Google CSE returned items:", data.items);

  return data.items.map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    snippet: item.snippet ?? "",
  }));
}
