export const POINT_KINDS = [
  "MODULE_COMPLETED",
  "QUIZ_PASSED",
  "QUIZ_FIRST_TRY_BONUS",
  "DILEMMA_VOTED",
] as const;

export type PointKind = (typeof POINT_KINDS)[number];

export interface PointRule {
  points: number;
  ruleVersion: number;
  label: string;
}

export const POINT_RULES: Record<PointKind, PointRule> = {
  MODULE_COMPLETED: { points: 50, ruleVersion: 1, label: "Module terminé" },
  QUIZ_PASSED: { points: 20, ruleVersion: 1, label: "Quiz réussi" },
  QUIZ_FIRST_TRY_BONUS: {
    points: 10,
    ruleVersion: 1,
    label: "Quiz réussi dès la première tentative",
  },
  DILEMMA_VOTED: { points: 5, ruleVersion: 1, label: "Participation à un dilemme" },
};

export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, label: "Curieux" },
  { level: 2, points: 100, label: "Observateur" },
  { level: 3, points: 250, label: "Analyste" },
  { level: 4, points: 500, label: "Éclaireur" },
  { level: 5, points: 1000, label: "Référent" },
] as const;

export function getPointRule(kind: PointKind): PointRule {
  return POINT_RULES[kind];
}

export function levelForPoints(totalPoints: number): number {
  const safePoints = Math.max(0, Math.floor(totalPoints));
  const fixed = [...LEVEL_THRESHOLDS].reverse().find((threshold) => safePoints >= threshold.points);
  if (fixed?.level === 5) return 5 + Math.floor((safePoints - 1000) / 750);
  return fixed?.level ?? 1;
}

export function labelForLevel(level: number): string {
  return (
    LEVEL_THRESHOLDS.find((threshold) => threshold.level === level)?.label ?? `Niveau ${level}`
  );
}

export function nextLevelThreshold(totalPoints: number): number {
  const level = levelForPoints(totalPoints);
  if (level < 5) return LEVEL_THRESHOLDS.find((threshold) => threshold.level === level + 1)!.points;
  return 1000 + (level - 4) * 750;
}
