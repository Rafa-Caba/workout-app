import { api } from "@/api/axios";
import type { AuthUser } from "@/types/auth.types";
import type { UserProfileUpdateRequest } from "@/types/user.types";

export async function getMe(): Promise<AuthUser> {
    const res = await api.get("/users/me");
    return res.data as AuthUser;
}

export async function patchMe(payload: UserProfileUpdateRequest): Promise<AuthUser> {
    const res = await api.patch("/users/me", payload);
    return res.data as AuthUser;
}

export async function uploadMyProfilePic(file: File): Promise<AuthUser> {
    const fd = new FormData();
    fd.append("image", file);

    const res = await api.post("/users/me/profile-pic", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data as AuthUser;
}

export async function deleteMyProfilePic(): Promise<AuthUser> {
    const res = await api.delete("/users/me/profile-pic");
    return res.data as AuthUser;
}
