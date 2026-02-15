import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createArmySchema } from "@/lib/validation";

export async function GET() {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const armies = await prisma.army.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ armies });
}

export async function POST(request: Request) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const parsed = createArmySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const army = await prisma.army.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
    },
  });

  return NextResponse.json({ army }, { status: 201 });
}
