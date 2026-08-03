import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommandes } from "@/lib/notion";

export async function GET() {
  try {
    const commandes = await getCommandes();

    // Dédoublonnage : un client Notion = un notionClientId + un nom
    const clientMap = new Map<string, string>(); // notionClientId -> nomClient
    for (const commande of commandes) {
      for (const nc of commande.notionClients) {
        clientMap.set(nc.id, nc.nom);
      }
    }

    for (const [notionClientId, nomClient] of clientMap.entries()) {
      // 1. Chercher par ID Notion (stable même si le nom change)
      const byId = await prisma.clientLogo.findUnique({ where: { notionClientId } });
      if (byId) {
        if (byId.nomClient !== nomClient) {
          // Le nom a changé dans Notion → on met à jour
          await prisma.clientLogo.update({
            where: { notionClientId },
            data: { nomClient },
          });
        }
        continue;
      }

      // 2. Fallback : chercher par nom (migration des entrées sans notionClientId)
      const byName = await prisma.clientLogo.findUnique({ where: { nomClient } });
      if (byName) {
        // On lui ajoute l'ID Notion pour les prochaines fois
        await prisma.clientLogo.update({
          where: { nomClient },
          data: { notionClientId },
        });
        continue;
      }

      // 3. Nouveau client
      await prisma.clientLogo.create({ data: { notionClientId, nomClient } });
    }

    // Supprime les entrées orphelines (pas encore associées à un ID Notion)
    await prisma.clientLogo.deleteMany({ where: { notionClientId: null } });
  } catch {
    // Notion indisponible, on continue avec les données existantes
  }

  const clients = await prisma.clientLogo.findMany({ orderBy: { nomClient: "asc" } });
  return NextResponse.json(clients);
}
