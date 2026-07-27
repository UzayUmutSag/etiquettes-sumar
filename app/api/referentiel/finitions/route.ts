import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const typeId = req.nextUrl.searchParams.get("typeId");
  const finitions = await prisma.finitionProduit.findMany({
    where: typeId ? { typeId } : undefined,
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(finitions);
}

export async function POST(req: NextRequest) {
  try {
    const { nom, typeId } = await req.json();
    if (!nom?.trim() || !typeId) return NextResponse.json({ error: "Nom et typeId requis" }, { status: 400 });
    const finition = await prisma.finitionProduit.upsert({
      where: { nom_typeId: { nom: nom.trim().toUpperCase(), typeId } },
      update: {},
      create: { nom: nom.trim().toUpperCase(), typeId },
    });
    return NextResponse.json(finition);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
