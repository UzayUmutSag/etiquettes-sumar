import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const marqueId = req.nextUrl.searchParams.get("marqueId");
  const modeles = await prisma.modele.findMany({
    where: marqueId ? { marqueId } : undefined,
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(modeles);
}

export async function POST(req: NextRequest) {
  try {
    const { nom, marqueId } = await req.json();
    if (!nom?.trim() || !marqueId) return NextResponse.json({ error: "Nom et marqueId requis" }, { status: 400 });
    const modele = await prisma.modele.upsert({
      where: { nom_marqueId: { nom: nom.trim().toUpperCase(), marqueId } },
      update: {},
      create: { nom: nom.trim().toUpperCase(), marqueId },
    });
    return NextResponse.json(modele);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
