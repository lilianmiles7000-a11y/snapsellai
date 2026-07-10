'use client';

import { useState, useEffect, Suspense } from 'react';
import { User, CreditCard, Bell, Shield, Wand as Wand2, Check, Loader as Loader2, LogOut, Trash2, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { updateProfile } from '@/services/profiles';
import { openBillingPortal } from '@/services/subscriptions';
import { fetchUserAISettings, upsertUserAISettings } from '@/services/enhancements';
import type { UserAISettings, EnhancementPreset, PreferredBackground } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

const PRESETS: { value: EnhancementPreset; label: string; desc: string }[] = [
  { value: 'none', label: 'None', desc: 'No auto enhancement' },
  { value: 'enhance_colors', label: 'Enhance Colors', desc: 'Boost vibrancy on every photo' },
  { value: 'white_background', label: 'White Background', desc: 'Clean white studio background' },
  { value: 'marketplace_background', label: 'Marketplace BG', desc: 'Neutral gradient background' },
];

const BACKGROUNDS: { value: PreferredBackground; label: string }[] = [
  { value: 'original', label: 'Keep original' },
  { value: 'white', label: 'White' },
  { value: 'marketplace', label: 'Marketplace gradient' },
  { value: 'transparent', label: 'Transparent (PNG)' },
];

function SettingsContent() {
  const { profile, signOut, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') ?? 'profile';

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [aiSettings, setAISettings] = useState<UserAISettings | null>(null);
  const [aiSaving, setAISaving] = useState(false);
  const [notifications, setNotifications] = useState({ emailReady: true, emailCredits: true, productUpdates: false });

  useEffect(() => {
    if (profile) fetchUserAISettings(profile.id).then((s) => s && setAISettings(s));
  }, [profile]);

  const initials = (profile?.full_name || profile?.email || 'U').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  const onSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await updateProfile(profile.id, { full_name: fullName });
    await refreshProfile();
    setSaving(false);
    toast.success('Profile updated');
  };

  const onOpenPortal = async () => {
    setPortalLoading(true);
    const { url, error } = await openBillingPortal();
    setPortalLoading(false);
    if (url) window.location.href = url;
    else toast.info(error ?? 'Billing portal not configured yet.');
  };

  const onSaveAI = async () => {
    if (!profile || !aiSettings) return;
    setAISaving(true);
    const saved = await upsertUserAISettings(profile.id, aiSettings);
    if (saved) setAISettings(saved);
    setAISaving(false);
    toast.success('AI settings saved');
  };

  const patchAI = (patch: Partial<UserAISettings>) =>
    setAISettings((prev) => prev ? { ...prev, ...patch } : prev);

  const onDeleteAccount = () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    toast.error('Account deletion requires contacting support. Please email support@snapsell.ai');
  };

  const onExportData = () => toast.info('Data export coming soon.');

  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, billing and preferences.</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Billing</TabsTrigger>
          <TabsTrigger value="ai-studio" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" />AI Studio</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-1">Profile information</h3>
            <p className="text-sm text-muted-foreground mb-6">Update your personal details.</p>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">Change photo</Button>
            </div>
            <Separator className="mb-6" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={profile?.email ?? ''} disabled className="opacity-60" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={onSaveProfile} disabled={saving} className="bg-gradient-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Account</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
              <Button variant="outline" onClick={() => signOut()} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />Sign out
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">Current plan</h3>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={profile?.plan === 'pro' ? 'success' : 'outline'} className="capitalize">{profile?.plan ?? 'free'}</Badge>
                  <span className="text-sm text-muted-foreground">{profile?.credits_remaining ?? 0} / {profile?.credits_total ?? 5} credits remaining</span>
                </div>
              </div>
              {profile?.plan !== 'pro' && (
                <Button asChild variant="gradient" size="sm"><a href="/pricing">Upgrade to Pro</a></Button>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-1">Billing &amp; invoices</h3>
            <p className="text-sm text-muted-foreground mb-4">View invoices and manage your subscription via Stripe.</p>
            <Button onClick={onOpenPortal} disabled={portalLoading} variant="outline">
              {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Open billing portal
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="ai-studio" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Wand2 className="h-5 w-5 text-primary" /></div>
              <div>
                <h3 className="text-base font-semibold">AI Photo Studio</h3>
                <p className="text-sm text-muted-foreground">Configure how AI enhances your photos.</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Auto-enhance after upload</p>
                <p className="text-xs text-muted-foreground">Apply default preset automatically.</p>
              </div>
              <Switch checked={aiSettings?.auto_enhance ?? false} onCheckedChange={(v) => patchAI({ auto_enhance: v })} />
            </div>
            <Separator />
            <div className="py-4">
              <p className="text-sm font-medium mb-3">Default enhancement preset</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button key={p.value} onClick={() => patchAI({ default_preset: p.value })}
                    className={cn('rounded-lg border p-3 text-left transition-all', aiSettings?.default_preset === p.value ? 'border-primary bg-primary/5' : 'border-border hover:border-border')}>
                    <p className="text-xs font-medium">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="py-4">
              <p className="text-sm font-medium mb-3">Preferred background</p>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.map((b) => (
                  <button key={b.value} onClick={() => patchAI({ preferred_background: b.value })}
                    className={cn('rounded-lg border p-3 text-left text-xs font-medium transition-all', aiSettings?.preferred_background === b.value ? 'border-primary bg-primary/5' : 'border-border hover:border-border')}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={onSaveAI} disabled={aiSaving || !aiSettings} className="bg-gradient-primary">
                {aiSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save AI settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-1">Email notifications</h3>
            <p className="text-sm text-muted-foreground mb-6">Choose what we email you about.</p>
            <div className="space-y-1">
              {[
                { key: 'emailReady' as const, title: 'Listing ready', desc: 'Notified when an AI listing is generated.' },
                { key: 'emailCredits' as const, title: 'Credits running low', desc: 'Alert when 20% credits remain.' },
                { key: 'productUpdates' as const, title: 'Product updates', desc: 'News about new features.' },
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-6">Privacy &amp; data</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Export my data</p>
                  <p className="text-xs text-muted-foreground">Download all your listings and account data.</p>
                </div>
                <Button variant="outline" size="sm" onClick={onExportData}>
                  <Download className="h-3.5 w-3.5" />Export
                </Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account. Cannot be undone.</p>
                </div>
                <Button variant="outline" size="sm" onClick={onDeleteAccount} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />Delete
                </Button>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Shield className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm font-medium">Data security</p>
                <p className="text-xs text-muted-foreground">Your photos and data are encrypted at rest and in transit.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <SettingsContent />
    </Suspense>
  );
}
