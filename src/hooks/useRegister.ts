import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/api/httpErrors";
import { register as registerApi } from "@/services/auth.service";
import { useAuthStore } from "@/state/auth.store";
import type { RegisterRequest, RegisterResponse } from "@/types/auth.types";

export function useRegister() {
    const setAuth = useAuthStore((s) => s.setAuth);

    return useMutation<RegisterResponse, ApiError, RegisterRequest>({
        mutationFn: (payload) => registerApi(payload),
        onSuccess: (data) => {
            setAuth({
                user: data.user,
                accessToken: data.tokens.accessToken,
                refreshToken: data.tokens.refreshToken,
            });
        },
    });
}
