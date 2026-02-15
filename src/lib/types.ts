export type MiniNode = {
  id: string;
  squadId: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  assembled: boolean;
  primed: boolean;
  painted: boolean;
  based: boolean;
  photographed: boolean;
  assembledAt: string | null;
  primedAt: string | null;
  paintedAt: string | null;
  basedAt: string | null;
  photographedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SquadNode = {
  id: string;
  armyId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  minis: MiniNode[];
};

export type ArmyNode = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  squads: SquadNode[];
};

export type DashboardTree = {
  armies: ArmyNode[];
};
