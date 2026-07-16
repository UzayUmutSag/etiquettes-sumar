import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const marques = await prisma.marque.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(marques);
}

export async function POST(req: NextRequest) {
  try {
    const { nom } = await req.json();
    if (!nom?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const marque = await prisma.marque.upsert({
      where: { nom: nom.trim().toUpperCase() },
      update: {},
      create: { nom: nom.trim().toUpperCase() },
    });
    return NextResponse.json(marque);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
