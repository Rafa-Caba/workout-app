import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRegister } from "@/hooks/useRegister";
import type { ApiError } from "@/api/httpErrors";

const schema = z.object({
    name: z.string().min(1, "El nombre es obligatorio").max(120, "Máximo 120 caracteres"),
    email: z.string().email("Ingresa un email válido").max(254, "Email demasiado largo"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200, "Contraseña demasiado larga"),
    sex: z.enum(["male", "female", "other"]).nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation() as { state?: { from?: string } };
    const from = location.state?.from ?? "/protected/test";

    const registerMutation = useRegister();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "", password: "", sex: null },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            await registerMutation.mutateAsync({
                name: values.name,
                email: values.email,
                password: values.password,
                sex: values.sex ?? undefined,
            });
            toast.success("Cuenta creada");
            navigate(from, { replace: true });
        } catch (e) {
            const err = e as ApiError;
            toast.error(err.message ?? "No se pudo crear la cuenta", {
                description: err.status ? `HTTP ${err.status}` : undefined,
            });
        }
    };

    return (
        <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-0 sm:py-10 space-y-4">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
                <p className="text-sm text-muted-foreground">
                    Registrar vía <span className="font-mono">POST /api/auth/register</span>
                </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Nombre</label>
                    <input
                        className="w-full h-11 rounded-md border bg-background px-3 text-sm"
                        placeholder="Tu nombre"
                        autoComplete="name"
                        {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                        <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <input
                        className="w-full h-11 rounded-md border bg-background px-3 text-sm"
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
                        className="w-full h-11 rounded-md border bg-background px-3 text-sm"
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        {...form.register("password")}
                    />
                    {form.formState.errors.password && (
                        <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Sexo (opcional)</label>
                    <select
                        className="w-full h-11 rounded-md border bg-background px-3 text-sm"
                        {...form.register("sex")}
                    >
                        <option value="">Prefiero no decir</option>
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                    </select>
                    {form.formState.errors.sex && (
                        <p className="text-xs text-destructive">{form.formState.errors.sex.message as any}</p>
                    )}
                </div>

                <Button type="submit" disabled={registerMutation.isPending} className="w-full h-11">
                    {registerMutation.isPending ? "Creando..." : "Crear cuenta"}
                </Button>

                <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                        Tiene cuenta?{" "}
                        <Link to="/login" className="underline underline-offset-4">
                            Inicia sesión
                        </Link>
                        .
                    </p>
                </div>
            </form>
        </div>
    );
}
