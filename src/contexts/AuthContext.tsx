'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppUser {
    id: string | null;
    email: string;
    full_name?: string | null;
    photoURL?: string | null;
}

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AppUser>;
    signup: (email: string, password: string) => Promise<AppUser>;
    resendConfirmation: (email: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => ({} as AppUser),
    signup: async () => ({} as AppUser),
    resendConfirmation: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

const USER_STORAGE_KEY = 'intrakart-user';
const TOKEN_STORAGE_KEY = 'intrakart-access-token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const rawUser = localStorage.getItem(USER_STORAGE_KEY);
            if (rawUser) {
                setUser(JSON.parse(rawUser) as AppUser);
            }
        } catch (error) {
            console.error('Failed to restore auth session', error);
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    const persistSession = (data: { user: AppUser; access_token?: string | null }) => {
        setUser(data.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        if (data.access_token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
        }
    };

    const postAuth = async (path: '/api/auth/login' | '/api/auth/signup', email: string, password: string): Promise<AppUser> => {
        const response = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const raw = await response.text();
        let data: any = null;
        try {
            data = raw ? JSON.parse(raw) : null;
        } catch {
            throw new Error('Unexpected non-JSON response from auth API. Check one-host server/proxy setup.');
        }

        if (!response.ok) {
            throw new Error(data?.detail || data?.error || 'Authentication failed');
        }

        const authUser: AppUser = {
            id: data?.user?.id ?? null,
            email: data?.user?.email ?? email,
            full_name: data?.user?.full_name ?? null,
            photoURL: null,
        };

        persistSession({ user: authUser, access_token: data?.access_token ?? null });
        return authUser;
    };

    const login = async (email: string, password: string) => {
        try {
            return await postAuth('/api/auth/login', email, password);
        } catch (error) {
            throw error;
        }
    };

    const signup = async (email: string, password: string) => {
        try {
            return await postAuth('/api/auth/signup', email, password);
        } catch (error) {
            throw error;
        }
    };
    
    const resendConfirmation = async (email: string) => {
        const response = await fetch('/api/auth/resend-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'dummy' }), // password not needed but schema requires it
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.detail || 'Failed to resend confirmation email');
        }
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, resendConfirmation, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
