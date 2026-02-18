import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/useLogin";
import type { ApiError } from "@/api/httpErrors";

const schema = z.object({
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation() as { state?: { from?: string } };
    const from = location.state?.from ?? "/";

    const loginMutation = useLogin();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            await loginMutation.mutateAsync(values);
            toast.success("Sesión iniciada");
            navigate(from, { replace: true });
        } catch (e) {
            const err = e as ApiError;
            toast.error(err.message ?? "No se pudo iniciar sesión", {
                description: err.status ? `HTTP ${err.status}` : undefined,
            });
        }
    };

    return (
        <div className="min-h-[calc(100dvh-2rem)] flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md space-y-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
                    {/* <p className="text-sm text-muted-foreground">
                        Autenticar vía <span className="font-mono">POST /api/auth/login</span>
                    </p> */}
                </div>

                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="rounded-xl border bg-card p-4 sm:p-5 space-y-4"
                >
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="tu@email.com"
                            autoComplete="email"
                            {...form.register("email")}
                        />
                        {form.formState.errors.email && (
                            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Contraseña</label>
                        <input
                            type="password"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...form.register("password")}
                        />
                        {form.formState.errors.password && (
                            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <Button type="submit" disabled={loginMutation.isPending} className="w-full">
                        {loginMutation.isPending ? "Iniciando..." : "Entrar"}
                    </Button>

                    <div className="text-xs text-muted-foreground flex items-start justify-between gap-2">
                        <span className="leading-relaxed">
                            Después del login serás redirigido a <span className="font-mono">{from}</span>.
                        </span>
                    </div>

                    <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                            No tienes cuenta?{" "}
                            <Link to="/register" className="underline underline-offset-4">
                                Click aquí para crearla
                            </Link>
                            .
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
