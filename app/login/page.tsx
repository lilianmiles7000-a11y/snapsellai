'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Wand as Wand2, Mail, Lock, Eye, EyeOff, Loader as Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Mode = 'password' | 'magic';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const { signInWithEmail, signInWithGoogle, signInWithMagicLink } = useAuth();

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'magic') {
      const { error } = await signInWithMagicLink(email);
      setLoading(false);
      if (error) toast.error(error);
      else setMagicSent(true);
      return;
    }
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) toast.error(error);
    else router.push(next);
  };

  const onGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { setLoading(false); toast.error(error); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary glow-primary">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your SnapSell AI account</p>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          {magicSent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Sparkles className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">Check your email</p>
                <p className="mt-1 text-sm text-muted-foreground">We sent a magic link to <strong>{email}</strong></p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMagicSent(false)}>Try again</Button>
            </div>
          ) : (
            <>
              <Button variant="outline" className="w-full" onClick={onGoogle} disabled={loading}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              <div className="flex rounded-lg bg-muted p-1">
                {(['password', 'magic'] as Mode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={cn('flex-1 rounded-md py-1.5 text-xs font-medium transition-all', mode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
                    {m === 'password' ? 'Password' : 'Magic Link'}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" required />
                  </div>
                </div>
                {mode === 'password' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-10" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
                </Button>
              </form>
            </>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
