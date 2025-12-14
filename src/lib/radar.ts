import type { Subject } from "@/types";
import { compareKeywordsPopularity } from "./googleTrends";

export type { Subject, LinkedInPost } from "@/types";

// Cache for popularity scores (in-memory, resets on server restart)
let popularityCache: Map<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const TOPICS: Array<{
  slug: string;
  name: string;
  field: string;
  description: string;
}> = [
  // AI & Data
  {
    slug: "ai-act",
    name: "AI Act",
    field: "AI & Data",
    description:
      "Règlement européen établissant un cadre juridique pour le développement, la mise sur le marché et l’utilisation des systèmes d’intelligence artificielle, fondé sur une approche par les risques.",
  },
  {
    slug: "data-act",
    name: "Data Act",
    field: "AI & Data",
    description:
      "Règlement visant à faciliter l’accès, le partage et la réutilisation des données, en particulier les données industrielles et issues des objets connectés.",
  },

  // Digital Markets
  {
    slug: "dma",
    name: "Digital Markets Act",
    field: "Digital Markets",
    description:
      "Règlement visant à garantir des marchés numériques équitables et contestables, en imposant des obligations spécifiques aux grandes plateformes dites « gatekeepers ».",
  },
  {
    slug: "dsa",
    name: "Digital Services Act",
    field: "Digital Markets",
    description:
      "Règlement établissant des règles harmonisées pour les services numériques, notamment en matière de responsabilité des plateformes, de modération des contenus et de transparence.",
  },

  // Privacy & Security
  {
    slug: "gdpr",
    name: "GDPR",
    field: "Privacy & Security",
    description:
      "Règlement général sur la protection des données encadrant le traitement des données personnelles et renforçant les droits des personnes au sein de l’Union européenne.",
  },
  {
    slug: "nis2",
    name: "NIS2 Directive",
    field: "Privacy & Security",
    description:
      "Directive européenne renforçant les exigences de cybersécurité pour les entités essentielles et importantes, afin d’améliorer la résilience globale de l’UE.",
  },

  // Finance
  {
    slug: "dora",
    name: "DORA",
    field: "Finance",
    description:
      "Règlement sur la résilience opérationnelle numérique du secteur financier, visant à renforcer la gestion des risques liés aux technologies de l’information.",
  },
  {
    slug: "mica",
    name: "MiCA",
    field: "Finance",
    description:
      "Règlement établissant un cadre harmonisé pour les crypto-actifs, les émetteurs et les prestataires de services sur crypto-actifs au sein de l’UE.",
  },
];

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Fetch popularity scores from Google Trends for all topics
 */
async function fetchPopularityScores(): Promise<Map<string, number>> {
  const keywords = TOPICS.map((t) => t.name);
  return await compareKeywordsPopularity(keywords);
}

/**
 * Get cached popularity scores, refreshing if needed
 */
async function getPopularityScores(): Promise<Map<string, number>> {
  const now = Date.now();

  if (popularityCache && now - cacheTimestamp < CACHE_DURATION) {
    return popularityCache;
  }

  try {
    popularityCache = await fetchPopularityScores();
    cacheTimestamp = now;
    return popularityCache;
  } catch (error) {
    console.error("Failed to fetch popularity scores:", error);
    // Return empty map if fetch fails, keeping old cache if available
    return popularityCache || new Map();
  }
}

/**
 * List all subjects with popularity scores from Google Trends
 */
export async function listSubjectsWithPopularity(): Promise<Subject[]> {
  const scores = await getPopularityScores();

  return TOPICS.map((t) => ({
    slug: t.slug,
    name: t.name,
    field: t.field,
    description: t.description,
    popularityScore: scores.get(t.name) || 0,
  }));
}

export function getTopicName(slug: string) {
  return TOPICS.find((t) => t.slug === slug)?.name;
}

export function getInitials(fullName: string) {
  return initials(fullName);
}
