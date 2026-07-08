// src/components/bodyMetrics/BodyMetricsIllustration.tsx
// Small decorative MUI illustration for body metrics empty/hero states.

import ActivityIcon from "@mui/icons-material/MonitorHeart";
import GaugeIcon from "@mui/icons-material/Speed";
import RulerIcon from "@mui/icons-material/Straighten";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";

export function BodyMetricsIllustration() {
    return (
        <Box sx={{ position: "relative", mx: "auto", width: 148, height: 132 }}>
            <Box
                sx={(theme) => ({
                    position: "absolute",
                    insetInline: 18,
                    top: 8,
                    height: 96,
                    borderRadius: "50%",
                    border: 1,
                    borderColor: "divider",
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                })}
            />

            <Box
                sx={{
                    position: "absolute",
                    left: 2,
                    top: 22,
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    boxShadow: 2,
                    display: "grid",
                    placeItems: "center",
                    color: "primary.main",
                }}
            >
                <GaugeIcon fontSize="small" />
            </Box>

            <Box
                sx={{
                    position: "absolute",
                    right: 2,
                    top: 34,
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    boxShadow: 2,
                    display: "grid",
                    placeItems: "center",
                    color: "text.primary",
                }}
            >
                <RulerIcon fontSize="small" />
            </Box>

            <Box
                sx={{
                    position: "absolute",
                    insetInline: 0,
                    bottom: 18,
                    mx: "auto",
                    width: 64,
                    height: 64,
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    boxShadow: 3,
                    display: "grid",
                    placeItems: "center",
                    color: "primary.main",
                }}
            >
                <ActivityIcon />
            </Box>

            <Chip
                label="progreso"
                size="small"
                color="primary"
                sx={{
                    position: "absolute",
                    right: 18,
                    bottom: 0,
                    fontWeight: 800,
                }}
            />
        </Box>
    );
}
