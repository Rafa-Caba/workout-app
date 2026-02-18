import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
    lang: "es" | "en";
    busy: boolean;
    durationMin: string;
    notes: string;

    onChangeDuration: (v: string) => void;
    onChangeNotes: (v: string) => void;
};

export function GymCheckDayQuickLog(props: Props) {
    const { lang, busy, durationMin, notes, onChangeDuration, onChangeNotes } = props;

    return (
        <Card className="w-full min-w-0">
            <CardHeader className="min-w-0">
                <CardTitle className="min-w-0 wrap-break-words">
                    {lang === "es" ? "Registro rápido" : "Quick log"}
                </CardTitle>
            </CardHeader>

            <CardContent className="min-w-0 space-y-3">
                <div className="min-w-0 grid gap-3 grid-cols-1 md:grid-cols-2">
                    <div className="min-w-0 space-y-1">
                        <label className="text-sm font-medium">
                            {lang === "es" ? "Duración (min)" : "Duration (min)"}
                        </label>
                        <input
                            className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-base sm:text-sm outline-none focus:ring-2"
                            value={durationMin}
                            onChange={(e) => onChangeDuration(e.target.value)}
                            placeholder={lang === "es" ? "Ej. 75" : "e.g. 75"}
                            inputMode="decimal"
                            disabled={busy}
                        />
                    </div>

                    <div className="min-w-0 space-y-1">
                        <label className="text-sm font-medium">{lang === "es" ? "Notas (tuyas)" : "Your notes"}</label>
                        <input
                            className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-base sm:text-sm outline-none focus:ring-2"
                            value={notes}
                            onChange={(e) => onChangeNotes(e.target.value)}
                            placeholder={lang === "es" ? "Notas rápidas..." : "Quick notes..."}
                            disabled={busy}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
