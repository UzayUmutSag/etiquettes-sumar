import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedCommandes } from "@/lib/notion";

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
    try {
      const commandes = await getCachedCommandes();
      const notionIds = new Set(commandes.map((c) => c.id));
      const filtered = etiquettes.filter((e) => notionIds.has(e.notionCommandeId));
      return NextResponse.json(filtered);
    } catch {
      // Si Notion échoue, retourner toutes les étiquettes sans filtre
      return NextResponse.json(etiquettes);
    }
  } catch (error) {
    console.error("Erreur récupération étiquettes:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
