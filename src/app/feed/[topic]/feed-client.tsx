"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { LinkedInPost } from "@/lib/radar";
import { getInitials, getTopicName } from "@/lib/radar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function MetricsRow({ post }: { post: LinkedInPost }) {
  const m = post.metrics;
  if (!m) return null;

  const parts: string[] = [];
  if (typeof m.likes === "number") parts.push(`${m.likes} likes`);
  if (typeof m.comments === "number") parts.push(`${m.comments} comments`);
  if (parts.length === 0) return null;

  return (
    <div className="text-xs text-muted-foreground">{parts.join(" · ")}</div>
  );
}

export default function FeedClient({ topic }: { topic: string }) {
  const [items, setItems] = useState<LinkedInPost[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const topicName = useMemo(() => getTopicName(topic) ?? topic, [topic]);

  async function loadFirstPage() {
    setLoading(true);
    setItems([]);
    setNextCursor(0);
    try {
      const res = await fetch(`/api/feed/${encodeURIComponent(topic)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        items: LinkedInPost[];
        nextCursor: number | null;
      };
      setItems(data.items);
      setNextCursor(data.nextCursor);
    } catch {
      setItems([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore) return;
    if (nextCursor == null) return;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/feed/${encodeURIComponent(topic)}?cursor=${nextCursor}&limit=15`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as {
        items: LinkedInPost[];
        nextCursor: number | null;
      };
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch {
      setNextCursor(null);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (nextCursor == null) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { root: null, rootMargin: "600px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, topic]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{topicName}</h1>
          <p className="text-sm text-muted-foreground">
            Flux LinkedIn populaire associé au sujet.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/subjects">Retour</Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucun post LinkedIn récent pour ce sujet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Card
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                window.open(p.url, "_blank", "noopener,noreferrer")
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  window.open(p.url, "_blank", "noopener,noreferrer");
                }
              }}
              className="cursor-pointer transition-colors hover:bg-accent"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={p.author.avatarUrl}
                      alt={p.author.fullName}
                    />
                    <AvatarFallback>
                      {getInitials(p.author.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {p.author.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.relativeDate}
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    Ouvrir
                  </a>
                </Button>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="whitespace-pre-wrap text-sm text-foreground/90 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:5] [-webkit-box-orient:vertical]">
                  {p.text}
                </div>
                <MetricsRow post={p} />
              </CardContent>
            </Card>
          ))}

          {loadingMore ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
              </CardContent>
            </Card>
          ) : null}

          <div ref={sentinelRef} />
        </div>
      )}
    </div>
  );
}
