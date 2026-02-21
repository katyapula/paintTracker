"use client";

import {FormEvent, ReactElement, useEffect, useMemo, useState, useTransition} from "react";
import { useRouter } from "next/navigation";

import { getMiniDoneCount, getMiniProgress, toPercent } from "@/lib/progress";
import type { ArmyNode, DashboardTree, MiniNode, SquadNode } from "@/lib/types";
import { BsFiletypeCsv, BsFiletypeJson } from "react-icons/bs";
import {GrEdit} from "react-icons/gr";
import {RiDeleteBinLine} from "react-icons/ri";
import {VscSignOut} from "react-icons/vsc";
import {GoPlus} from "react-icons/go";
import {FaPaintBrush, FaSprayCan, FaTools} from "react-icons/fa";
import {MdPhotoCamera} from "react-icons/md";
import {PiCactusFill} from "react-icons/pi";
import {SiPivotaltracker} from "react-icons/si";

type ArmyFormState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
};

type SquadFormState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  armyId: string;
};

type MiniFormState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  squadId: string;
  description: string;
  tagsText: string;
};

type DeleteState = {
  type: "army" | "squad" | "mini";
  id: string;
  name: string;
};

type StageKey = "assembled" | "primed" | "painted" | "based" | "photographed";

const stageConfig: Array<{ key: StageKey; shortLabel: string; icon: ReactElement }> = [
  { key: "assembled", shortLabel: "Asm", icon: <FaTools /> },
  { key: "primed", shortLabel: "Prm", icon: <FaSprayCan /> },
  { key: "painted", shortLabel: "Pnt", icon: <FaPaintBrush /> },
  { key: "based", shortLabel: "Bas", icon: <PiCactusFill /> },
  { key: "photographed", shortLabel: "Pho", icon: <MdPhotoCamera /> },
];

const stageTimestampKeyMap: Record<StageKey, keyof MiniNode> = {
  assembled: "assembledAt",
  primed: "primedAt",
  painted: "paintedAt",
  based: "basedAt",
  photographed: "photographedAt",
};

function toTagArray(tagsText: string) {
  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return tags.length > 0 ? tags : null;
}

async function sendJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: unknown };
    throw new Error(typeof body.error === "string" ? body.error : "Request failed");
  }

  return response;
}

function getArmyStats(army: ArmyNode) {
  const minis = army.squads.flatMap((squad) => squad.minis);
  const total = minis.length;
  const done = getMiniDoneCount(minis);
  const progress = total === 0 ? 0 : minis.reduce((sum, mini) => sum + getMiniProgress(mini), 0) / total;

  return { total, done, progress };
}

function getSquadStats(squad: SquadNode) {
  const total = squad.minis.length;
  const done = getMiniDoneCount(squad.minis);
  const progress =
    total === 0 ? 0 : squad.minis.reduce((sum, mini) => sum + getMiniProgress(mini), 0) / total;

  return { total, done, progress };
}

function formatPercent(value: number) {
  return `${toPercent(value)}%`;
}

export function DashboardClient({ initialTree }: { initialTree: DashboardTree }) {
  const router = useRouter();

  const [tree, setTree] = useState(initialTree);
  const [armyForm, setArmyForm] = useState<ArmyFormState | null>(null);
  const [squadForm, setSquadForm] = useState<SquadFormState | null>(null);
  const [miniForm, setMiniForm] = useState<MiniFormState | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTree(initialTree);
  }, [initialTree]);

  const allMinis = useMemo(
    () => tree.armies.flatMap((army) => army.squads.flatMap((squad) => squad.minis)),
    [tree],
  );

  const overallDone = getMiniDoneCount(allMinis);
  const overallTotal = allMinis.length;
  const overallProgress =
    overallTotal === 0 ? 0 : allMinis.reduce((sum, mini) => sum + getMiniProgress(mini), 0) / overallTotal;

  const squadsForSelect = useMemo(
    () =>
      tree.armies.flatMap((army) =>
        army.squads.map((squad) => ({
          id: squad.id,
          label: `${army.name} / ${squad.name}`,
          armyId: army.id,
        })),
      ),
    [tree],
  );

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleArmySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!armyForm) return;

    setErrorMessage(null);

    try {
      if (armyForm.mode === "create") {
        await sendJson("/api/armies", {
          method: "POST",
          body: JSON.stringify({ name: armyForm.name }),
        });
      } else {
        await sendJson(`/api/armies/${armyForm.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: armyForm.name }),
        });
      }

      setArmyForm(null);
      handleRefresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Army save failed");
    }
  };

  const handleSquadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!squadForm) return;

    setErrorMessage(null);

    try {
      if (squadForm.mode === "create") {
        await sendJson("/api/squads", {
          method: "POST",
          body: JSON.stringify({ name: squadForm.name, armyId: squadForm.armyId }),
        });
      } else {
        await sendJson(`/api/squads/${squadForm.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: squadForm.name, armyId: squadForm.armyId }),
        });
      }

      setSquadForm(null);
      handleRefresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Squad save failed");
    }
  };

  const handleMiniSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!miniForm) return;

    setErrorMessage(null);

    const payload = {
      name: miniForm.name,
      squadId: miniForm.squadId,
      description: miniForm.description.trim().length > 0 ? miniForm.description : null,
      tags: toTagArray(miniForm.tagsText),
    };

    try {
      if (miniForm.mode === "create") {
        await sendJson("/api/minis", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await sendJson(`/api/minis/${miniForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      setMiniForm(null);
      handleRefresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Mini save failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteState) return;
    setErrorMessage(null);

    const base =
      deleteState.type === "army"
        ? "/api/armies"
        : deleteState.type === "squad"
          ? "/api/squads"
          : "/api/minis";

    try {
      await sendJson(`${base}/${deleteState.id}`, { method: "DELETE" });
      setDeleteState(null);
      handleRefresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const toggleStage = async (miniId: string, stage: StageKey, value: boolean) => {
    const stageOrder = stageConfig.map((s) => s.key);
    const stageIndex = stageOrder.indexOf(stage);

    // Which stages should change, based on the new value?
    // - turning ON => stage + all previous
    // - turning OFF => stage + all next
    const affectedStages = value
      ? stageOrder.slice(0, stageIndex + 1)
      : stageOrder.slice(stageIndex);

    const toggleKeys = affectedStages.map((s) => `${miniId}:${s}`);

    // prevent re-entry if any affected toggle is already pending
    if (toggleKeys.some((k) => pendingToggles[k])) return;

    setErrorMessage(null);

    // mark all affected toggles as pending
    setPendingToggles((prev) => {
      const copy = { ...prev };
      for (const k of toggleKeys) copy[k] = true;
      return copy;
    });

    const prevTree = structuredClone(tree);
    const nowIso = new Date().toISOString();

    // optimistic update
    setTree((prev) => ({
      armies: prev.armies.map((army) => ({
        ...army,
        squads: army.squads.map((squad) => ({
          ...squad,
          minis: squad.minis.map((mini) => {
            if (mini.id !== miniId) return mini;

            // Apply changes stage-by-stage so we can decide what to do with timestamps.
            let nextMini: typeof mini = { ...mini };

            for (const s of affectedStages) {
              const tsKey = stageTimestampKeyMap[s];
              const nextValue = value; // all affected stages get the same target value (true or false)

              // if turning ON and it was already ON -> keep existing timestamp
              // if turning ON and it was OFF -> set timestamp to now
              // if turning OFF -> null out timestamp
              const wasOn = Boolean(nextMini[s]);

              nextMini = {
                ...nextMini,
                [s]: nextValue,
                [tsKey]: nextValue ? (wasOn ? nextMini[tsKey] : nowIso) : null,
              };
            }

            return nextMini;
          }),
        })),
      })),
    }));

    try {
      // Update server for each affected stage.
      // If you later add a "bulk toggle" endpoint, you can replace this with a single request.
      for (const s of affectedStages) {
        await sendJson(`/api/minis/${miniId}/toggle-stage`, {
          method: "POST",
          body: JSON.stringify({ stage: s, value }),
        });
      }

      handleRefresh();
    } catch (error) {
      // rollback optimistic update
      setTree(prevTree);
      setErrorMessage(error instanceof Error ? error.message : "Stage update failed");

      // refresh anyway to ensure UI matches server if some requests succeeded
      handleRefresh();
    } finally {
      // clear pending flags for all affected toggles
      setPendingToggles((prev) => {
        const copy = { ...prev };
        for (const k of toggleKeys) delete copy[k];
        return copy;
      });
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="sticky-header">
        <div>
          <h1><SiPivotaltracker />Paint Tracker</h1>
          <p>
            {overallDone}/{overallTotal} minis fully done • {formatPercent(overallProgress)} overall
          </p>
        </div>
        <div className="row-actions">
          <button type="button" onClick={() => setArmyForm({ mode: "create", name: "" })}>
            <GoPlus />
            Add Army
          </button>
        </div>
      </header>

      {errorMessage && <p className="error-banner">{errorMessage}</p>}

      <main className="dashboard-main">
        {tree.armies.length === 0 ? (
          <section className="empty-state">
            <p>No armies yet.</p>
            <button type="button" onClick={() => setArmyForm({ mode: "create", name: "" })}>
              Create your first army
            </button>
          </section>
        ) : (
          tree.armies.map((army) => {
            const armyStats = getArmyStats(army);

            return (
              <details key={army.id} open className="army-card">
                <summary className='space-between'>
                  <div>
                    <strong>{army.name}</strong>
                    <p>
                      {armyStats.done}/{armyStats.total} done • {formatPercent(armyStats.progress)}
                    </p>
                  </div>
                  <div className='item-actions'>
                    <button
                      type="button"
                      onClick={() => setArmyForm({ mode: "edit", id: army.id, name: army.name })}
                    >
                      <GrEdit />
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => setDeleteState({ type: "army", id: army.id, name: army.name })}
                    >
                      <RiDeleteBinLine />
                    </button>
                  </div>
                </summary>

                <div className="row-actions">
                  <button
                    type="button"
                    onClick={() => setSquadForm({ mode: "create", name: "", armyId: army.id })}
                  >
                    <GoPlus />
                    Add Squad
                  </button>
                </div>

                <div className="squad-list">
                  {army.squads.map((squad) => {
                    const squadStats = getSquadStats(squad);

                    return (
                      <details key={squad.id} open className="squad-card">
                        <summary className='space-between'>
                          <div>
                            <strong>{squad.name}</strong>
                            <p>
                              {squadStats.done}/{squadStats.total} done • {formatPercent(squadStats.progress)}
                            </p>
                          </div>
                          <div className='item-actions'>
                            <button
                              type="button"
                              onClick={() =>
                                setSquadForm({
                                  mode: "edit",
                                  id: squad.id,
                                  name: squad.name,
                                  armyId: squad.armyId,
                                })
                              }
                            >
                              <GrEdit />
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                setDeleteState({ type: "squad", id: squad.id, name: squad.name })
                              }
                            >
                              <RiDeleteBinLine />
                            </button>
                          </div>
                        </summary>

                        <div className="row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setMiniForm({
                                mode: "create",
                                name: "",
                                squadId: squad.id,
                                description: "",
                                tagsText: "",
                              })
                            }
                          >
                            <GoPlus />
                            Add Mini
                          </button>
                        </div>

                        <div className="mini-list">
                          {squad.minis.map((mini) => {
                            const miniProgress = getMiniProgress(mini);

                            return (
                              <article key={mini.id} className="mini-row">
                                <div className='space-between'>
                                  <div>
                                    <strong>{mini.name}</strong>
                                    <p>{formatPercent(miniProgress)}</p>
                                  </div>
                                  <div className='item-actions'>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMiniForm({
                                          mode: "edit",
                                          id: mini.id,
                                          name: mini.name,
                                          squadId: mini.squadId,
                                          description: mini.description ?? "",
                                          tagsText: (mini.tags ?? []).join(", "),
                                        })
                                      }
                                    >
                                      <GrEdit />
                                    </button>
                                    <button
                                      type="button"
                                      className="danger"
                                      onClick={() =>
                                        setDeleteState({ type: "mini", id: mini.id, name: mini.name })
                                      }
                                    >
                                      <RiDeleteBinLine />
                                    </button>
                                  </div>
                                </div>

                                {mini.tags && mini.tags.length > 0 && (
                                  <p className="meta">{mini.tags.join(' • ')}</p>
                                )}
                                {mini.description && (
                                  <p className="meta">{mini.description}</p>
                                )}

                                <div className="toggle-grid">
                                  {stageConfig.map((stage) => {
                                    const pending = pendingToggles[`${mini.id}:${stage.key}`];
                                    const currentValue = mini[stage.key];

                                    return (
                                      <button
                                        key={stage.key}
                                        type="button"
                                        className={currentValue ? "toggle on" : "toggle"}
                                        onClick={() =>
                                          void toggleStage(mini.id, stage.key, !mini[stage.key])
                                        }
                                        disabled={pending || isPending}
                                      >
                                        {stage.icon}
                                        &nbsp;
                                        {stage.shortLabel}
                                      </button>
                                    );
                                  })}
                                </div>
                              </article>
                            );
                          })}
                          {squad.minis.length === 0 && <p className="meta">No minis in this squad.</p>}
                        </div>
                      </details>
                    );
                  })}
                  {army.squads.length === 0 && <p className="meta">No squads in this army.</p>}
                </div>
              </details>
            );
          })
        )}
      </main>

      {armyForm && (
        <div className="modal-overlay" onClick={() => setArmyForm(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>{armyForm.mode === "create" ? "Create Army" : "Edit Army"}</h2>
            <form onSubmit={handleArmySubmit} className="modal-form">
              <label>
                Name
                <input
                  value={armyForm.name}
                  onChange={(event) =>
                    setArmyForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                  maxLength={120}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setArmyForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {squadForm && (
        <div className="modal-overlay" onClick={() => setSquadForm(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>{squadForm.mode === "create" ? "Create Squad" : "Edit Squad"}</h2>
            <form onSubmit={handleSquadSubmit} className="modal-form">
              <label>
                Name
                <input
                  value={squadForm.name}
                  onChange={(event) =>
                    setSquadForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                  maxLength={120}
                  required
                />
              </label>
              <label>
                Army
                <select
                  value={squadForm.armyId}
                  onChange={(event) =>
                    setSquadForm((prev) => (prev ? { ...prev, armyId: event.target.value } : prev))
                  }
                  required
                >
                  {tree.armies.map((army) => (
                    <option key={army.id} value={army.id}>
                      {army.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setSquadForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {miniForm && (
        <div className="modal-overlay" onClick={() => setMiniForm(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>{miniForm.mode === "create" ? "Create Mini" : "Edit Mini"}</h2>
            <form onSubmit={handleMiniSubmit} className="modal-form">
              <label>
                Name
                <input
                  value={miniForm.name}
                  onChange={(event) =>
                    setMiniForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                  maxLength={120}
                  required
                />
              </label>
              <label>
                Squad
                <select
                  value={miniForm.squadId}
                  onChange={(event) =>
                    setMiniForm((prev) => (prev ? { ...prev, squadId: event.target.value } : prev))
                  }
                  required
                >
                  {squadsForSelect.map((squad) => (
                    <option key={squad.id} value={squad.id}>
                      {squad.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Description (optional)
                <textarea
                  value={miniForm.description}
                  onChange={(event) =>
                    setMiniForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                  }
                  rows={4}
                />
              </label>
              <label>
                Tags (optional, comma-separated)
                <input
                  value={miniForm.tagsText}
                  onChange={(event) =>
                    setMiniForm((prev) => (prev ? { ...prev, tagsText: event.target.value } : prev))
                  }
                  placeholder="character, elite, hero"
                />
              </label>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setMiniForm(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteState && (
        <div className="modal-overlay" onClick={() => setDeleteState(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>Confirm Delete</h2>
            <p>
              Delete {deleteState.type} <strong>{deleteState.name}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="danger" onClick={() => void handleDelete()}>
                Delete
              </button>
              <button type="button" onClick={() => setDeleteState(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className='space-between'>
        <div className='flex-start'>
          <a href="/api/export?format=json"><BsFiletypeJson size={23} /></a>
          <a href="/api/export?format=csv"><BsFiletypeCsv size={23} /></a>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className='button-unstyled' type="submit"><VscSignOut size={25} /></button>
        </form>
      </div>
    </div>
  );
}
