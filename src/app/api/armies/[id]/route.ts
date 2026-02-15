import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateArmySchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const { id } = await params;
  const parsed = updateArmySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.army.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Army not found" }, { status: 404 });
  }

  const army = await prisma.army.update({
    where: { id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ army });
}

export async function DELETE(_: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const { id } = await params;
  const existing = await prisma.army.findFirst({ where: { id, userId: user.id } });

  if (!existing) {
    return NextResponse.json({ error: "Army not found" }, { status: 404 });
  }

  await prisma.army.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
