import axios, { AxiosError } from "axios";

export type ApiError = {
    status: number | null;
    message: string;
    details?: unknown;
};

function extractMessage(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;

    const obj = data as Record<string, unknown>;

    // common patterns
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;

    if (obj.error && typeof obj.error === "object") {
        const errObj = obj.error as Record<string, unknown>;
        if (typeof errObj.message === "string") return errObj.message;
    }

    return null;
}

export function normalizeApiError(err: unknown): ApiError {
    if (axios.isAxiosError(err)) {
        const ax = err as AxiosError<unknown>;
        const status = ax.response?.status ?? null;
        const data = ax.response?.data;

        return {
            status,
            message:
                extractMessage(data) ??
                ax.message ??
                "Request failed",
            details: data,
        };
    }

    if (err instanceof Error) {
        return { status: null, message: err.message };
    }

    return { status: null, message: "Unknown error", details: err };
}
