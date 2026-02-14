export type WorkoutMediaResourceType = "image" | "video";
export type WeightUnit = "lb" | "kg";

/**
 * Mirrors WorkoutMediaItemSchema (WorkoutDay.model)
 * Note: schema uses { _id: false } so NO "id" here.
 */
export type WorkoutMediaItem = {
    publicId: string;
    url: string;
    resourceType: WorkoutMediaResourceType;
    format: string | null;
    createdAt: string; // ISO datetime string
    meta: unknown | null; // Schema.Types.Mixed
};

/**
 * Mirrors WorkoutExerciseSetSchema (embedded, _id: false)
 */
export type WorkoutExerciseSet = {
    setIndex: number; // min 1

    reps: number | null;
    weight: number | null;

    unit: WeightUnit;

    rpe: number | null;

    isWarmup: boolean;
    isDropSet: boolean;

    tempo: string | null;
    restSec: number | null;

    tags: string[] | null;
    meta: unknown | null; // Schema.Types.Mixed
};

/**
 * Mirrors WorkoutExerciseSchema (embedded, _id: true, mapped to "id" in toJSON)
 */
export type WorkoutExercise = {
    id: string;

    name: string;
    movementId: string | null;
    notes: string | null;

    // IMPORTANT:
    // - null means "no block"
    // - [] means explicitly empty
    sets: WorkoutExerciseSet[] | null;

    meta: unknown | null; // Schema.Types.Mixed
};

/**
 * Mirrors WorkoutSessionSchema (embedded, _id: true, mapped to "id" in toJSON)
 */
export type WorkoutSession = {
    id: string;

    type: string;

    startAt: string | null; // ISO datetime string
    endAt: string | null; // ISO datetime string

    durationSeconds: number | null;

    activeKcal: number | null;
    totalKcal: number | null;

    avgHr: number | null;
    maxHr: number | null;

    distanceKm: number | null;
    steps: number | null;
    elevationGainM: number | null;

    paceSecPerKm: number | null;
    cadenceRpm: number | null;

    effortRpe: number | null;

    notes: string | null;

    media: WorkoutMediaItem[] | null;
    exercises: WorkoutExercise[] | null;

    meta: unknown | null; // Schema.Types.Mixed (where you store sessionKey, trainingSource, etc.)
};

/**
 * Mirrors TrainingBlockSchema (_id: false)
 */
export type TrainingBlock = {
    sessions: WorkoutSession[] | null;

    source: string | null; // maxlength 120
    dayEffortRpe: number | null; // 1..10

    raw: unknown | null; // Schema.Types.Mixed
};

/**
 * Mirrors SleepBlockSchema (_id: false)
 */
export type SleepBlock = {
    timeAsleepMinutes: number | null;
    score: number | null;

    awakeMinutes: number | null;
    remMinutes: number | null;
    coreMinutes: number | null;
    deepMinutes: number | null;

    source: string | null; // maxlength 120
    raw: unknown | null; // Schema.Types.Mixed
};

/**
 * Mirrors WorkoutDaySchema (+ toJSON transform)
 */
export type WorkoutDay = {
    id: string;

    // In DB it's always there; keep optional only if some endpoints omit it.
    userId?: string;

    date: string; // YYYY-MM-DD
    weekKey: string; // e.g. 2026-W07

    sleep: SleepBlock | null;
    training: TrainingBlock | null;

    notes: string | null;
    tags: string[] | null;

    meta: unknown | null; // Schema.Types.Mixed

    createdAt?: string; // timestamps
    updatedAt?: string; // timestamps
};
