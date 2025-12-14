import { NextResponse } from "next/server";

import { listSubjectsWithPopularity } from "@/lib/radar";

export async function GET() {
  const subjects = await listSubjectsWithPopularity();
  return NextResponse.json({ subjects });
}
