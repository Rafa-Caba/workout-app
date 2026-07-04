// src/components/DeviceSelect.tsx

import * as React from "react";
import type { I18nKey } from "@/i18n/translations";

type I18nVars = Record<string, string | number>;
type TFn = (key: I18nKey, vars?: I18nVars) => string;

type DeviceSelectTranslationKey = Extract<
    I18nKey,
    | "device.label"
    | "device.placeholder"
    | "device.other"
    | "device.otherPlaceholder"
    | "device.otherHint"
>;

type DeviceSelectLabel = DeviceSelectTranslationKey | string;

type DeviceSelectProps = {
    t: TFn;

    value: string | null;
    onChange: (next: string | null) => void;

    knownOptions?: string[];
    allowOther?: boolean;

    labelKey?: DeviceSelectLabel;
    placeholderKey?: DeviceSelectLabel;

    onBlur?: () => void;

    otherLabelKey?: DeviceSelectLabel;
    otherPlaceholderKey?: DeviceSelectLabel;
    otherHintKey?: DeviceSelectLabel;

    disabled?: boolean;

    className?: string;
    selectClassName?: string;
    inputClassName?: string;
};

const DEVICE_SELECT_TRANSLATION_KEYS: readonly string[] = [
    "device.label",
    "device.placeholder",
    "device.other",
    "device.otherPlaceholder",
    "device.otherHint",
];

function isDeviceSelectTranslationKey(value: string): value is DeviceSelectTranslationKey {
    return DEVICE_SELECT_TRANSLATION_KEYS.includes(value);
}

function renderDeviceLabel(t: TFn, label: DeviceSelectLabel): string {
    return isDeviceSelectTranslationKey(label) ? t(label) : label;
}

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

    const matchedKnown = React.useMemo(() => {
        if (!value) return null;
        const norm = normalize(value).toLowerCase();
        return known.find((k) => normalize(k).toLowerCase() === norm) ?? null;
    }, [value, known]);

    const [otherSelected, setOtherSelected] = React.useState<boolean>(() => {
        if (!allowOther) return false;
        if (!value) return false;
        return isOtherValue(value, known);
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

        if (value && isOtherValue(value, known)) {
            setOtherSelected(true);
            return;
        }

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

    const selectValue = React.useMemo(() => {
        if (matchedKnown) return matchedKnown;
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
            <label className="text-sm font-medium">{renderDeviceLabel(t, labelKey)}</label>

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
                <option value="">{renderDeviceLabel(t, placeholderKey)}</option>

                {known.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}

                {allowOther ? <option value="__other__">{renderDeviceLabel(t, otherLabelKey)}</option> : null}
            </select>

            {allowOther && otherSelected ? (
                <div className="pt-1">
                    <input
                        value={otherText}
                        onChange={handleOtherInputChange}
                        disabled={disabled}
                        placeholder={renderDeviceLabel(t, otherPlaceholderKey)}
                        onBlur={onBlur}
                        className={[
                            "w-full rounded-md border bg-background px-3 py-2 text-sm",
                            inputClassName,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
                        {renderDeviceLabel(t, otherHintKey)}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
