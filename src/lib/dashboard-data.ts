import { prisma } from "@/lib/prisma";
import type { DashboardTree } from "@/lib/types";

export async function getDashboardTree(userId: string): Promise<DashboardTree> {
  const armies = await prisma.army.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      squads: {
        orderBy: { createdAt: "asc" },
        include: {
          minis: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  return {
    armies: armies.map((army) => ({
      id: army.id,
      name: army.name,
      createdAt: army.createdAt.toISOString(),
      updatedAt: army.updatedAt.toISOString(),
      squads: army.squads.map((squad) => ({
        id: squad.id,
        armyId: squad.armyId,
        name: squad.name,
        createdAt: squad.createdAt.toISOString(),
        updatedAt: squad.updatedAt.toISOString(),
        minis: squad.minis.map((mini) => ({
          id: mini.id,
          squadId: mini.squadId,
          name: mini.name,
          description: mini.description,
          tags:
            Array.isArray(mini.tags) && mini.tags.every((item) => typeof item === "string")
              ? (mini.tags as string[])
              : null,
          assembled: mini.assembled,
          primed: mini.primed,
          painted: mini.painted,
          based: mini.based,
          photographed: mini.photographed,
          assembledAt: mini.assembledAt?.toISOString() ?? null,
          primedAt: mini.primedAt?.toISOString() ?? null,
          paintedAt: mini.paintedAt?.toISOString() ?? null,
          basedAt: mini.basedAt?.toISOString() ?? null,
          photographedAt: mini.photographedAt?.toISOString() ?? null,
          createdAt: mini.createdAt.toISOString(),
          updatedAt: mini.updatedAt.toISOString(),
        })),
      })),
    })),
  };
}
