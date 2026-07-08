// src/components/routines/RoutinesJsonEditor.tsx
// MUI JSON editor for advanced routine payload editing.

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
        <AppCard
            title={t("routines.putJsonTitle")}
            subtitle={lang === "es" ? "Edición avanzada del payload JSON de rutina." : "Advanced JSON routine payload editing."}
            action={
                <AppActionRow align="right">
                    <Button type="button" variant="outlined" onClick={onApplyMeta} disabled={busy}>{t("routines.applyMeta")}</Button>
                    <Button type="button" variant="contained" onClick={onSave} disabled={busy || isSaving}>{isSaving ? t("routines.saving") : t("routines.savePut")}</Button>
                </AppActionRow>
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
        </AppCard>
    );
}
