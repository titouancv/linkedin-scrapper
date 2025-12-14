import * as cheerio from "cheerio";
import type { LinkedInPostData } from "@/types";

export function parseLinkedInPost(html: string): LinkedInPostData {
  const $ = cheerio.load(html);

  // Author name
  const authorName =
    $('a[data-tracking-control-name="public_post_feed-actor-name"]')
      .first()
      .text()
      .trim() || "Unknown";

  // Author avatar - get from data-delayed-url attribute
  const authorAvatar =
    $('a[data-tracking-control-name="public_post_feed-actor-image"] img').attr(
      "data-delayed-url"
    ) || "";

  // Author profile URL
  const authorProfileUrl =
    $('a[data-tracking-control-name="public_post_feed-actor-image"]').attr(
      "href"
    ) || "";

  // Post content
  const content =
    $('[data-test-id="main-feed-activity-card__commentary"]').text().trim() ||
    "";

  // Relative date (e.g., "3mo", "2d", "5h")
  const relativeDate = formatRelativeDate(
    $(".base-main-feed-card__entity-lockup time").first().text().trim() || ""
  );

  // Likes/Reactions count
  const likesText =
    $('[data-test-id="social-actions__reactions"]').attr(
      "data-num-reactions"
    ) || "0";
  const likes = parseInt(likesText, 10) || 0;

  // Comments count
  const commentsText =
    $('[data-test-id="social-actions__comments"]').attr("data-num-comments") ||
    "0";
  const comments = parseInt(commentsText, 10) || 0;

  // Main post image - try multiple selectors
  let imageUrl = "";

  // Try the main feed card media image (most common)
  const mainImage = $("img.w-main-feed-card-media").first();
  if (mainImage.length) {
    imageUrl =
      mainImage.attr("src") || mainImage.attr("data-delayed-url") || "";
  }

  // Fallback: try feed-images-content
  if (!imageUrl) {
    const feedImage = $('[data-test-id="feed-images-content"] img').first();
    if (feedImage.length) {
      imageUrl =
        feedImage.attr("src") || feedImage.attr("data-delayed-url") || "";
    }
  }

  // Fallback: try any lazy-loaded image in the content area
  if (!imageUrl) {
    const lazyImage = $(
      ".main-feed-activity-card img.lazy-load, .main-feed-activity-card img.lazy-loaded"
    ).first();
    if (lazyImage.length) {
      imageUrl =
        lazyImage.attr("src") || lazyImage.attr("data-delayed-url") || "";
    }
  }

  return {
    authorName,
    authorAvatar,
    authorProfileUrl,
    content,
    relativeDate,
    imageUrl,
    likes,
    comments,
  };
}

export function truncateText(text: string, maxLength: number = 280): string {
  if (text.length <= maxLength) return text;

  // Find the last space before maxLength to avoid cutting words
  const lastSpace = text.lastIndexOf(" ", maxLength);
  const cutoff = lastSpace > 0 ? lastSpace : maxLength;

  return text.slice(0, cutoff) + "…";
}

export function formatRelativeDate(relativeDate: string): string {
  // Convert LinkedIn format (3mo, 2d, 5h) to readable format
  const match = relativeDate.match(/^(\d+)(y|mo|w|d|h|m|s)(?:\s+.*)?$/);

  if (!match) return relativeDate;

  const [, num, unit] = match;
  const value = parseInt(num, 10);

  const unitMap: Record<string, string> = {
    y: value === 1 ? "year ago" : "years ago",
    mo: value === 1 ? "month ago" : "months ago",
    w: value === 1 ? "week ago" : "weeks ago",
    d: value === 1 ? "day ago" : "days ago",
    h: value === 1 ? "hour ago" : "hours ago",
    m: value === 1 ? "minute ago" : "minutes ago",
    s: value === 1 ? "second ago" : "seconds ago",
  };

  return `${value} ${unitMap[unit] || unit}`;
}
