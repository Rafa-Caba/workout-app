// /src/pages/RegisterPage.tsx
// MUI register page connected to the existing register hook.
// Includes a password visibility toggle with accessible labels.

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
    Link as RouterLink,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { toast } from "sonner";

import { AppCard } from "@/components/mui/AppCard";
import { useRegister } from "@/hooks/useRegister";
import type { ApiError } from "@/api/httpErrors";

const schema = z.object({
    name: z
        .string()
        .min(1, "El nombre es obligatorio")
        .max(120, "Máximo 120 caracteres"),
    email: z
        .string()
        .email("Ingresa un email válido")
        .max(254, "Email demasiado largo"),
    password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(200, "Contraseña demasiado larga"),
    sex: z.enum(["male", "female", "other", ""]).optional(),
});

type FormValues = z.infer<typeof schema>;

type RegisterLocationState = {
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

export function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const state = location.state as RegisterLocationState;
    const from = state?.from ?? "/";

    const registerMutation = useRegister();

    const [showPassword, setShowPassword] = React.useState<boolean>(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            sex: "",
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
            await registerMutation.mutateAsync({
                name: values.name,
                email: values.email,
                password: values.password,
                sex:
                    values.sex && values.sex.length > 0
                        ? values.sex
                        : undefined,
            });

            toast.success("Cuenta creada");
            navigate(from, { replace: true });
        } catch (error: unknown) {
            const status = getErrorStatus(error);

            toast.error(
                getErrorMessage(error, "No se pudo crear la cuenta"),
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
            <Box sx={{ width: "100%", maxWidth: 520 }}>
                <AppCard padding="lg" sx={{ mx: 2 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{ fontWeight: 850 }}
                            >
                                Crear cuenta
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.75 }}
                            >
                                Crea tu usuario para comenzar a registrar
                                entrenamiento y sueño.
                            </Typography>
                        </Box>

                        <Box
                            component="form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            noValidate
                        >
                            <Stack spacing={2}>
                                <TextField
                                    label="Nombre"
                                    placeholder="Tu nombre"
                                    autoComplete="name"
                                    fullWidth
                                    error={Boolean(
                                        form.formState.errors.name,
                                    )}
                                    helperText={
                                        form.formState.errors.name?.message
                                    }
                                    {...form.register("name")}
                                />

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
                                    placeholder="Mínimo 8 caracteres"
                                    autoComplete="new-password"
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

                                <TextField
                                    select
                                    label="Sexo opcional"
                                    fullWidth
                                    error={Boolean(
                                        form.formState.errors.sex,
                                    )}
                                    helperText={
                                        form.formState.errors.sex?.message
                                    }
                                    defaultValue=""
                                    {...form.register("sex")}
                                >
                                    <MenuItem value="">
                                        Prefiero no decir
                                    </MenuItem>
                                    <MenuItem value="male">
                                        Masculino
                                    </MenuItem>
                                    <MenuItem value="female">
                                        Femenino
                                    </MenuItem>
                                    <MenuItem value="other">
                                        Otro
                                    </MenuItem>
                                </TextField>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={registerMutation.isPending}
                                >
                                    {registerMutation.isPending
                                        ? "Creando..."
                                        : "Crear cuenta"}
                                </Button>
                            </Stack>
                        </Box>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            ¿Ya tienes cuenta?{" "}
                            <RouterLink
                                to="/login"
                                style={{
                                    color: "inherit",
                                    fontWeight: 800,
                                    textDecoration: "underline",
                                    textUnderlineOffset: 4,
                                }}
                            >
                                Iniciar sesión
                            </RouterLink>
                        </Typography>
                    </Stack>
                </AppCard>
            </Box>
        </Box>
    );
}