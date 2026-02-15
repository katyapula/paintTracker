import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StageKey, toggleStageSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const stageTimestampMap: Record<StageKey, keyof Prisma.MiniUpdateInput> = {
  assembled: "assembledAt",
  primed: "primedAt",
  painted: "paintedAt",
  based: "basedAt",
  photographed: "photographedAt",
};

export async function POST(request: Request, { params }: Params) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const { id } = await params;
  const parsed = toggleStageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mini = await prisma.mini.findFirst({ where: { id, userId: user.id } });
  if (!mini) {
    return NextResponse.json({ error: "Mini not found" }, { status: 404 });
  }

  const { stage, value } = parsed.data;
  const timestampField = stageTimestampMap[stage];

  const data: Prisma.MiniUpdateInput = {
    [stage]: value,
    [timestampField]: value ? new Date() : null,
  };

  const updated = await prisma.mini.update({
    where: { id },
    data,
  });

  return NextResponse.json({ mini: updated });
}
