// /src/pages/LoginPage.tsx
// MUI login page connected to the existing auth hook and router redirect flow.
// Includes a password visibility toggle with accessible labels.

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppCard } from "@/components/mui/AppCard";
import { useLogin } from "@/hooks/useLogin";
import type { ApiError } from "@/api/httpErrors";

const schema = z.object({
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormValues = z.infer<typeof schema>;

type LoginLocationState = {
    from?: string;
} | null;

/**
 * Returns the API error message when available.
 */
function getErrorMessage(error: unknown, fallback: string): string {
    const apiError = error as Partial<ApiError>;

    return typeof apiError.message === "string" &&
        apiError.message.trim().length > 0
        ? apiError.message
        : fallback;
}

/**
 * Returns the HTTP status from an API error when available.
 */
function getErrorStatus(error: unknown): number | undefined {
    const apiError = error as Partial<ApiError>;

    return typeof apiError.status === "number"
        ? apiError.status
        : undefined;
}

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const state = location.state as LoginLocationState;
    const from = state?.from ?? "/";

    const loginMutation = useLogin();

    const [showPassword, setShowPassword] = React.useState<boolean>(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    /**
     * Toggles the password field between visible and hidden.
     */
    function handleTogglePasswordVisibility(): void {
        setShowPassword((currentValue) => !currentValue);
    }

    /**
     * Prevents the password toggle button from taking focus away
     * from the password input.
     */
    function handlePasswordMouseDown(
        event: React.MouseEvent<HTMLButtonElement>,
    ): void {
        event.preventDefault();
    }

    async function onSubmit(values: FormValues): Promise<void> {
        try {
            await loginMutation.mutateAsync(values);

            toast.success("Sesión iniciada");
            navigate(from, { replace: true });
        } catch (error: unknown) {
            const status = getErrorStatus(error);

            toast.error(
                getErrorMessage(error, "No se pudo iniciar sesión"),
                {
                    description: status ? `HTTP ${status}` : undefined,
                },
            );
        }
    }

    return (
        <Box
            sx={{
                minHeight: "calc(100dvh - 180px)",
                display: "grid",
                placeItems: "center",
                px: { xs: 0, sm: 2 },
                py: { xs: 2, md: 5 },
            }}
        >
            <Box sx={{ width: "100%", maxWidth: 460 }}>
                <AppCard padding="lg" sx={{ mx: 2 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{ fontWeight: 850 }}
                            >
                                Iniciar sesión
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.75 }}
                            >
                                Entra para revisar tus entrenamientos, sueño,
                                cardio y progreso.
                            </Typography>
                        </Box>

                        {from !== "/" ? (
                            <Alert severity="info" variant="outlined">
                                Después del login serás redirigido a {from}.
                            </Alert>
                        ) : null}

                        <Box
                            component="form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            noValidate
                        >
                            <Stack spacing={2}>
                                <TextField
                                    label="Email"
                                    placeholder="tu@email.com"
                                    autoComplete="email"
                                    fullWidth
                                    error={Boolean(
                                        form.formState.errors.email,
                                    )}
                                    helperText={
                                        form.formState.errors.email?.message
                                    }
                                    {...form.register("email")}
                                />

                                <TextField
                                    type={
                                        showPassword ? "text" : "password"
                                    }
                                    label="Contraseña"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    fullWidth
                                    error={Boolean(
                                        form.formState.errors.password,
                                    )}
                                    helperText={
                                        form.formState.errors.password?.message
                                    }
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        type="button"
                                                        edge="end"
                                                        aria-label={
                                                            showPassword
                                                                ? "Ocultar contraseña"
                                                                : "Mostrar contraseña"
                                                        }
                                                        aria-pressed={
                                                            showPassword
                                                        }
                                                        onClick={
                                                            handleTogglePasswordVisibility
                                                        }
                                                        onMouseDown={
                                                            handlePasswordMouseDown
                                                        }
                                                    >
                                                        {showPassword ? (
                                                            <VisibilityOffIcon />
                                                        ) : (
                                                            <VisibilityIcon />
                                                        )}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                    {...form.register("password")}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={loginMutation.isPending}
                                >
                                    {loginMutation.isPending
                                        ? "Iniciando..."
                                        : "Entrar"}
                                </Button>
                            </Stack>
                        </Box>

                        {/* <Typography variant="body2" color="text.secondary">
                            ¿No tienes cuenta?{" "}
                            <RouterLink
                                to="/register"
                                style={{
                                    color: "inherit",
                                    fontWeight: 800,
                                    textDecoration: "underline",
                                    textUnderlineOffset: 4,
                                }}
                            >
                                Crear cuenta
                            </RouterLink>
                        </Typography> */}
                    </Stack>
                </AppCard>
            </Box>
        </Box>
    );
}