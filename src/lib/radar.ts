export type Subject = {
  slug: string;
  name: string;
  postCount: number;
  popularityScore: number;
};

export type LinkedInPost = {
  id: string;
  topic: string;
  url: string;
  author: {
    fullName: string;
    avatarUrl?: string;
  };
  text: string;
  relativeDate: string;
  metrics?: {
    likes?: number;
    comments?: number;
    reposts?: number;
  };
};

const TOPICS: Array<{ slug: string; name: string }> = [
  { slug: "ai-act", name: "AI Act" },
  { slug: "data-act", name: "Data Act" },
  { slug: "dma", name: "DMA" },
];

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function listSubjects(): Subject[] {
  return TOPICS.map((t) => {
    return {
      slug: t.slug,
      name: t.name,
      postCount: 0,
      popularityScore: 0,
    };
  });
}

export function getTopicName(slug: string) {
  return TOPICS.find((t) => t.slug === slug)?.name;
}

export function getInitials(fullName: string) {
  return initials(fullName);
}
