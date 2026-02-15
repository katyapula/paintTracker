import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSquadSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const url = new URL(request.url);
  const armyId = url.searchParams.get("armyId");

  const squads = await prisma.squad.findMany({
    where: {
      userId: user.id,
      ...(armyId ? { armyId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ squads });
}

export async function POST(request: Request) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const parsed = createSquadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const army = await prisma.army.findFirst({
    where: { id: parsed.data.armyId, userId: user.id },
  });

  if (!army) {
    return NextResponse.json({ error: "Army not found" }, { status: 404 });
  }

  const squad = await prisma.squad.create({
    data: {
      userId: user.id,
      armyId: parsed.data.armyId,
      name: parsed.data.name,
    },
  });

  return NextResponse.json({ squad }, { status: 201 });
}
