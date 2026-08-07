import { NextResponse } from "next/server";
import { getCommandes } from "@/lib/notion";

export const revalidate = 60; // cache 60 secondes

export async function GET() {
  try {
    const commandes = await getCommandes();
    return NextResponse.json(commandes);
  } catch (error) {
    console.error("Erreur Notion:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des commandes" }, { status: 500 });
  }
}
