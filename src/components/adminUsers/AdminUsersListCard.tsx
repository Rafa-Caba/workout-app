// src/components/adminUsers/AdminUsersListCard.tsx
// MUI admin users list with filters, table, pagination and actions.

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { AppCard, AppEmptyState } from "@/components/mui";
import type { AdminUser } from "@/types/adminUser.types";
import {
    coachModeLabel,
    formatLastLogin,
    getInitials,
    readAssignedTrainer,
    readCoachMode,
    shortId,
} from "./adminUsers.shared";

type RoleFilter = "all" | "admin" | "user";
type ActiveFilter = "all" | "active" | "inactive";

type Props = {
    lang: string;
    items: AdminUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    search: string;
    roleFilter: RoleFilter;
    activeFilter: ActiveFilter;
    loading: boolean;
    error: string | null;
    trainersById: Map<string, AdminUser>;
    onSearchChange: (value: string) => void;
    onRoleFilterChange: (value: RoleFilter) => void;
    onActiveFilterChange: (value: ActiveFilter) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onCreate: () => void;
    onEdit: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
    onPurge: (user: AdminUser) => void;
    onOpenProfileImage: (user: AdminUser) => void;
};

export function AdminUsersListCard({
    lang,
    items,
    total,
    page,
    pageSize,
    totalPages,
    search,
    roleFilter,
    activeFilter,
    loading,
    error,
    trainersById,
    onSearchChange,
    onRoleFilterChange,
    onActiveFilterChange,
    onPrevPage,
    onNextPage,
    onCreate,
    onEdit,
    onDelete,
    onPurge,
    onOpenProfileImage,
}: Props) {
    return (
        <AppCard
            title={lang === "es" ? "Usuarios" : "Users"}
            subtitle={`${lang === "es" ? "Mostrando" : "Showing"} ${items.length} / ${total}`}
            action={
                <Button variant="contained" onClick={onCreate} disabled={loading}>
                    {lang === "es" ? "Nuevo usuario" : "New user"}
                </Button>
            }
        >
            <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 1fr) 180px 180px" },
                        gap: 1.25,
                    }}
                >
                    <TextField
                        size="small"
                        label={lang === "es" ? "Buscar" : "Search"}
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={lang === "es" ? "Nombre o email..." : "Name or email..."}
                    />
                    <TextField
                        select
                        size="small"
                        label={lang === "es" ? "Rol" : "Role"}
                        value={roleFilter}
                        onChange={(event) => onRoleFilterChange(event.target.value as RoleFilter)}
                    >
                        <MenuItem value="all">{lang === "es" ? "Todos" : "All"}</MenuItem>
                        <MenuItem value="admin">admin</MenuItem>
                        <MenuItem value="user">user</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label={lang === "es" ? "Estado" : "Status"}
                        value={activeFilter}
                        onChange={(event) => onActiveFilterChange(event.target.value as ActiveFilter)}
                    >
                        <MenuItem value="all">{lang === "es" ? "Todos" : "All"}</MenuItem>
                        <MenuItem value="active">{lang === "es" ? "Activos" : "Active"}</MenuItem>
                        <MenuItem value="inactive">{lang === "es" ? "Inactivos" : "Inactive"}</MenuItem>
                    </TextField>
                </Box>

                {loading ? <Typography variant="body2" color="text.secondary">{lang === "es" ? "Cargando usuarios..." : "Loading users..."}</Typography> : null}
                {error ? <Chip color="error" label={error} /> : null}

                <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{lang === "es" ? "Perfil" : "Profile"}</TableCell>
                                <TableCell>{lang === "es" ? "Nombre" : "Name"}</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>{lang === "es" ? "Rol" : "Role"}</TableCell>
                                <TableCell>{lang === "es" ? "Coaching" : "Coaching"}</TableCell>
                                <TableCell>Trainer</TableCell>
                                <TableCell>{lang === "es" ? "Estado" : "Status"}</TableCell>
                                <TableCell>{lang === "es" ? "Último acceso" : "Last login"}</TableCell>
                                <TableCell align="right">{lang === "es" ? "Acciones" : "Actions"}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9}>
                                        <AppEmptyState
                                            title={lang === "es" ? "Sin usuarios" : "No users"}
                                            description={lang === "es" ? "No hay usuarios que coincidan con los filtros." : "No users match the filters."}
                                            variant="inline"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((user) => {
                                    const coachMode = readCoachMode(user);
                                    const assignedTrainerId = readAssignedTrainer(user);
                                    const assignedTrainerUser = assignedTrainerId ? trainersById.get(assignedTrainerId) : undefined;
                                    const hasProfilePic = typeof user.profilePicUrl === "string" && user.profilePicUrl.trim().length > 0;

                                    return (
                                        <TableRow key={user.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Avatar
                                                        src={hasProfilePic ? user.profilePicUrl ?? undefined : undefined}
                                                        alt={user.name}
                                                        sx={{ width: 42, height: 42, fontWeight: 800 }}
                                                        slotProps={{ img: { referrerPolicy: "no-referrer" } }}
                                                    >
                                                        {getInitials(user.name)}
                                                    </Avatar>
                                                    {hasProfilePic ? (
                                                        <IconButton size="small" onClick={() => onOpenProfileImage(user)} aria-label="Ver foto">
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    ) : null}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>{user.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">id: {shortId(user.id)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{user.email}</Typography>
                                            </TableCell>
                                            <TableCell><Chip size="small" label={user.role} /></TableCell>
                                            <TableCell><Chip size="small" label={coachModeLabel(coachMode, lang)} /></TableCell>
                                            <TableCell>
                                                {coachMode === "TRAINEE" ? (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                            {assignedTrainerUser?.name ?? shortId(assignedTrainerId)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">{shortId(assignedTrainerId)}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="small" color={user.isActive ? "success" : "default"} label={user.isActive ? "Activo" : "Inactivo"} />
                                            </TableCell>
                                            <TableCell>{formatLastLogin(user.lastLoginAt, lang)}</TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
                                                    <Button size="small" variant="outlined" onClick={() => onEdit(user)}>{lang === "es" ? "Editar" : "Edit"}</Button>
                                                    <Button size="small" variant="outlined" color="warning" onClick={() => onDelete(user)}>{lang === "es" ? "Eliminar" : "Delete"}</Button>
                                                    <Button size="small" variant="contained" color="error" onClick={() => onPurge(user)}>{lang === "es" ? "Purgar" : "Purge"}</Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="caption" color="text.secondary">
                        {lang === "es" ? "Página" : "Page"} {page} / {totalPages} · {pageSize} {lang === "es" ? "por página" : "per page"}
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                        <Button variant="outlined" onClick={onPrevPage} disabled={page <= 1 || loading}>← {lang === "es" ? "Anterior" : "Previous"}</Button>
                        <Button variant="outlined" onClick={onNextPage} disabled={page >= totalPages || loading}>{lang === "es" ? "Siguiente" : "Next"} →</Button>
                    </Box>
                </Box>
            </Box>
        </AppCard>
    );
}
