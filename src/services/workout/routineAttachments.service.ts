import { api } from "@/api/axios";

export async function uploadRoutineAttachments(
    weekKey: string,
    files: File[],
    query?: Record<string, string | number | boolean | undefined | null>
): Promise<unknown> {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    form.append("query", JSON.stringify(query ?? {}));

    const res = await api.post(`/workout/routines/weeks/${encodeURIComponent(weekKey)}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data as unknown;
}

export async function deleteRoutineAttachment(
    weekKey: string,
    args: { publicId: string; deleteCloudinary?: boolean }
): Promise<unknown> {
    const res = await api.delete(`/workout/routines/weeks/${encodeURIComponent(weekKey)}/attachments`, {
        params: {
            publicId: args.publicId,
            deleteCloudinary: args.deleteCloudinary ?? true,
        },
    });

    return res.data as unknown;
}
