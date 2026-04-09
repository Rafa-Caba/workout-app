// src/components/outdoor/OutdoorSessionModal.tsx

/**
 * OutdoorSessionModal
 *
 * Simple controlled modal for the Outdoor form.
 * No dependency on extra UI modal primitives.
 */

import React from "react";

import { Button } from "@/components/ui/button";

type Props = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
};

export function OutdoorSessionModal({ open, title, onClose, children }: Props) {
    React.useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Cerrar modal"
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-3xl rounded-2xl border bg-card shadow-2xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>

                    <Button type="button" variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>

                <div className="max-h-[85vh] overflow-y-auto p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}