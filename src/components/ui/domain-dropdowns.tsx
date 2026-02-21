import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * =========================================================
 * Types
 * =========================================================
 */

export type MuscleGroupKey =
    | "chest"
    | "back"
    | "shoulders"
    | "biceps"
    | "triceps"
    | "forearms"
    | "quads"
    | "hamstrings"
    | "glutes"
    | "calves"
    | "abs"
    | "obliques"
    | "traps"
    | "lats"
    | "fullBody"
    | "cardio";

export type EquipmentKey =
    | "dumbbells"
    | "barbell"
    | "kettlebell"
    | "machine"
    | "cable"
    | "bodyweight"
    | "bands"
    | "pullupBar"
    | "bench"
    | "medicineBall"
    | "trx"
    | "rower"
    | "treadmill"
    | "bike"
    | "elliptical"
    | "jumpRope"
    | "other";

type Opt<T extends string> = {
    value: T;
    labelKey: string; // i18n key
};

const MUSCLE_OPTIONS: Opt<MuscleGroupKey>[] = [
    { value: "chest", labelKey: "muscle.chest" },
    { value: "back", labelKey: "muscle.back" },
    { value: "lats", labelKey: "muscle.lats" },
    { value: "traps", labelKey: "muscle.traps" },
    { value: "shoulders", labelKey: "muscle.shoulders" },
    { value: "biceps", labelKey: "muscle.biceps" },
    { value: "triceps", labelKey: "muscle.triceps" },
    { value: "forearms", labelKey: "muscle.forearms" },
    { value: "abs", labelKey: "muscle.abs" },
    { value: "obliques", labelKey: "muscle.obliques" },
    { value: "quads", labelKey: "muscle.quads" },
    { value: "hamstrings", labelKey: "muscle.hamstrings" },
    { value: "glutes", labelKey: "muscle.glutes" },
    { value: "calves", labelKey: "muscle.calves" },
    { value: "fullBody", labelKey: "muscle.fullBody" },
    { value: "cardio", labelKey: "muscle.cardio" },
];

const EQUIPMENT_OPTIONS: Opt<EquipmentKey>[] = [
    { value: "dumbbells", labelKey: "equipment.dumbbells" },
    { value: "barbell", labelKey: "equipment.barbell" },
    { value: "kettlebell", labelKey: "equipment.kettlebell" },
    { value: "machine", labelKey: "equipment.machine" },
    { value: "cable", labelKey: "equipment.cable" },
    { value: "bodyweight", labelKey: "equipment.bodyweight" },
    { value: "bands", labelKey: "equipment.bands" },
    { value: "pullupBar", labelKey: "equipment.pullupBar" },
    { value: "bench", labelKey: "equipment.bench" },
    { value: "medicineBall", labelKey: "equipment.medicineBall" },
    { value: "trx", labelKey: "equipment.trx" },
    { value: "rower", labelKey: "equipment.rower" },
    { value: "treadmill", labelKey: "equipment.treadmill" },
    { value: "bike", labelKey: "equipment.bike" },
    { value: "elliptical", labelKey: "equipment.elliptical" },
    { value: "jumpRope", labelKey: "equipment.jumpRope" },
    { value: "other", labelKey: "equipment.other" },
];

function findLabel<T extends string>(t: (k: any) => string, options: Opt<T>[], value: T | null | undefined) {
    const opt = options.find((o) => o.value === value);
    if (!opt) return null;
    return t(opt.labelKey as any);
}

/**
 * =========================================================
 * Reusable base dropdown
 * =========================================================
 */
function BaseDomainDropdown<T extends string>({
    label,
    placeholder,
    value,
    options,
    onChange,
    disabled,
    allowClear = true,
    buttonClassName,
}: {
    label: string;
    placeholder: string;
    value: T | null;
    options: Opt<T>[];
    onChange: (next: T | null) => void;
    disabled?: boolean;
    allowClear?: boolean;
    buttonClassName?: string;
}) {
    const { t, lang } = useI18n();

    const currentLabel = React.useMemo(() => findLabel(t, options, value ?? null), [t, options, value]);

    return (
        <div className="space-y-1 min-w-0">
            <div className="text-xs font-medium">{label}</div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between gap-2",
                            "h-10 px-3 text-sm",
                            buttonClassName
                        )}
                    >
                        <span className={cn("truncate text-left", !currentLabel && "text-muted-foreground")}>
                            {currentLabel ?? placeholder}
                        </span>

                        <span className="text-muted-foreground" aria-hidden="true">
                            ▾
                        </span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="min-w-[16rem]">
                    <DropdownMenuLabel>{label}</DropdownMenuLabel>

                    {allowClear ? (
                        <>
                            <DropdownMenuItem
                                onClick={() => onChange(null)}
                                className={cn(!value ? "font-semibold" : "")}
                            >
                                {lang === "es" ? "— Sin selección —" : "— No selection —"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    ) : null}

                    {options.map((opt) => {
                        const active = value === opt.value;
                        return (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => onChange(opt.value)}
                                className={cn(active ? "font-semibold" : "")}
                            >
                                {t(opt.labelKey as any)}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * =========================================================
 * Public components
 * =========================================================
 */

export function MuscleGroupDropdown({
    value,
    onChange,
    disabled,
    allowClear = true,
    label,
}: {
    value: MuscleGroupKey | null;
    onChange: (next: MuscleGroupKey | null) => void;
    disabled?: boolean;
    allowClear?: boolean;
    label?: string;
}) {
    const { lang } = useI18n();

    return (
        <BaseDomainDropdown
            label={label ?? (lang === "es" ? "Grupo muscular" : "Muscle group")}
            placeholder={lang === "es" ? "Seleccionar…" : "Select…"}
            value={value}
            options={MUSCLE_OPTIONS}
            onChange={onChange}
            disabled={disabled}
            allowClear={allowClear}
        />
    );
}

export function EquipmentDropdown({
    value,
    onChange,
    disabled,
    allowClear = true,
    label,
}: {
    value: EquipmentKey | null;
    onChange: (next: EquipmentKey | null) => void;
    disabled?: boolean;
    allowClear?: boolean;
    label?: string;
}) {
    const { lang } = useI18n();

    return (
        <BaseDomainDropdown
            label={label ?? (lang === "es" ? "Equipo" : "Equipment")}
            placeholder={lang === "es" ? "Seleccionar…" : "Select…"}
            value={value}
            options={EQUIPMENT_OPTIONS}
            onChange={onChange}
            disabled={disabled}
            allowClear={allowClear}
        />
    );
}