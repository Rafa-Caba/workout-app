import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/state/auth.store";
import type { LoginRequest } from "@/types/auth.types";

export function useLogin() {
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation({
        mutationFn: (payload: LoginRequest) => login(payload),
        onSuccess: (data) => {
            setAuth({
                user: data.user,
                accessToken: data.tokens.accessToken,
                refreshToken: data.tokens.refreshToken,
            });
        },
    });
}
