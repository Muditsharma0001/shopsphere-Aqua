export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER';
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
}
export interface AuthResponse {
    user: User;
    accessToken: string;
}
//# sourceMappingURL=index.d.ts.map