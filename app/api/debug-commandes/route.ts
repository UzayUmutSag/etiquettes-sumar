import { NextResponse } from "next/server";
import { getCommandes } from "@/lib/notion";

export async function GET() {
  try {
    const commandes = await getCommandes();
    return NextResponse.json({
      count: commandes.length,
      ids: commandes.map((c) => ({ id: c.id, num: c.numeroCommande })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
