'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, signup, user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // Redirect if already logged in
    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    if (user) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
                toast({
                    title: 'Welcome back!',
                    description: 'You have successfully signed in.',
                });
            } else {
                await signup(email, password);
                toast({
                    title: 'Account created!',
                    description: 'You have successfully signed up.',
                });
            }
            router.push('/');
        } catch (error: any) {
            let errorMessage = 'An error occurred. Please try again.';
            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            }

            toast({
                variant: 'destructive',
                title: isLogin ? 'Login Error' : 'Signup Error',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-[100px]" />

            <Card className="w-full max-w-md bg-white/70 backdrop-blur-xl border-white/20 shadow-xl z-10">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </CardTitle>
                    <CardDescription>
                        {isLogin
                            ? 'Enter your email to sign in to your account'
                            : 'Enter your email to create your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                disabled={isLoading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2 mt-4">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                disabled={isLoading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full mt-6" type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            type="button"
                            className="text-primary hover:underline font-medium"
                            onClick={() => setIsLogin(!isLogin)}
                            disabled={isLoading}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
