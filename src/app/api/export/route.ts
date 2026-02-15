import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth";
import { getDashboardTree } from "@/lib/dashboard-data";
import { getMiniProgress, toPercent } from "@/lib/progress";

function csvEscape(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  const { user, error } = await requireApiUser();
  if (!user) return error;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";

  const tree = await getDashboardTree(user.id);

  if (format === "csv") {
    const rows: string[] = [];
    rows.push(
      [
        "armyId",
        "armyName",
        "squadId",
        "squadName",
        "miniId",
        "miniName",
        "description",
        "tags",
        "assembled",
        "primed",
        "painted",
        "based",
        "photographed",
        "miniProgressPercent",
        "assembledAt",
        "primedAt",
        "paintedAt",
        "basedAt",
        "photographedAt",
        "miniCreatedAt",
        "miniUpdatedAt",
      ].join(","),
    );

    tree.armies.forEach((army) => {
      army.squads.forEach((squad) => {
        squad.minis.forEach((mini) => {
          rows.push(
            [
              csvEscape(army.id),
              csvEscape(army.name),
              csvEscape(squad.id),
              csvEscape(squad.name),
              csvEscape(mini.id),
              csvEscape(mini.name),
              csvEscape(mini.description ?? ""),
              csvEscape((mini.tags ?? []).join("|")),
              String(mini.assembled),
              String(mini.primed),
              String(mini.painted),
              String(mini.based),
              String(mini.photographed),
              String(toPercent(getMiniProgress(mini))),
              csvEscape(mini.assembledAt ?? ""),
              csvEscape(mini.primedAt ?? ""),
              csvEscape(mini.paintedAt ?? ""),
              csvEscape(mini.basedAt ?? ""),
              csvEscape(mini.photographedAt ?? ""),
              csvEscape(mini.createdAt),
              csvEscape(mini.updatedAt),
            ].join(","),
          );
        });
      });
    });

    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="painttracker-export.csv"',
      },
    });
  }

  return NextResponse.json(tree, {
    headers: {
      "Content-Disposition": 'attachment; filename="painttracker-export.json"',
    },
  });
}
