// src/components/mui/AppResponsiveTabs.tsx
// Shared responsive MUI tabs helper for section switching.
// Keeps MUI Tabs safe when the current value is temporarily outside available tabs.

import type { ReactNode, SyntheticEvent } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type AppResponsiveTab = {
    value: string;
    label: ReactNode;
    badge?: number | string;
    icon?: ReactNode;
    disabled?: boolean;
};

type AppResponsiveTabsProps = {
    value: string;
    tabs: AppResponsiveTab[];
    onChange: (value: string) => void;
    ariaLabel: string;
    variant?: "standard" | "scrollable" | "fullWidth";
    sx?: SxProps<Theme>;
};

function buildTabLabel(tab: AppResponsiveTab) {
    const hasBadge = tab.badge !== undefined && tab.badge !== null;

    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                minWidth: 0,
            }}
        >
            {tab.icon ? <Box sx={{ display: "inline-flex", flexShrink: 0 }}>{tab.icon}</Box> : null}
            <Typography component="span" variant="button" sx={{ fontWeight: 800, textTransform: "none" }}>
                {tab.label}
            </Typography>
            {hasBadge ? (
                <Chip
                    label={tab.badge}
                    size="small"
                    sx={{
                        height: 20,
                        minWidth: 20,
                        fontSize: 11,
                        fontWeight: 800,
                    }}
                />
            ) : null}
        </Box>
    );
}

function getSafeTabsValue(value: string, tabs: AppResponsiveTab[]): string | false {
    const hasMatchingTab = tabs.some((tab) => tab.value === value);

    if (hasMatchingTab) {
        return value;
    }

    /**
     * MUI Tabs warns when value is not represented by a rendered Tab.
     * During data transitions this can happen before page-level effects normalize
     * selected day/week state. Using false avoids noisy console errors without
     * mutating the caller state from this presentational helper.
     */
    return false;
}

export function AppResponsiveTabs({
    value,
    tabs,
    onChange,
    ariaLabel,
    variant = "scrollable",
    sx,
}: AppResponsiveTabsProps) {
    const safeValue = getSafeTabsValue(value, tabs);

    const handleChange = (_event: SyntheticEvent, nextValue: string) => {
        onChange(nextValue);
    };

    return (
        <Box
            sx={[
                {
                    minWidth: 0,
                    borderBottom: 1,
                    borderColor: "divider",
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <Tabs
                value={safeValue}
                onChange={handleChange}
                aria-label={ariaLabel}
                variant={variant}
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                    minHeight: 44,
                    "& .MuiTab-root": {
                        minHeight: 44,
                        px: 1.5,
                    },
                }}
            >
                {tabs.map((tab) => (
                    <Tab
                        key={tab.value}
                        value={tab.value}
                        label={buildTabLabel(tab)}
                        disabled={tab.disabled}
                    />
                ))}
            </Tabs>
        </Box>
    );
}

export type { AppResponsiveTab, AppResponsiveTabsProps };
