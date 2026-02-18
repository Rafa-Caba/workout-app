import React from "react";
import { Button } from "@/components/ui/button";
import { JsonDetails } from "@/components/JsonDetails";
import type { I18nKey } from "@/i18n/translations";

type TFn = (key: I18nKey) => string;

type Props = {
    t: TFn;
    lang: string;

    busy: boolean;
    editor: string;
    onEditorChange: (next: string) => void;

    metaEditor: string;
    onMetaEditorChange: (next: string) => void;

    onApplyMeta: () => void;

    onSave: () => void;
    isSaving: boolean;

    routine: unknown | null;
};

export function RoutinesJsonEditor({
    t,
    lang,
    busy,
    editor,
    onEditorChange,
    metaEditor,
    onMetaEditorChange,
    onApplyMeta,
    onSave,
    isSaving,
    routine,
}: Props) {
    return (
        <div className="w-full min-w-0 rounded-xl border bg-card p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold wrap-break-words">{t("routines.putJsonTitle")}</h2>

                <Button
                    type="button"
                    className="w-full sm:w-auto whitespace-nowrap"
                    onClick={onSave}
                    disabled={busy || !editor}
                >
                    {isSaving ? t("routines.saving") : t("routines.savePut")}
                </Button>
            </div>

            <p className="text-sm text-muted-foreground wrap-break-words">
                {t("routines.putOnlyHint")} <span className="font-mono">title</span>,{" "}
                <span className="font-mono">split</span>, <span className="font-mono">plannedDays</span>,{" "}
                <span className="font-mono">meta</span>, <span className="font-mono">day/days</span>.
            </p>

            <div className="w-full min-w-0 rounded-xl border bg-background p-4 space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold wrap-break-words">{t("routines.metaTitle")}</div>
                        <div className="text-xs text-muted-foreground wrap-break-words">{t("routines.metaHint")}</div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-full sm:w-auto whitespace-nowrap"
                        disabled={busy}
                        onClick={onApplyMeta}
                    >
                        {t("routines.applyMeta")}
                    </Button>
                </div>

                <textarea
                    className="min-h-[30] w-full rounded-md border bg-background p-3 font-mono text-xs sm:text-sm leading-relaxed"
                    value={metaEditor}
                    onChange={(e) => onMetaEditorChange(e.target.value)}
                    disabled={busy}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                />
            </div>

            <textarea
                className="min-h-[55] w-full rounded-md border bg-background p-3 font-mono text-xs sm:text-sm leading-relaxed"
                value={editor}
                onChange={(e) => onEditorChange(e.target.value)}
                disabled={busy}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
            />

            {routine ? <JsonDetails title={t("routines.debugRawRoutine")} data={routine} /> : null}
        </div>
    );
}
