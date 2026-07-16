import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const etiquette = await prisma.etiquetteAtelier.create({ data: body });
    return NextResponse.json(etiquette, { status: 201 });
  } catch (error) {
    console.error("Erreur création étiquette:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const etiquettes = await prisma.etiquetteAtelier.findMany({
      orderBy: { creeLe: "desc" },
    });
    return NextResponse.json(etiquettes);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
