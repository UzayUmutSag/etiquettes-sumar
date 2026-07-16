import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.etiquetteClient.create({ data: body });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Erreur sauvegarde étiquette client:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const records = await prisma.etiquetteClient.findMany({
      include: { etiquetteAtelier: true },
      orderBy: { creeLe: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
