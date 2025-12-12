"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Subject } from "@/lib/radar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
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
                  Nombre de posts récupérés : {s.postCount}
                </div>
                <div className="text-muted-foreground">
                  Score de popularité : {s.popularityScore}/100
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
      )}
    </div>
  );
}
