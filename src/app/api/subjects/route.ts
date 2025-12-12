import { NextResponse } from "next/server";

import { listSubjects } from "@/lib/radar";

export async function GET() {
  return NextResponse.json({ subjects: listSubjects() });
}
