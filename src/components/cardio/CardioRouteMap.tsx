// src/components/cardio/CardioRouteMap.tsx
// Responsive MUI + Leaflet route renderer for Cardio sessions with persisted routePoints.

import React from "react";
import "leaflet/dist/leaflet.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import type { WorkoutRoutePoint, WorkoutSession } from "@/types/workoutDay.types";

type Props = {
    session: WorkoutSession;
    height?: SxProps<Theme>;
    showHeader?: boolean;
    dense?: boolean;
};

type ValidRoutePoint = WorkoutRoutePoint & {
    latitude: number;
    longitude: number;
};

function isFiniteCoordinate(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function isValidRoutePoint(point: WorkoutRoutePoint): point is ValidRoutePoint {
    return (
        isFiniteCoordinate(point.latitude) &&
        isFiniteCoordinate(point.longitude) &&
        point.latitude >= -90 &&
        point.latitude <= 90 &&
        point.longitude >= -180 &&
        point.longitude <= 180
    );
}

function getRoutePoints(session: WorkoutSession): ValidRoutePoint[] {
    if (!Array.isArray(session.routePoints)) {
        return [];
    }

    return session.routePoints.filter(isValidRoutePoint);
}

function buildLatLng(point: ValidRoutePoint): LatLngExpression {
    return [point.latitude, point.longitude];
}

function buildBounds(points: ValidRoutePoint[]): LatLngBoundsExpression | null {
    if (points.length === 0) {
        return null;
    }

    return points.map((point) => [point.latitude, point.longitude]);
}

function formatCoordinate(value: number): string {
    return value.toFixed(6);
}

function formatRecordedAt(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function RouteFitBounds({ points }: { points: ValidRoutePoint[] }) {
    const map = useMap();

    React.useEffect(() => {
        const bounds = buildBounds(points);
        if (!bounds) {
            return;
        }

        window.setTimeout(() => {
            map.invalidateSize();

            if (points.length === 1) {
                map.setView(buildLatLng(points[0]), 16);
                return;
            }

            map.fitBounds(bounds, { padding: [28, 28], maxZoom: 18 });
        }, 120);
    }, [map, points]);

    return null;
}

function RoutePointMarker({ label, point }: { label: string; point: ValidRoutePoint }) {
    const recordedAt = formatRecordedAt(point.recordedAt);

    return (
        <CircleMarker center={buildLatLng(point)} radius={7} weight={3}>
            <Popup>
                <div className="space-y-1 text-xs">
                    <div className="font-semibold">{label}</div>
                    <div>Lat: {formatCoordinate(point.latitude)}</div>
                    <div>Lng: {formatCoordinate(point.longitude)}</div>
                    {recordedAt ? <div>{recordedAt}</div> : null}
                </div>
            </Popup>
        </CircleMarker>
    );
}

function RouteSummaryFallback({ session }: Pick<Props, "session">) {
    const summary = session.routeSummary;

    if (!summary || session.hasRoute !== true) {
        return null;
    }

    const hasStart =
        isFiniteCoordinate(summary.startLatitude) &&
        isFiniteCoordinate(summary.startLongitude);
    const hasEnd =
        isFiniteCoordinate(summary.endLatitude) &&
        isFiniteCoordinate(summary.endLongitude);

    if (!hasStart && !hasEnd) {
        return null;
    }

    return (
        <Box
            sx={(theme) => ({
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.default",
                p: { xs: 1.5, md: 2 },
                color: "text.secondary",
                boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.04)}`,
            })}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary" }}>
                Ruta disponible
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Esta sesión tiene resumen de ruta, pero no puntos completos para dibujar el mapa.
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1,
                    mt: 1.5,
                }}
            >
                {hasStart ? (
                    <Typography variant="caption" color="text.secondary">
                        Inicio: {formatCoordinate(summary.startLatitude ?? 0)}, {formatCoordinate(summary.startLongitude ?? 0)}
                    </Typography>
                ) : null}
                {hasEnd ? (
                    <Typography variant="caption" color="text.secondary">
                        Fin: {formatCoordinate(summary.endLatitude ?? 0)}, {formatCoordinate(summary.endLongitude ?? 0)}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
}

export function CardioRouteMap({
    session,
    height,
    showHeader = true,
    dense = false,
}: Props) {
    const points = React.useMemo(() => getRoutePoints(session), [session]);

    if (session.cardioEnvironment !== "outdoor" || session.hasRoute !== true) {
        return null;
    }

    if (points.length === 0) {
        return <RouteSummaryFallback session={session} />;
    }

    const [startPoint] = points;
    if (!startPoint) {
        return null;
    }

    const endPoint = points[points.length - 1] ?? startPoint;
    const center = buildLatLng(startPoint);
    const positions = points.map(buildLatLng);

    return (
        <Box
            sx={{
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
                minWidth: 0,
            }}
        >
            {showHeader ? (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                        borderBottom: 1,
                        borderColor: "divider",
                        px: { xs: 1.5, md: 2 },
                        py: dense ? 0.875 : 1.125,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                            Mapa de ruta
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {points.length.toLocaleString()} puntos GPS guardados
                        </Typography>
                    </Box>
                </Box>
            ) : null}

            <Box
                sx={[
                    {
                        height: {
                            xs: dense ? 260 : 300,
                            sm: dense ? 320 : 360,
                            lg: dense ? 360 : 460,
                        },
                        width: "100%",
                        minWidth: 0,
                        "& .leaflet-container": {
                            height: "100%",
                            width: "100%",
                            fontFamily: "inherit",
                        },
                    },
                    ...(Array.isArray(height) ? height : height ? [height] : []),
                ]}
            >
                <MapContainer
                    center={center}
                    zoom={16}
                    scrollWheelZoom
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RouteFitBounds points={points} />
                    {positions.length > 1 ? <Polyline positions={positions} /> : null}
                    <RoutePointMarker label="Inicio" point={startPoint} />
                    <RoutePointMarker label="Fin" point={endPoint} />
                </MapContainer>
            </Box>
        </Box>
    );
}
