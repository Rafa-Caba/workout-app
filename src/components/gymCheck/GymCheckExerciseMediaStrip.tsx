// src/components/gymCheck/GymCheckExerciseMediaStrip.tsx
// MUI media preview strip for Gym Check exercise attachments.

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { AttachmentOption } from "@/utils/routines/attachments";

type Props = {
    lang: "es" | "en";
    mediaPublicIds: string[];
    attachmentByPublicId: Map<string, AttachmentOption>;
    onOpenViewer: (opt: AttachmentOption) => void;
    onRemoveAt: (index: number) => void;
};

export function GymCheckExerciseMediaStrip({ lang, mediaPublicIds, attachmentByPublicId, onOpenViewer, onRemoveAt }: Props) {
    const items = mediaPublicIds
        .map((publicId, index) => ({ publicId, index, option: attachmentByPublicId.get(publicId) ?? null }))
        .filter((item): item is { publicId: string; index: number; option: AttachmentOption } => Boolean(item.option));

    if (items.length === 0) {
        return (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.default" }}>
                <Typography variant="body2" color="text.secondary">
                    {lang === "es" ? "Sin media agregada." : "No media added."}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {items.map((item) => (
                <Box key={`${item.publicId}-${item.index}`} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, border: 1, borderColor: "divider", borderRadius: 2, p: 0.75, maxWidth: "100%" }}>
                    <Chip size="small" label={item.option.label || item.publicId} onClick={() => onOpenViewer(item.option)} sx={{ maxWidth: 220 }} />
                    <Button size="small" variant="text" color="error" onClick={() => onRemoveAt(item.index)}>
                        {lang === "es" ? "Quitar" : "Remove"}
                    </Button>
                </Box>
            ))}
        </Box>
    );
}
