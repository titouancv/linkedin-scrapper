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
  createdAt: string;
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

const AUTHORS = [
  "Marie Dupont",
  "Jean Martin",
  "Sofia Rossi",
  "Luca Bianchi",
  "Anna Schmidt",
  "Thomas Bernard",
  "Camille Leroy",
  "Nadia Benali",
  "Olivier Moreau",
  "Sarah Nguyen",
  "David Cohen",
  "Emma Laurent",
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, items: T[]) {
  return items[Math.floor(rng() * items.length)];
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarUrlForName(fullName: string) {
  const seed = encodeURIComponent(fullName);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
}

function generatePostText(topicName: string, rng: () => number) {
  const openers = [
    `Point rapide sur ${topicName} :`,
    `${topicName} — ce qu'il faut retenir :`,
    `Quelques implications pratiques de ${topicName} :`,
    `Décryptage ${topicName} :`,
  ];
  const bullets = [
    "Ce que ça change pour la conformité et la gouvernance",
    "Les points d'attention sur la mise en œuvre opérationnelle",
    "Les risques en cas de non-conformité et les priorités",
    "Comment structurer une roadmap réaliste",
    "Les questions ouvertes et arbitrages à anticiper",
    "Les impacts sur les fournisseurs et la chaîne de valeur",
  ];
  const closer = [
    "Curieux de vos retours.",
    "Je serais preneur de vos exemples concrets.",
    "Qu'en pensez-vous côté implémentation?",
  ];

  const count = 2 + Math.floor(rng() * 3);
  const picked: string[] = [];
  for (let i = 0; i < count; i++) picked.push(pick(rng, bullets));

  return `${pick(rng, openers)}\n\n- ${picked.join("\n- ")}\n\n${pick(
    rng,
    closer
  )}`;
}

const postsCache = new Map<string, LinkedInPost[]>();

function getOrCreatePostsForTopic(topic: { slug: string; name: string }) {
  const cached = postsCache.get(topic.slug);
  if (cached) return cached;

  const rng = mulberry32(hashStringToSeed(topic.slug));
  const now = Date.now();
  const total = 160;

  const posts: LinkedInPost[] = Array.from({ length: total }).map((_, i) => {
    const fullName = pick(rng, AUTHORS);
    const hoursAgo = Math.floor(rng() * 72);
    const minutesAgo = Math.floor(rng() * 60);
    const createdAt = new Date(now - (hoursAgo * 60 + minutesAgo) * 60_000);

    const base = 20 + Math.floor(rng() * 400);
    const likes = Math.floor(base * (0.8 + rng()));
    const comments = Math.floor(base * (0.15 + rng() * 0.5));
    const reposts = Math.floor(base * (0.05 + rng() * 0.25));

    const activityId = `7${hashStringToSeed(`${topic.slug}-${i}`)
      .toString()
      .padStart(18, "0")}`;

    return {
      id: `${topic.slug}-${i}`,
      topic: topic.slug,
      url: `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}`,
      author: {
        fullName,
        avatarUrl: avatarUrlForName(fullName),
      },
      text: generatePostText(topic.name, rng),
      createdAt: createdAt.toISOString(),
      metrics: {
        likes,
        comments,
        reposts,
      },
    };
  });

  posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  postsCache.set(topic.slug, posts);
  return posts;
}

export function listSubjects(): Subject[] {
  return TOPICS.map((t) => {
    const posts = getOrCreatePostsForTopic(t);
    const sample = posts.slice(0, 50);
    const popularity = sample.reduce((acc, p) => {
      const m = p.metrics;
      return (
        acc + (m?.likes ?? 0) + 3 * (m?.comments ?? 0) + 5 * (m?.reposts ?? 0)
      );
    }, 0);
    const normalized = Math.max(1, Math.min(100, Math.round(popularity / 250)));

    return {
      slug: t.slug,
      name: t.name,
      postCount: posts.length,
      popularityScore: normalized,
    };
  });
}

export function getTopicName(slug: string) {
  return TOPICS.find((t) => t.slug === slug)?.name;
}

export function getLinkedInFeed(params: {
  topic: string;
  cursor?: number;
  limit?: number;
}): { items: LinkedInPost[]; nextCursor: number | null } {
  const topic = TOPICS.find((t) => t.slug === params.topic);
  if (!topic) return { items: [], nextCursor: null };

  const all = getOrCreatePostsForTopic(topic);
  const cursor = Math.max(0, params.cursor ?? 0);
  const limit = Math.max(1, Math.min(30, params.limit ?? 15));

  const items = all.slice(cursor, cursor + limit);
  const nextCursor =
    cursor + items.length < all.length ? cursor + items.length : null;

  return { items, nextCursor };
}

export function formatRelative(isoDate: string) {
  const ts = new Date(isoDate).getTime();
  const diffMs = Date.now() - ts;
  const diffMin = Math.max(0, Math.floor(diffMs / 60_000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} days ago`;
  return new Date(ts).toISOString().slice(0, 10);
}

export function getInitials(fullName: string) {
  return initials(fullName);
}
