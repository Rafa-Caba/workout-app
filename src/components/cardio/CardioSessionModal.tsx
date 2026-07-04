// src/components/cardio/CardioSessionModal.tsx

/**
 * CardioSessionModal
 *
 * Simple controlled modal for the Cardio form.
 */

import React from "react";

import { Button } from "@/components/ui/button";

type Props = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
};

export function CardioSessionModal({ open, title, onClose, children }: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border bg-card shadow-xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-4">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>

                    <Button type="button" variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>

                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}
