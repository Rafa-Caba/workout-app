import React from "react";
import { Button } from "@/components/ui/button";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Props = {
    mode: "form" | "json";
    busy: boolean;
    t: TFn;
    onModeChange: (mode: "form" | "json") => void;
};

export function RoutinesModeToggle({ mode, busy, t, onModeChange }: Props) {
    return (
        <div className="w-full min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
            <Button
                type="button"
                className="w-full sm:w-auto whitespace-nowrap"
                variant={mode === "form" ? "default" : "outline"}
                onClick={() => onModeChange("form")}
                disabled={busy}
            >
                {t("routines.modeForm")}
            </Button>

            <Button
                type="button"
                className="w-full sm:w-auto whitespace-nowrap"
                variant={mode === "json" ? "default" : "outline"}
                onClick={() => onModeChange("json")}
                disabled={busy}
            >
                {t("routines.modeJson")}
            </Button>
        </div>
    );
}
