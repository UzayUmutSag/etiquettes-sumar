import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const etiquette = await prisma.etiquetteAtelier.update({
      where: { id },
      data: {
        nbImpressions: { increment: 1 },
        derniereImpression: new Date(),
      },
    });
    return NextResponse.json(etiquette);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
