import * as React from "react";

type TFn = (key: any, vars?: any) => string;

export type MuscleGroupOption = {
    value: string; // stable slug stored in DB
    labelKey: string; // i18n key for label
};

type MuscleGroupSelectProps = {
    t: TFn;

    value: string | null;
    onChange: (next: string | null) => void;

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

function normalize(s: string): string {
    return s.trim().replace(/\s+/g, " ");
}

function isOtherValue(v: string | null, known: { value: string; label: string }[]) {
    if (!v) return false;
    const norm = normalize(v).toLowerCase();
    return !known.some((k) => normalize(k.value).toLowerCase() === norm || normalize(k.label).toLowerCase() === norm);
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

    const opts = React.useMemo(() => {
        const base = (knownOptions?.length ? knownOptions : defaultOptions).map((o) => ({
            value: normalize(o.value),
            label: normalize(t(o.labelKey)),
            labelKey: o.labelKey,
        }));

        // de-dupe by value
        const map = new Map<string, typeof base[number]>();
        for (const o of base) {
            if (!o.value) continue;
            map.set(o.value, o);
        }
        return Array.from(map.values());
    }, [knownOptions, defaultOptions, t]);

    const matchedKnown = React.useMemo(() => {
        if (!value) return null;
        const norm = normalize(value).toLowerCase();

        // match by stored slug OR by label (legacy)
        return (
            opts.find((o) => normalize(o.value).toLowerCase() === norm) ??
            opts.find((o) => normalize(o.label).toLowerCase() === norm) ??
            null
        );
    }, [value, opts]);

    const [otherSelected, setOtherSelected] = React.useState<boolean>(() => {
        if (!allowOther) return false;
        if (!value) return false;
        return isOtherValue(value, opts);
    });

    React.useEffect(() => {
        if (!allowOther) {
            setOtherSelected(false);
            return;
        }
        if (matchedKnown) {
            setOtherSelected(false);
            return;
        }
        if (value && isOtherValue(value, opts)) {
            setOtherSelected(true);
            return;
        }
        if (!value) setOtherSelected(false);
    }, [allowOther, matchedKnown, value, opts]);

    const [otherText, setOtherText] = React.useState<string>(() => (otherSelected && value ? value : ""));

    React.useEffect(() => {
        if (otherSelected && value) setOtherText(value);
        if (!otherSelected) setOtherText("");
    }, [otherSelected, value]);

    const selectValue = React.useMemo(() => {
        if (matchedKnown) return matchedKnown.value; // always store slug
        if (allowOther && otherSelected) return "__other__";
        return value ? value : "";
    }, [matchedKnown, allowOther, otherSelected, value]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value;

        if (!next) {
            setOtherSelected(false);
            onChange(null);
            return;
        }

        if (next === "__other__") {
            setOtherSelected(true);
            const normalized = normalize(otherText);
            onChange(normalized ? normalized : "");
            return;
        }

        setOtherSelected(false);
        onChange(next); // slug
    };

    const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setOtherText(next);
        const normalized = normalize(next);
        onChange(normalized ? normalized : "");
    };

    return (
        <div className={["space-y-1", className].filter(Boolean).join(" ")}>
            <label className="text-sm font-medium">{t(labelKey)}</label>

            <select
                value={selectValue}
                onChange={handleSelectChange}
                disabled={disabled}
                onBlur={onBlur}
                className={["w-full rounded-md border bg-background px-3 py-2 text-sm", selectClassName].filter(Boolean).join(" ")}
            >
                <option value="">{t(placeholderKey)}</option>

                {opts.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}

                {allowOther ? <option value="__other__">{t(otherLabelKey)}</option> : null}
            </select>

            {allowOther && otherSelected ? (
                <div className="pt-1">
                    <input
                        value={otherText}
                        onChange={handleOtherInputChange}
                        disabled={disabled}
                        placeholder={t(otherPlaceholderKey)}
                        onBlur={onBlur}
                        className={["w-full rounded-md border bg-background px-3 py-2 text-sm", inputClassName].filter(Boolean).join(" ")}
                    />
                    <div className="text-xs text-muted-foreground mt-1">{t(otherHintKey)}</div>
                </div>
            ) : null}
        </div>
    );
}