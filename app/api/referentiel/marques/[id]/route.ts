import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { nom } = await req.json();
    if (!nom?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const marque = await prisma.marque.update({
      where: { id },
      data: { nom: nom.trim().toUpperCase() },
    });
    return NextResponse.json(marque);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.marque.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
