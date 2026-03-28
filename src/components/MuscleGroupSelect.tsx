// /src/components/MuscleGroupSelect.tsx

import * as React from "react";

type TFn = (key: any, vars?: any) => string;

export type MuscleGroupOption = {
    value: string;
    labelKey: string;
};

type MuscleGroupSelectProps = {
    t: TFn;
    value: string[];
    onChange: (next: string[]) => void;
    knownOptions?: MuscleGroupOption[];
    allowOther?: boolean;
    labelKey?: string;
    placeholderKey?: string;
    onBlur?: () => void;
    otherLabelKey?: string;
    otherPlaceholderKey?: string;
    otherHintKey?: string;
    disabled?: boolean;
    className?: string;
    selectClassName?: string;
    inputClassName?: string;
};

function normalize(value: string): string {
    return value.trim().replace(/\s+/g, " ");
}

function uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    values.forEach((value) => {
        const normalized = normalize(value);
        if (!normalized) return;

        const key = normalized.toLowerCase();
        if (seen.has(key)) return;

        seen.add(key);
        result.push(normalized);
    });

    return result;
}

export function MuscleGroupSelect({
    t,
    value,
    onChange,
    knownOptions,
    allowOther = true,
    labelKey = "muscle.label",
    placeholderKey = "muscle.placeholder",
    onBlur,
    otherLabelKey = "muscle.other",
    otherPlaceholderKey = "muscle.otherPlaceholder",
    otherHintKey = "muscle.otherHint",
    disabled = false,
    className,
    selectClassName,
    inputClassName,
}: MuscleGroupSelectProps) {
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = React.useState(false);
    const [otherText, setOtherText] = React.useState("");

    const defaultOptions: MuscleGroupOption[] = React.useMemo(
        () => [
            { value: "chest", labelKey: "muscle.chest" },
            { value: "back", labelKey: "muscle.back" },
            { value: "shoulders", labelKey: "muscle.shoulders" },
            { value: "biceps", labelKey: "muscle.biceps" },
            { value: "triceps", labelKey: "muscle.triceps" },
            { value: "quads", labelKey: "muscle.quads" },
            { value: "hamstrings", labelKey: "muscle.hamstrings" },
            { value: "glutes", labelKey: "muscle.glutes" },
            { value: "calves", labelKey: "muscle.calves" },
            { value: "core", labelKey: "muscle.core" },
            { value: "abs", labelKey: "muscle.abs" },
            { value: "fullBody", labelKey: "muscle.fullBody" },
            { value: "cardio", labelKey: "muscle.cardio" },
            { value: "mobility", labelKey: "muscle.mobility" },
        ],
        []
    );

    const options = React.useMemo(() => {
        const source = knownOptions?.length ? knownOptions : defaultOptions;
        const map = new Map<string, { value: string; label: string }>();

        source.forEach((option) => {
            const normalizedValue = normalize(option.value);
            const normalizedLabel = normalize(t(option.labelKey));

            if (!normalizedValue) return;

            map.set(normalizedValue.toLowerCase(), {
                value: normalizedValue,
                label: normalizedLabel || normalizedValue,
            });
        });

        return Array.from(map.values());
    }, [defaultOptions, knownOptions, t]);

    const selectedValues = React.useMemo(() => uniqueStrings(value), [value]);

    const selectedKnownMap = React.useMemo(() => {
        const map = new Map<string, { value: string; label: string }>();
        options.forEach((option) => {
            map.set(option.value.toLowerCase(), option);
        });
        return map;
    }, [options]);

    const displayValue = React.useMemo(() => {
        if (!selectedValues.length) return "";

        return selectedValues
            .map((item) => selectedKnownMap.get(item.toLowerCase())?.label ?? item)
            .join(", ");
    }, [selectedKnownMap, selectedValues]);

    React.useEffect(() => {
        if (!open) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target;
            if (!(target instanceof Node)) return;

            if (rootRef.current && !rootRef.current.contains(target)) {
                setOpen(false);
                onBlur?.();
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
                onBlur?.();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open, onBlur]);

    function toggleOption(optionValue: string) {
        if (disabled) return;

        const normalizedValue = normalize(optionValue);
        const exists = selectedValues.some(
            (item) => item.toLowerCase() === normalizedValue.toLowerCase()
        );

        const next = exists
            ? selectedValues.filter((item) => item.toLowerCase() !== normalizedValue.toLowerCase())
            : [...selectedValues, normalizedValue];

        onChange(uniqueStrings(next));
    }

    function clearAll() {
        if (disabled) return;

        onChange([]);
        setOtherText("");
    }

    function addOther() {
        if (disabled) return;

        const normalized = normalize(otherText);
        if (!normalized) return;

        onChange(uniqueStrings([...selectedValues, normalized]));
        setOtherText("");
    }

    return (
        <div ref={rootRef} className={["space-y-1 relative", className].filter(Boolean).join(" ")}>
            <label className="text-sm font-medium">{t(labelKey)}</label>

            <button
                type="button"
                onClick={() => !disabled && setOpen((prev) => !prev)}
                disabled={disabled}
                className={[
                    "w-full rounded-md border bg-background px-3 py-2 text-sm",
                    "flex items-center justify-between gap-2 text-left",
                    disabled ? "opacity-70 cursor-not-allowed" : "",
                    selectClassName,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <span className={displayValue ? "truncate" : "truncate text-muted-foreground"}>
                    {displayValue || t(placeholderKey)}
                </span>
                <span className="shrink-0">▼</span>
            </button>

            {open ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-background shadow-lg">
                    <div className="max-h-64 overflow-auto">
                        <div className="divide-y">
                            {options.map((option) => {
                                const selected = selectedValues.some(
                                    (item) => item.toLowerCase() === option.value.toLowerCase()
                                );

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => toggleOption(option.value)}
                                        className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-muted/30"
                                    >
                                        <span>{option.label}</span>
                                        <span className="w-5 text-right text-primary">
                                            {selected ? "✓" : ""}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {allowOther ? (
                        <div className="border-t px-4 py-3 space-y-2">
                            <div className="text-xs font-medium">{t(otherLabelKey)}</div>

                            <div className="flex gap-2">
                                <input
                                    value={otherText}
                                    onChange={(event) => setOtherText(event.target.value)}
                                    placeholder={t(otherPlaceholderKey)}
                                    disabled={disabled}
                                    className={[
                                        "w-full rounded-md border bg-background px-3 py-2 text-sm",
                                        inputClassName,
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                />
                                <button
                                    type="button"
                                    onClick={addOther}
                                    disabled={disabled}
                                    className="rounded-md border px-3 py-2 text-sm bg-background"
                                >
                                    Agregar
                                </button>
                            </div>

                            <div className="text-xs text-muted-foreground">{t(otherHintKey)}</div>
                        </div>
                    ) : null}

                    <div className="border-t px-4 py-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={clearAll}
                            disabled={disabled}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            Limpiar
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onBlur?.();
                            }}
                            disabled={disabled}
                            className="rounded-md border px-3 py-1.5 text-sm bg-background"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}