const stageKeys = ["assembled", "primed", "painted", "based", "photographed"] as const;

type StageValue = Record<(typeof stageKeys)[number], boolean>;

export function getMiniProgress(mini: StageValue) {
  const completed = stageKeys.reduce(
    (count, stage) => count + (mini[stage] ? 1 : 0),
    0,
  );

  return completed / stageKeys.length;
}

export function getMiniDoneCount<T extends StageValue>(minis: T[]) {
  return minis.reduce((count, mini) => (getMiniProgress(mini) === 1 ? count + 1 : count), 0);
}

export function toPercent(progress: number) {
  return Math.round(progress * 100);
}
