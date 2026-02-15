CREATE TABLE "armies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "armies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "squads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "army_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "squads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "squads_army_id_fkey" FOREIGN KEY ("army_id") REFERENCES "armies" ("id") ON DELETE CASCADE
);

CREATE TABLE "minis" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "squad_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "tags" JSONB,
  "assembled" BOOLEAN NOT NULL DEFAULT FALSE,
  "primed" BOOLEAN NOT NULL DEFAULT FALSE,
  "painted" BOOLEAN NOT NULL DEFAULT FALSE,
  "based" BOOLEAN NOT NULL DEFAULT FALSE,
  "photographed" BOOLEAN NOT NULL DEFAULT FALSE,
  "assembled_at" TIMESTAMPTZ,
  "primed_at" TIMESTAMPTZ,
  "painted_at" TIMESTAMPTZ,
  "based_at" TIMESTAMPTZ,
  "photographed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "minis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "minis_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "squads" ("id") ON DELETE CASCADE
);

CREATE INDEX "armies_user_id_idx" ON "armies" ("user_id");
CREATE INDEX "squads_user_id_idx" ON "squads" ("user_id");
CREATE INDEX "squads_army_id_idx" ON "squads" ("army_id");
CREATE INDEX "minis_user_id_idx" ON "minis" ("user_id");
CREATE INDEX "minis_squad_id_idx" ON "minis" ("squad_id");
