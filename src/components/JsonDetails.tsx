import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { useSettingsStore } from "@/state/settings.store";

function safeStringify(v: unknown) {
    try {
        return JSON.stringify(v, null, 2);
    } catch {
        return String(v);
    }
}

type JsonDetailsProps = {
    title?: string;
    data: unknown;
    defaultOpen?: boolean;
};

export function JsonDetails({ title, data, defaultOpen = false }: JsonDetailsProps) {
    const { t } = useI18n();

    // 🔧 Usa el flag persistido en Admin Settings (settings.debug.showJson)
    const showJson = useSettingsStore((s) => s.settings.debug?.showJson ?? false);

    // Si el admin apagó el JSON debug desde Admin Settings, no mostramos nada
    if (!showJson) return null;

    const [isOpen, setIsOpen] = React.useState<boolean>(defaultOpen);
    const text = React.useMemo(() => safeStringify(data), [data]);

    React.useEffect(() => {
        setIsOpen(defaultOpen);
    }, [defaultOpen]);

    async function copy() {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(t("json.copySuccess"));
        } catch {
            toast.error(t("json.copyFail"));
        }
    }

    const isEmpty = data === null || data === undefined;

    return (
        <details
            className="rounded-xl border bg-card p-3 space-y-3"
            open={isOpen}
            onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
        >
            <summary className="cursor-pointer text-sm font-medium">
                {title ?? t("json.title")}
            </summary>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    className="h-8 px-3"
                    onClick={copy}
                    disabled={isEmpty}
                >
                    {t("json.copy")}
                </Button>
                {isEmpty ? (
                    <span className="text-xs text-muted-foreground">
                        {t("json.noDataInline")}
                    </span>
                ) : null}
            </div>

            {!isEmpty ? (
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {text}
                </pre>
            ) : (
                <div className="mt-2 text-sm text-muted-foreground">
                    {t("json.noResponse")}
                </div>
            )}
        </details>
    );
}
