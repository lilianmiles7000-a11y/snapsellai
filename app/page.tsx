'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { ArrowRight, Check, Zap, Wand as Wand2, Image, Tag, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FAQS = [
  { q: 'How does SnapSell AI work?', a: 'You upload product photos. Our AI analyzes them using computer vision to identify the brand, category, condition, materials, and generates an optimized listing title, description, and price suggestions — all in under 30 seconds.' },
  { q: 'Which platforms are supported?', a: 'SnapSell AI generates listings optimized for Vinted, Leboncoin, Facebook Marketplace, and eBay. Each platform gets its own tailored copy and formatting.' },
  { q: 'What is Photo Studio?', a: 'Photo Studio is our AI-powered photo editor. It can remove backgrounds, replace them with clean white or marketplace-style backgrounds, enhance colors, improve brightness, sharpen details, and more.' },
  { q: 'Can I edit the generated listings?', a: 'Yes — every field is editable. You can tweak the title, description, price, category, and any other detail before copying or saving.' },
  { q: 'Is the Free plan really free?', a: 'Yes. No credit card required. You get 5 AI-generated listings per month. Upgrade to Pro for unlimited listings and all advanced features.' },
  { q: 'Can I cancel Pro at any time?', a: 'Absolutely. Cancel any time from your account settings. You keep Pro features until the end of your billing period.' },
];

const DEMO_STEPS = [
  { icon: Image, label: 'Upload', desc: 'Drop your product photo' },
  { icon: Wand2, label: 'Enhance', desc: 'AI improves your photo' },
  { icon: Tag, label: 'Generate', desc: 'Get a perfect listing' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSlider = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">SnapSell AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="gradient">Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary mb-6">
          <Zap className="h-3 w-3" />
          AI-powered in under 30 seconds
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Sell your items faster<br />
          <span className="gradient-text">with AI</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Upload photos. AI enhances them. Generates the perfect listing.<br className="hidden sm:block" />
          Ready in under 30 seconds.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button size="xl" variant="gradient" className="w-full sm:w-auto">
              Start Free — No credit card
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="xl" variant="outline" className="w-full sm:w-auto">
              See it in action
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">5 free listings/month · No card required</p>
      </section>

      {/* Demo Section */}
      <section id="demo" className="mx-auto max-w-6xl px-4 pb-24">
        {/* Steps */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {DEMO_STEPS.map((s, i) => (
            <div key={s.label} className="relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{i + 1}. {s.label}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              {i < 2 && (
                <div className="absolute -right-5 top-1/2 hidden -translate-y-1/2 sm:block">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Before/After Slider */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold">See the difference</h2>
            <p className="text-sm text-muted-foreground">Drag to compare original vs. AI-enhanced photo</p>
          </div>
          <div
            ref={sliderRef}
            className="relative mx-auto max-w-lg overflow-hidden rounded-xl select-none cursor-col-resize"
            style={{ aspectRatio: '4/3' }}
            onMouseMove={(e) => e.buttons === 1 && handleSlider(e)}
            onMouseDown={handleSlider}
            onTouchMove={handleSlider}
          >
            {/* Original */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Original product"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            {/* Enhanced (simulated with filter) */}
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Enhanced product"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: 'brightness(1.1) contrast(1.15) saturate(1.3)' }}
                draggable={false}
              />
            </div>
            <div className="absolute inset-y-0 w-0.5 bg-white shadow-xl" style={{ left: `${sliderPos}%` }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 4l-3 4 3 4M11 4l3 4-3 4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">Original</div>
            <div className="absolute bottom-2 right-2 rounded-md bg-primary/80 px-2 py-0.5 text-[10px] text-white">AI Enhanced</div>
          </div>

          {/* Generated listing preview */}
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">AI Generated Title</p>
                <h3 className="text-base font-semibold text-foreground">Nike Air Max 90 — Excellent Condition, Men's Size 42</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  Iconic Nike Air Max 90 in excellent condition. Clean white leather upper with classic Air cushioning. Worn only a few times — no yellowing, no scuffs. Original laces included.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Suggested price</p>
                <p className="text-2xl font-bold text-primary">€85</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Nike', 'Air Max 90', 'Sneakers', 'Men', 'White', 'Running', 'Vintage'].map((tag) => (
                <span key={tag} className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need to sell faster</h2>
            <p className="mt-3 text-muted-foreground">From photo to published listing in seconds.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'AI Photo Studio', desc: 'Remove backgrounds, enhance colors, sharpen details — all with one click.', icon: '🎨' },
              { title: 'Smart Listing Generator', desc: 'GPT-4 Vision analyzes your photos and writes compelling, platform-optimized listings.', icon: '✍️' },
              { title: 'Multi-Platform', desc: 'Optimized copy for Vinted, Leboncoin, Facebook Marketplace, and eBay.', icon: '🌐' },
              { title: '3 Price Tiers', desc: 'Get a quick sale price, suggested price, and premium price for every item.', icon: '💰' },
              { title: 'Edit & Customize', desc: 'Every field is editable. Tweak title, description, price before publishing.', icon: '✏️' },
              { title: 'Listing History', desc: 'All your listings saved and searchable. Never lose a draft.', icon: '📋' },
            ].map((f) => (
              <Card key={f.title} className="p-5">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Free */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Free</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-bold">€0</span>
                <span className="mb-1 text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Get started with AI-powered listing creation.</p>
              <ul className="mt-6 space-y-3">
                {['5 listings / month', 'Standard AI analysis', '4 platforms supported', '30-day history'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button variant="outline" className="w-full">Get started free</Button>
              </Link>
            </Card>

            {/* Pro */}
            <Card className="relative p-6 border-primary/40 bg-primary/3">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default" className="bg-gradient-primary text-white px-3">Most popular</Badge>
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-bold">€19</span>
                <span className="mb-1 text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Everything you need to sell at scale.</p>
              <ul className="mt-6 space-y-3">
                {[
                  'Unlimited listings',
                  'Unlimited AI analysis',
                  'HD photo enhancement',
                  'Background removal',
                  'Priority processing',
                  'Unlimited history',
                  'All future features',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button variant="gradient" className="w-full">
                  Start Pro — €19/month
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <button
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-5 pb-4 pt-3">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="flex justify-center gap-0.5 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-warning text-warning" />)}
          </div>
          <h2 className="text-3xl font-bold">Ready to sell faster?</h2>
          <p className="mt-3 text-muted-foreground">Join thousands of resellers using AI to save time and sell more.</p>
          <Link href="/signup" className="mt-8 inline-block">
            <Button size="xl" variant="gradient">
              Start Free Today
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required · 5 free listings/month</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-primary">
              <Wand2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">SnapSell AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 SnapSell AI. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
