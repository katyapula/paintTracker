import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMiniSchema,
  normalizeNullableTags,
  normalizeNullableText,
} from "@/lib/validation";

export async function GET(request: Request) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const url = new URL(request.url);
  const squadId = url.searchParams.get("squadId");

  const minis = await prisma.mini.findMany({
    where: {
      userId: user.id,
      ...(squadId ? { squadId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ minis });
}

export async function POST(request: Request) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const parsed = createMiniSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const squad = await prisma.squad.findFirst({
    where: { id: parsed.data.squadId, userId: user.id },
  });

  if (!squad) {
    return NextResponse.json({ error: "Squad not found" }, { status: 404 });
  }

  const normalizedTags = normalizeNullableTags(parsed.data.tags);

  const mini = await prisma.mini.create({
    data: {
      userId: user.id,
      squadId: parsed.data.squadId,
      name: parsed.data.name,
      description: normalizeNullableText(parsed.data.description),
      tags: normalizedTags
        ? (normalizedTags as Prisma.InputJsonValue)
        : Prisma.DbNull,
    },
  });

  return NextResponse.json({ mini }, { status: 201 });
}
