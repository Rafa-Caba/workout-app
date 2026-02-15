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

export function JsonDetails({
    title,
    data,
    defaultOpen = false,
}: {
    title?: string;
    data: unknown;
    defaultOpen?: boolean;
}) {
    const { t } = useI18n();
    const showJson = useSettingsStore((s) => s.settings.debug.showJson);

    // Global toggle
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
            className="rounded-xl border bg-background p-3"
            open={isOpen}
            onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
        >
            <summary className="cursor-pointer text-sm font-medium">{title ?? t("json.title")}</summary>

            <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" className="h-8 px-3" onClick={copy} disabled={isEmpty}>
                    {t("json.copy")}
                </Button>
                {isEmpty ? <span className="text-xs text-muted-foreground">{t("json.noDataInline")}</span> : null}
            </div>

            {!isEmpty ? (
                <pre className="mt-3 text-xs overflow-auto whitespace-pre-wrap">{text}</pre>
            ) : (
                <div className="mt-3 text-sm text-muted-foreground">{t("json.noResponse")}</div>
            )}
        </details>
    );
}
