export type WorkoutRoutineSplit = string;

/**
 * Cloudinary-backed attachment returned by backend for routine week attachments.
 * Keep this flexible, because older data may omit some fields.
 */
export type WorkoutRoutineAttachment = {
    publicId: string;
    url: string;
    resourceType?: "image" | "video" | string;
    format?: string | null;
    createdAt?: string; // ISO string (if backend provides)
    meta?: any | null;
};

export type WorkoutRoutineWeekRange = {
    from: string; // yyyy-mm-dd
    to: string; // yyyy-mm-dd
};

export type WorkoutRoutineWeek = {
    _id?: string;
    id?: string;

    userId?: string;
    weekKey: string; // e.g. 2026-W06
    range?: WorkoutRoutineWeekRange;

    status?: "active" | "archived" | string;

    title?: string;
    split?: WorkoutRoutineSplit;
    plannedDays?: string[]; // ["Mon","Tue",...]

    // Week-level media/attachments
    attachments?: WorkoutRoutineAttachment[];

    /**
     * meta.plan is your local editable plan model
     * (the big nested object you edit in Form mode).
     */
    meta?: {
        plan?: any;
        [k: string]: any;
    };

    // Some backends also include a derived/normalized days array for Plan vs Real.
    days?: any[];

    [k: string]: any;
};
