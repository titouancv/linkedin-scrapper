// ============================================
// Domain Types
// ============================================

export type Subject = {
  slug: string;
  name: string;
  field: string;
  description: string;
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
  imageUrl?: string;
  metrics?: {
    likes?: number;
    comments?: number;
  };
};

// ============================================
// LinkedIn Parser Types
// ============================================

export type LinkedInPostData = {
  authorName: string;
  authorAvatar: string;
  authorProfileUrl: string;
  content: string;
  relativeDate: string;
  imageUrl: string;
  likes: number;
  comments: number;
};

// ============================================
// Google Custom Search Types
// ============================================

export type GoogleCseItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

export type GoogleCseResponse = {
  items?: GoogleCseItem[];
};

export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
  authorName: string;
  authorAvatar: string;
  authorProfileUrl: string;
  content: string;
  relativeDate: string;
  imageUrl: string;
  likes: number;
  comments: number;
};
