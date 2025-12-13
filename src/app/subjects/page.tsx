"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FIELD_ORDER = [
  "AI & Data",
  "Digital Markets",
  "Privacy & Security",
  "Finance",
  "Sustainability",
  "Other",
];

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  // Group subjects by field
  const groupedSubjects = useMemo(() => {
    if (!subjects) return null;

    const groups: Record<string, Subject[]> = {};
    for (const subject of subjects) {
      if (!groups[subject.field]) {
        groups[subject.field] = [];
      }
      groups[subject.field].push(subject);
    }

    // Sort by FIELD_ORDER
    return FIELD_ORDER.filter((field) => groups[field]).map((field) => ({
      field,
      subjects: groups[field],
    }));
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
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Sujets réglementaires</h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez un sujet pour consulter les posts LinkedIn populaires.
        </p>
      </div>

      {!groupedSubjects ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Card key={j}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
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
          {groupedSubjects.map(({ field, subjects: fieldSubjects }) => (
            <section key={field} className="space-y-3">
              <h2 className="text-lg font-medium text-foreground/80 border-b pb-2">
                {field}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fieldSubjects.map((s) => (
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
                    <CardFooter>
                      <Button asChild size="sm">
                        <Link href={`/feed/${s.slug}`}>Voir le feed</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
