// src/components/SessionTypeSelect.tsx
// Closed session type selector for web app.
// Mirrors the intent of DeviceSelect but intentionally does NOT allow custom values,
// so routine day plans always use canonical session names.

import * as React from "react";

import type { I18nKey } from "@/i18n/translations";
import {
    SESSION_TYPE_OPTIONS,
    type SessionTypeOption,
} from "@/components/sessionTypeOptions";

type TFn = (key: I18nKey) => string;

type SessionTypeSelectProps = {
    t: TFn;
    value: string | null | undefined;
    onChange: (next: SessionTypeOption | null) => void;
    disabled?: boolean;
    className?: string;
    selectClassName?: string;
    labelKey?: I18nKey;
    placeholderKey?: I18nKey;
    onBlur?: () => void;
};

function normalize(value: string): string {
    return value.trim().replace(/\s+/g, " ");
}

function findCanonicalMatch(
    value: string | null | undefined
): SessionTypeOption | null {
    if (typeof value !== "string") return null;

    const normalized = normalize(value).toLowerCase();
    if (!normalized) return null;

    return (
        SESSION_TYPE_OPTIONS.find(
            (option) => normalize(option).toLowerCase() === normalized
        ) ?? null
    );
}

export function SessionTypeSelect({
    t,
    value,
    onChange,
    disabled = false,
    className,
    selectClassName,
    labelKey = "routines.sessionType",
    placeholderKey = "routines.sessionTypePh",
    onBlur,
}: SessionTypeSelectProps) {
    const selectedValue = React.useMemo(
        () => findCanonicalMatch(value),
        [value]
    );

    const handleChange = React.useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            const nextValue = event.target.value;

            if (!nextValue) {
                onChange(null);
                return;
            }

            const matched = findCanonicalMatch(nextValue);
            onChange(matched);
        },
        [onChange]
    );

    return (
        <div className={["space-y-1", className].filter(Boolean).join(" ")}>
            <label className="text-xs font-medium">{t(labelKey)}</label>

            <select
                value={selectedValue ?? ""}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                className={[
                    "w-full rounded-md border bg-background px-3 py-2 text-sm",
                    selectClassName,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <option value="">{t(placeholderKey)}</option>

                {SESSION_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}