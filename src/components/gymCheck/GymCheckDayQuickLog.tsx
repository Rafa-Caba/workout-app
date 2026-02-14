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
        <Card>
            <CardHeader>
                <CardTitle>{lang === "es" ? "Registro rápido" : "Quick log"}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">{lang === "es" ? "Duración (min)" : "Duration (min)"}</label>
                        <input
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                            value={durationMin}
                            onChange={(e) => onChangeDuration(e.target.value)}
                            placeholder={lang === "es" ? "Ej. 75" : "e.g. 75"}
                            inputMode="decimal"
                            disabled={busy}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">{lang === "es" ? "Notas (tuyas)" : "Your notes"}</label>
                        <input
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                            value={notes}
                            onChange={(e) => onChangeNotes(e.target.value)}
                            placeholder={lang === "es" ? "Notas rápidas..." : "Quick notes..."}
                            disabled={busy}
                        />
                    </div>
                </div>

                {/* <div className="text-xs text-muted-foreground">
                    {lang === "es"
                        ? "Esto se guarda localmente (offline). Puedes presionar Guardar para persistir en la base de datos."
                        : "Saved locally (offline). Press Save to persist to the database."}
                </div> */}
            </CardContent>
        </Card>
    );
}
