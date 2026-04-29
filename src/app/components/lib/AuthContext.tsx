import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from './api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signin: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession() {
        try {
            const token = api.getAccessToken();
            if (token) {
                const { user } = await api.getSession();
                setUser(user);
            }
        } catch (error) {
            console.error('Session check failed:', error);
            api.logout();
        } finally {
            setLoading(false);
        }
    }

    async function signin(email: string, password: string) {
        const { user } = await api.signin(email, password);
        setUser(user);
    }

    async function signup(email: string, password: string, name: string) {
        const { user } = await api.signup(email, password, name);
        setUser(user);
    }

    function logout() {
        api.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, signin, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
