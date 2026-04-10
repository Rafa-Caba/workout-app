// src/theme/cardHierarchy.ts
// Visual hierarchy helpers for themed cards in Web.
// These only affect UI emphasis using the active palette primary color.

export const themedPanelCard =
    "border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm";

export const themedPanelCardSoft =
    "border-primary/12 bg-gradient-to-br from-card via-card to-primary/4 shadow-sm";

export const themedNestedCard =
    "border-primary/12 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm";

export const themedInnerCard =
    "border-primary/10 bg-gradient-to-br from-background to-accent/30 shadow-sm";

export const themedPill =
    "border-primary/15 bg-primary/5";

export const themedInteractive =
    "transition-colors hover:bg-primary/5";