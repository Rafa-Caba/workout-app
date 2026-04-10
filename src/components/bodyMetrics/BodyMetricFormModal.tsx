// src/components/bodyMetrics/BodyMetricFormModal.tsx

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
    UpsertUserMetricRequest,
    UserMetricEntry,
} from "@/types/bodyMetrics.types";

type FormState = {
    date: string;
    weightKg: string;
    bodyFatPct: string;
    waistCm: string;
    notes: string;
};

function getTodayIsoDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseNullableNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
}

function toInitialForm(entry: UserMetricEntry | null): FormState {
    return {
        date: entry?.date ?? getTodayIsoDate(),
        weightKg:
            typeof entry?.weightKg === "number" ? String(entry.weightKg) : "",
        bodyFatPct:
            typeof entry?.bodyFatPct === "number" ? String(entry.bodyFatPct) : "",
        waistCm:
            typeof entry?.waistCm === "number" ? String(entry.waistCm) : "",
        notes: entry?.notes ?? "",
    };
}

function isMeaningfulPayload(payload: UpsertUserMetricRequest): boolean {
    return (
        payload.weightKg !== null ||
        payload.bodyFatPct !== null ||
        payload.waistCm !== null ||
        (typeof payload.notes === "string" && payload.notes.trim().length > 0)
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}

export function BodyMetricFormModal({
    open,
    initialEntry,
    saving,
    onClose,
    onSave,
}: {
    open: boolean;
    initialEntry: UserMetricEntry | null;
    saving: boolean;
    onClose: () => void;
    onSave: (args: { date: string; payload: UpsertUserMetricRequest }) => Promise<void>;
}) {
    const [form, setForm] = React.useState<FormState>(() => toInitialForm(initialEntry));

    React.useEffect(() => {
        if (!open) return;
        setForm(toInitialForm(initialEntry));
    }, [initialEntry, open]);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const payload: UpsertUserMetricRequest = {
            weightKg: parseNullableNumber(form.weightKg),
            bodyFatPct: parseNullableNumber(form.bodyFatPct),
            waistCm: parseNullableNumber(form.waistCm),
            notes: form.notes.trim().length ? form.notes.trim() : null,
            source: initialEntry?.source ?? "manual",
        };

        if (!isMeaningfulPayload(payload)) {
            return;
        }

        await onSave({
            date: form.date,
            payload,
        });
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
            <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto">
                <CardHeader>
                    <CardTitle>
                        {initialEntry ? "Editar registro corporal" : "Nuevo registro corporal"}
                    </CardTitle>
                    <CardDescription>
                        Guarda peso, cintura, grasa corporal y notas del día.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Fecha">
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    required
                                />
                            </Field>

                            <Field label="Peso (kg)">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={form.weightKg}
                                    onChange={(e) => setForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    placeholder="Ej. 78.4"
                                />
                            </Field>

                            <Field label="Grasa corporal (%)">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={form.bodyFatPct}
                                    onChange={(e) => setForm((prev) => ({ ...prev, bodyFatPct: e.target.value }))}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    placeholder="Ej. 18.2"
                                />
                            </Field>

                            <Field label="Cintura (cm)">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={form.waistCm}
                                    onChange={(e) => setForm((prev) => ({ ...prev, waistCm: e.target.value }))}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    placeholder="Ej. 84.5"
                                />
                            </Field>
                        </div>

                        <Field label="Notas">
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                className="min-h-[27.5] rounded-md border bg-background px-3 py-2 text-sm"
                                placeholder="Cómo te sentiste, contexto, observaciones..."
                            />
                        </Field>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}