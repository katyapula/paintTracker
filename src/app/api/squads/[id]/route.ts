import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSquadSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const { id } = await params;
  const parsed = updateSquadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const squad = await prisma.squad.findFirst({
    where: { id, userId: user.id },
  });

  if (!squad) {
    return NextResponse.json({ error: "Squad not found" }, { status: 404 });
  }

  if (parsed.data.armyId) {
    const army = await prisma.army.findFirst({
      where: { id: parsed.data.armyId, userId: user.id },
    });

    if (!army) {
      return NextResponse.json({ error: "Target army not found" }, { status: 404 });
    }
  }

  const updated = await prisma.squad.update({
    where: { id },
    data: {
      name: parsed.data.name,
      ...(parsed.data.armyId ? { armyId: parsed.data.armyId } : {}),
    },
  });

  return NextResponse.json({ squad: updated });
}

export async function DELETE(_: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const { id } = await params;
  const squad = await prisma.squad.findFirst({ where: { id, userId: user.id } });

  if (!squad) {
    return NextResponse.json({ error: "Squad not found" }, { status: 404 });
  }

  await prisma.squad.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
