"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Subject } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type GroupedSubjects = {
  field: string;
  subjects: Subject[];
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-emerald-500";
  if (score >= 40) return "text-yellow-500";
  if (score >= 20) return "text-orange-500";
  return "text-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Très populaire";
  if (score >= 60) return "Populaire";
  if (score >= 40) return "Modéré";
  if (score >= 20) return "Faible";
  return "Très faible";
}

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  // Group subjects by field and sort by popularity (descending)
  const groupedSubjects = useMemo<GroupedSubjects[]>(() => {
    if (!subjects) return [];

    const groups = new Map<string, Subject[]>();

    // Group by field
    for (const subject of subjects) {
      const existing = groups.get(subject.field) || [];
      existing.push(subject);
      groups.set(subject.field, existing);
    }

    // Convert to array, sort subjects within each group by popularity (descending)
    const result: GroupedSubjects[] = [];
    for (const [field, fieldSubjects] of groups) {
      result.push({
        field,
        subjects: fieldSubjects.sort(
          (a, b) => b.popularityScore - a.popularityScore
        ),
      });
    }

    // Sort groups by max popularity score (descending)
    return result.sort((a, b) => {
      const maxA = Math.max(...a.subjects.map((s) => s.popularityScore));
      const maxB = Math.max(...b.subjects.map((s) => s.popularityScore));
      return maxB - maxA;
    });
  }, [subjects]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/subjects", { cache: "no-store" });
      const data = (await res.json()) as { subjects: Subject[] };
      if (!cancelled) setSubjects(data.subjects);
    }

    load().catch(() => {
      if (!cancelled) setSubjects([]);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Sujets réglementaires</h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez un sujet pour consulter les posts LinkedIn populaires.
        </p>
      </div>

      {!subjects ? (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-44" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-28" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSubjects.map((group) => (
            <div key={group.field} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b pb-2">
                {group.field}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.subjects.map((s) => (
                  <Card
                    key={s.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/feed/${s.slug}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        router.push(`/feed/${s.slug}`);
                    }}
                    className="cursor-pointer transition-colors hover:bg-accent"
                  >
                    <CardHeader>
                      <CardTitle>{s.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div className="text-muted-foreground">
                        {s.description}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Popularité :
                        </span>
                        <span
                          className={`font-bold ${getScoreColor(
                            s.popularityScore
                          )}`}
                        >
                          {s.popularityScore}
                        </span>
                        <span
                          className={`text-xs ${getScoreColor(
                            s.popularityScore
                          )}`}
                        >
                          ({getScoreLabel(s.popularityScore)})
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild size="sm">
                        <Link href={`/feed/${s.slug}`}>Voir le feed</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
