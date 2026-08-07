import { NextResponse } from "next/server";
import { getCachedCommandes } from "@/lib/notion";

export async function GET() {
  try {
    const commandes = await getCachedCommandes();
    return NextResponse.json(commandes);
  } catch (error) {
    console.error("Erreur Notion:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des commandes" }, { status: 500 });
  }
}
