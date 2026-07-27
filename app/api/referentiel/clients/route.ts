import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommandes } from "@/lib/notion";

export async function GET() {
  try {
    const commandes = await getCommandes();
    const noms = [...new Set(commandes.map((c) => c.client).filter(Boolean))];
    await Promise.all(
      noms.map((nom) =>
        prisma.clientLogo.upsert({
          where: { nomClient: nom },
          update: {},
          create: { nomClient: nom },
        })
      )
    );
  } catch {
    // Notion indisponible, on continue avec les données existantes
  }

  const clients = await prisma.clientLogo.findMany({ orderBy: { nomClient: "asc" } });
  return NextResponse.json(clients);
}
