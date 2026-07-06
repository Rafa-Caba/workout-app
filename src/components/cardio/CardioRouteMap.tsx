// src/components/cardio/CardioRouteMap.tsx

/**
 * CardioRouteMap
 *
 * Web route renderer for Cardio sessions with persisted routePoints.
 * Uses Leaflet/OpenStreetMap so live sessions and imported Health routes can be
 * reviewed from the web app without depending on native map components.
 */

import React from "react";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import type { WorkoutRoutePoint, WorkoutSession } from "@/types/workoutDay.types";

type Props = {
    session: WorkoutSession;
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

        if (points.length === 1) {
            map.setView(buildLatLng(points[0]), 16);
            return;
        }

        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
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

function RouteSummaryFallback({ session }: Props) {
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
        <div className="rounded-xl border bg-background p-3 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Ruta disponible</div>
            <div className="mt-1">
                Esta sesión tiene resumen de ruta, pero no puntos completos para dibujar el mapa.
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {hasStart ? (
                    <div>
                        Inicio: {formatCoordinate(summary.startLatitude ?? 0)}, {formatCoordinate(summary.startLongitude ?? 0)}
                    </div>
                ) : null}
                {hasEnd ? (
                    <div>
                        Fin: {formatCoordinate(summary.endLatitude ?? 0)}, {formatCoordinate(summary.endLongitude ?? 0)}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export function CardioRouteMap({ session }: Props) {
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
        <div className="overflow-hidden rounded-xl border bg-background">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                <div>
                    <div className="text-xs font-semibold text-foreground">Mapa de ruta</div>
                    <div className="text-xs text-muted-foreground">
                        {points.length.toLocaleString()} puntos GPS guardados
                    </div>
                </div>
            </div>

            <div className="h-[80] w-full">
                <MapContainer
                    center={center}
                    zoom={16}
                    scrollWheelZoom={false}
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
            </div>
        </div>
    );
}
