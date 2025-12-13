import type { Subject } from "@/types";

export type { Subject, LinkedInPost } from "@/types";

const TOPICS: Array<{ slug: string; name: string; field: string }> = [
  // AI & Data
  { slug: "ai-act", name: "AI Act", field: "AI & Data" },
  { slug: "data-act", name: "Data Act", field: "AI & Data" },
  {
    slug: "data-governance-act",
    name: "Data Governance Act",
    field: "AI & Data",
  },
  // Digital Markets
  { slug: "dma", name: "Digital Markets Act", field: "Digital Markets" },
  { slug: "dsa", name: "Digital Services Act", field: "Digital Markets" },
  // Privacy & Security
  { slug: "gdpr", name: "GDPR", field: "Privacy & Security" },
  { slug: "nis2", name: "NIS2 Directive", field: "Privacy & Security" },
  {
    slug: "cyber-resilience-act",
    name: "Cyber Resilience Act",
    field: "Privacy & Security",
  },
  {
    slug: "eprivacy",
    name: "ePrivacy Regulation",
    field: "Privacy & Security",
  },
  // Finance
  { slug: "dora", name: "DORA", field: "Finance" },
  { slug: "mica", name: "MiCA", field: "Finance" },
  // Sustainability
  { slug: "csrd", name: "CSRD", field: "Sustainability" },
  { slug: "csddd", name: "CSDDD", field: "Sustainability" },
  { slug: "eu-taxonomy", name: "EU Taxonomy", field: "Sustainability" },
  // Other
  { slug: "eidas", name: "eIDAS 2.0", field: "Other" },
  { slug: "eu-ai-liability", name: "AI Liability Directive", field: "Other" },
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
      field: t.field,
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
