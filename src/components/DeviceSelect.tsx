import * as React from "react";

type TFn = (key: any, vars?: any) => string;

type DeviceSelectProps = {
    t: TFn;

    value: string | null;
    onChange: (next: string | null) => void;

    knownOptions?: string[];
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

function isOtherValue(v: string | null, known: string[]) {
    if (!v) return false;
    const norm = normalize(v).toLowerCase();
    return !known.some((k) => normalize(k).toLowerCase() === norm);
}

export function DeviceSelect({
    t,
    value,
    onChange,
    knownOptions,
    allowOther = true,

    labelKey = "device.label",
    placeholderKey = "device.placeholder",

    onBlur,

    otherLabelKey = "device.other",
    otherPlaceholderKey = "device.otherPlaceholder",
    otherHintKey = "device.otherHint",

    disabled = false,

    className,
    selectClassName,
    inputClassName,
}: DeviceSelectProps) {
    const defaultDevices = React.useMemo(
        () => [
            t("device.options.appleWatch"),
            t("device.options.iphone"),
            t("device.options.ipad"),
            t("device.options.macHealthKit"),

            t("device.options.garminWatch"),
            t("device.options.garminConnect"),

            t("device.options.androidPhone"),
            t("device.options.googleFit"),

            t("device.options.fitbit"),
            t("device.options.fitbitCharge"),
            t("device.options.fitbitVersa"),
            t("device.options.fitbitSense"),

            t("device.options.ouraRing"),
            t("device.options.whoop"),

            t("device.options.polarWatch"),
            t("device.options.suuntoWatch"),
            t("device.options.corosWatch"),

            t("device.options.samsungGalaxyWatch"),
            t("device.options.xiaomiMiBand"),
            t("device.options.huaweiWatch"),

            t("device.options.withings"),
            t("device.options.strava"),
            t("device.options.manual"),
        ]
            .map(normalize)
            .filter(Boolean),
        [t]
    );

    const known = React.useMemo(() => {
        const base = (knownOptions?.length ? knownOptions : defaultDevices)
            .map(normalize)
            .filter(Boolean);

        return Array.from(new Set(base));
    }, [knownOptions, defaultDevices]);

    // Derived: does current value match a known option?
    const matchedKnown = React.useMemo(() => {
        if (!value) return null;
        const norm = normalize(value).toLowerCase();
        return known.find((k) => normalize(k).toLowerCase() === norm) ?? null;
    }, [value, known]);

    // track "Other" mode explicitly (don’t rely on value)
    const [otherSelected, setOtherSelected] = React.useState<boolean>(() => {
        if (!allowOther) return false;
        if (!value) return false;
        return isOtherValue(value, known);
    });

    // Keep local "otherSelected" in sync when value changes externally
    React.useEffect(() => {
        if (!allowOther) {
            setOtherSelected(false);
            return;
        }

        // If parent sets a known value, exit other mode
        if (matchedKnown) {
            setOtherSelected(false);
            return;
        }

        // If parent sets a non-empty value that isn't known, enter other mode
        if (value && isOtherValue(value, known)) {
            setOtherSelected(true);
            return;
        }

        // If value becomes null (cleared), exit other mode
        if (!value) {
            setOtherSelected(false);
        }
    }, [allowOther, matchedKnown, value, known]);

    const [otherText, setOtherText] = React.useState<string>(() =>
        otherSelected && value ? value : ""
    );

    React.useEffect(() => {
        if (otherSelected && value) setOtherText(value);
        if (!otherSelected) setOtherText("");
    }, [otherSelected, value]);

    // What option is selected in the dropdown?
    const selectValue = React.useMemo(() => {
        if (matchedKnown) return matchedKnown;
        if (allowOther && otherSelected) return "__other__";
        return value ? value : ""; // fallback (should mostly be "")
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

            // Do NOT force value to "", because that would kick us out of __other__ in some parents.
            // Instead, keep existing otherText (or empty) and let the input drive updates.
            const normalized = normalize(otherText);
            onChange(normalized ? normalized : "");
            return;
        }

        setOtherSelected(false);
        onChange(next);
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
                className={[
                    "w-full rounded-md border bg-background px-3 py-2 text-sm",
                    selectClassName,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <option value="">{t(placeholderKey)}</option>

                {known.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
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
                        className={[
                            "w-full rounded-md border bg-background px-3 py-2 text-sm",
                            inputClassName,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    />
                    <div className="text-xs text-muted-foreground mt-1">{t(otherHintKey)}</div>
                </div>
            ) : null}
        </div>
    );
}
