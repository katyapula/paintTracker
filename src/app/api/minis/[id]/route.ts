import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeNullableTags,
  normalizeNullableText,
  updateMiniSchema,
} from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const { id } = await params;
  const parsed = updateMiniSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mini = await prisma.mini.findFirst({ where: { id, userId: user.id } });
  if (!mini) {
    return NextResponse.json({ error: "Mini not found" }, { status: 404 });
  }

  if (parsed.data.squadId) {
    const squad = await prisma.squad.findFirst({
      where: { id: parsed.data.squadId, userId: user.id },
    });

    if (!squad) {
      return NextResponse.json({ error: "Target squad not found" }, { status: 404 });
    }
  }

  const normalizedTags = normalizeNullableTags(parsed.data.tags);

  const updated = await prisma.mini.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: normalizeNullableText(parsed.data.description),
      tags: normalizedTags
        ? (normalizedTags as Prisma.InputJsonValue)
        : Prisma.DbNull,
      ...(parsed.data.squadId ? { squadId: parsed.data.squadId } : {}),
    },
  });

  return NextResponse.json({ mini: updated });
}

export async function DELETE(_: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const { id } = await params;
  const mini = await prisma.mini.findFirst({ where: { id, userId: user.id } });

  if (!mini) {
    return NextResponse.json({ error: "Mini not found" }, { status: 404 });
  }

  await prisma.mini.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
