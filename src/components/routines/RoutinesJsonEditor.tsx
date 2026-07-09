// src/components/routines/RoutinesJsonEditor.tsx
// MUI JSON editor for advanced routine payload editing.
// Duplicates the main JSON actions at the bottom so long payloads are easier to save on mobile.

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { JsonDetails } from "@/components/JsonDetails";
import { AppActionRow, AppCard } from "@/components/mui";
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

function JsonActions({
    t,
    lang,
    busy,
    isSaving,
    onApplyMeta,
    onSave,
    onBackToTop,
    includeBackToTop,
}: {
    t: TFn;
    lang: string;
    busy: boolean;
    isSaving: boolean;
    onApplyMeta: () => void;
    onSave: () => void;
    onBackToTop?: () => void;
    includeBackToTop?: boolean;
}) {
    return (
        <AppActionRow align="right" dense>
            {includeBackToTop ? (
                <Button type="button" variant="text" onClick={onBackToTop} disabled={busy}>
                    {lang === "es" ? "Volver arriba" : "Back to top"}
                </Button>
            ) : null}
            <Button type="button" variant="outlined" onClick={onApplyMeta} disabled={busy}>
                {t("routines.applyMeta")}
            </Button>
            <Button type="button" variant="contained" onClick={onSave} disabled={busy || isSaving}>
                {isSaving ? t("routines.saving") : t("routines.savePut")}
            </Button>
        </AppActionRow>
    );
}

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
    const topRef = React.useRef<HTMLDivElement | null>(null);

    function scrollToTop() {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <Box ref={topRef}>
            <AppCard
                title={t("routines.putJsonTitle")}
                subtitle={lang === "es" ? "Edición avanzada del payload JSON de rutina." : "Advanced JSON routine payload editing."}
                action={
                    <JsonActions
                        t={t}
                        lang={lang}
                        busy={busy}
                        isSaving={isSaving}
                        onApplyMeta={onApplyMeta}
                        onSave={onSave}
                    />
                }
            >
                <TextField
                    fullWidth
                    multiline
                    minRows={12}
                    label={lang === "es" ? "JSON del body" : "Body JSON"}
                    value={editor}
                    onChange={(event) => onEditorChange(event.target.value)}
                    disabled={busy}
                    sx={{ mb: 2, "& textarea": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" } }}
                />

                <TextField
                    fullWidth
                    multiline
                    minRows={7}
                    label={lang === "es" ? "JSON de meta" : "Meta JSON"}
                    value={metaEditor}
                    onChange={(event) => onMetaEditorChange(event.target.value)}
                    disabled={busy}
                    sx={{ mb: 2, "& textarea": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" } }}
                />

                <JsonDetails title={lang === "es" ? "Rutina actual" : "Current routine"} data={routine} />

                <Box sx={{ mt: 2 }}>
                    <JsonActions
                        t={t}
                        lang={lang}
                        busy={busy}
                        isSaving={isSaving}
                        onApplyMeta={onApplyMeta}
                        onSave={onSave}
                        onBackToTop={scrollToTop}
                        includeBackToTop
                    />
                </Box>
            </AppCard>
        </Box>
    );
}
