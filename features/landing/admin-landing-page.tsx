"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  Compass,
  HeartHandshake,
  Landmark,
  Menu,
  Play,
  Sparkles,
  Sprout,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import { env } from "@/lib/config/env";

const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
] as const;

type Feature = {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  number: string;
};

const FEATURES: Feature[] = [
  {
    title: "Grow",
    eyebrow: "Progress with purpose",
    description: "Make small steps visible, build better habits, and keep your momentum in one calm space.",
    icon: Sprout,
    accent: "from-emerald-300/30 to-emerald-500/5 text-emerald-200",
    number: "01",
  },
  {
    title: "Learn",
    eyebrow: "Skills for the real world",
    description: "Discover practical lessons, ideas, and resources that move with your goals and your pace.",
    icon: BookOpen,
    accent: "from-cyan-300/30 to-cyan-500/5 text-cyan-200",
    number: "02",
  },
  {
    title: "Community",
    eyebrow: "Never grow alone",
    description: "Find people who understand the journey, share what you know, and make meaningful connections.",
    icon: UsersRound,
    accent: "from-violet-300/30 to-violet-500/5 text-violet-200",
    number: "03",
  },
  {
    title: "Finance",
    eyebrow: "Confidence for tomorrow",
    description: "Build a clearer relationship with money through simple tools, practical knowledge, and honest progress.",
    icon: WalletCards,
    accent: "from-amber-300/30 to-amber-500/5 text-amber-200",
    number: "04",
  },
  {
    title: "Opportunity",
    eyebrow: "Open the next door",
    description: "Spot scholarships, events, challenges, and possibilities that help your ambition become action.",
    icon: Briefcase,
    accent: "from-rose-300/30 to-rose-500/5 text-rose-200",
    number: "05",
  },
];

const BASE_PATH = env.NEXT_PUBLIC_BASE_PATH || "";
const LOGO_SRC = `${BASE_PATH}/genlink_logo.png`;
const HERO_SRC = `${BASE_PATH}/angkor-wat-hero.png`;

function Brand() {
  return (
    <span className="flex items-center gap-3">
      <Image
        src={LOGO_SRC}
        alt="GenLink KH"
        width={40}
        height={40}
        className="size-10 rounded-[13px] object-contain shadow-[0_0_28px_rgba(132,255,190,0.22)]"
        priority
      />
      <span className="leading-none">
        <span className="block text-[1.05rem] font-semibold tracking-[-0.04em] text-white">GenLink</span>
        <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
          Cambodia
        </span>
      </span>
    </span>
  );
}

function StoreBadge({ store, detail }: { store: string; detail: string }) {
  return (
    <a
      href="#download"
      className="group flex min-w-[164px] items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-left shadow-[0_12px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-200/50 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071a19]"
      aria-label={`${store} download listing, coming soon`}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-white text-sm font-bold text-[#0a2521] shadow-inner">
        {store === "App Store" ? "" : "▶"}
      </span>
      <span>
        <span className="block text-[0.58rem] font-medium uppercase tracking-[0.18em] text-white/50">{detail}</span>
        <span className="mt-0.5 block text-sm font-semibold text-white">{store}</span>
      </span>
      <ArrowUpRight className="ml-auto size-4 text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-200" aria-hidden />
    </a>
  );
}

function AppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[510px] lg:mr-0">
      <div className="landing-preview-orbit absolute -left-10 top-1/2 size-24 -translate-y-1/2 rounded-full border border-emerald-200/15 sm:-left-14" aria-hidden />
      <div className="landing-preview-orbit landing-preview-orbit--delayed absolute -right-6 top-12 size-14 rounded-full border border-amber-200/20" aria-hidden />

      <div className="landing-phone landing-glass relative mx-auto w-[min(100%,360px)] rotate-[3deg] rounded-[3rem] border border-white/35 bg-[#071617]/80 p-2 shadow-[0_44px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:mr-4">
        <div className="overflow-hidden rounded-[2.45rem] border border-white/10 bg-[#102a27] px-5 pb-7 pt-4">
          <div className="flex items-center justify-between text-[0.62rem] font-medium text-white/55">
            <span>9:41</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-300" /> GenLink</span>
          </div>

          <div className="mt-7 flex items-end justify-between">
            <div>
              <p className="text-xs text-emerald-100/55">Good morning, Makara</p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.05em] text-white">Your week, in motion.</p>
            </div>
            <div className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/10">
              <Sparkles className="size-4 text-amber-200" aria-hidden />
            </div>
          </div>

          <div className="mt-6 rounded-[1.45rem] bg-gradient-to-br from-emerald-200 to-emerald-500 p-4 text-[#09231e] shadow-[0_16px_35px_rgba(58,205,133,0.22)]">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Growth streak</span>
              <TrendingUp className="size-4" aria-hidden />
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-[-0.08em]">07 <span className="text-sm tracking-normal">days</span></p>
            <div className="mt-4 flex items-end gap-1.5" aria-label="Seven-day progress chart">
              {[30, 45, 34, 60, 52, 72, 92].map((height, index) => (
                <span key={index} className="flex-1 rounded-full bg-[#0b5b3b]/25" style={{ height: `${height / 2}px` }} />
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Learn", value: "12 min", icon: BookOpen },
              { label: "Balance", value: "$420", icon: WalletCards },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.07] p-3">
                <Icon className="size-4 text-emerald-200" aria-hidden />
                <p className="mt-5 text-[0.65rem] text-white/50">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.07] p-3">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-300/15 text-amber-200"><Compass className="size-4" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-white">New opportunity nearby</span><span className="mt-1 block text-[0.65rem] text-white/45">Phnom Penh · 2 days left</span></span>
            <ArrowRight className="size-4 text-white/45" aria-hidden />
          </div>
        </div>
      </div>

      <div className="landing-glass absolute -bottom-5 left-0 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.1] px-4 py-3 shadow-2xl backdrop-blur-xl sm:-left-9">
        <span className="grid size-9 place-items-center rounded-xl bg-emerald-300/20 text-emerald-100"><Check className="size-4" aria-hidden /></span>
        <span><span className="block text-xs font-semibold text-white">One small win</span><span className="mt-0.5 block text-[0.65rem] text-white/50">is still a win.</span></span>
      </div>

      <div className="landing-glass absolute -right-2 top-20 hidden items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.1] px-4 py-3 shadow-2xl backdrop-blur-xl sm:flex">
        <span className="grid size-9 place-items-center rounded-xl bg-violet-300/20 text-violet-100"><HeartHandshake className="size-4" aria-hidden /></span>
        <span><span className="block text-xs font-semibold text-white">2 new connections</span><span className="mt-0.5 block text-[0.65rem] text-white/50">in your circle</span></span>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <article className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.045] p-6 transition duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[0.08]">
      <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${feature.accent} opacity-70 blur-2xl transition duration-500 group-hover:opacity-100`} aria-hidden />
      <div className="relative flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-emerald-100 shadow-inner"><Icon className="size-5" aria-hidden /></span>
        <span className="text-xs font-semibold tracking-[0.16em] text-white/25">{feature.number}</span>
      </div>
      <p className="relative mt-8 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-emerald-200/65">{feature.eyebrow}</p>
      <h3 className="relative mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">{feature.title}</h3>
      <p className="relative mt-3 text-sm leading-6 text-white/50">{feature.description}</p>
      <span className="relative mt-6 inline-flex items-center gap-1 text-xs font-semibold text-white/70 transition group-hover:text-emerald-200">Explore <ArrowUpRight className="size-3.5" aria-hidden /></span>
    </article>
  );
}

export function AdminLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#061716] text-white selection:bg-emerald-200 selection:text-[#061716]">
      <a href="#home" className="sr-only z-[100] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#071a19]">Skip to content</a>

      <header className="landing-nav fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.35rem] border border-white/15 bg-[#061716]/65 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-5">
          <Link href="/" aria-label="GenLink home" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061716]"><Brand /></Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item, index) => (
              <a key={item.href} href={item.href} className={`text-sm transition hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 ${index === 0 ? "text-white" : "text-white/55"}`}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="hidden items-center gap-2 text-xs font-medium text-white/40 lg:flex"><span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(132,255,190,0.9)]" />For the next generation</span>
            <Link href="/login" className="group inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-[#08251f] shadow-[0_10px_24px_rgba(111,239,161,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061716]">
              Admin login <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <button type="button" className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white md:hidden" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="landing-mobile-nav" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>

        {menuOpen && (
          <div id="landing-mobile-nav" className="mx-auto mt-2 max-w-7xl rounded-[1.35rem] border border-white/15 bg-[#061716]/90 p-3 shadow-2xl backdrop-blur-2xl md:hidden">
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">{item.label}</a>
              ))}
              <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#08251f]">Admin login <ArrowUpRight className="size-4" aria-hidden /></Link>
            </nav>
          </div>
        )}
      </header>

      <section id="home" className="relative isolate min-h-[850px] scroll-mt-24 overflow-hidden pt-32 sm:min-h-[920px] sm:pt-40">
        <Image src={HERO_SRC} alt="Angkor Wat at sunrise reflected in calm water" fill priority sizes="100vw" className="-z-30 object-cover object-center" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(3,20,19,0.96)_0%,rgba(3,20,19,0.78)_34%,rgba(3,20,19,0.22)_72%,rgba(3,20,19,0.48)_100%)]" aria-hidden />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(0deg,#061716_0%,transparent_28%,rgba(6,23,22,0.08)_100%)]" aria-hidden />
        <div className="landing-hero-glow absolute -left-32 top-24 -z-10 size-96 rounded-full bg-emerald-300/10 blur-3xl" aria-hidden />

        <div className="mx-auto flex max-w-7xl flex-col px-6 pb-24 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:pb-32">
          <div className="max-w-2xl flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100/25 bg-emerald-950/35 px-3 py-1.5 text-xs font-semibold text-emerald-100/80 backdrop-blur-xl"><Sparkles className="size-3.5 text-amber-200" aria-hidden /> Made for your next chapter</div>
            <h1 className="mt-7 max-w-[720px] text-5xl font-semibold leading-[0.98] tracking-[-0.08em] text-white sm:text-7xl lg:text-[5.6rem]">Your next chapter <span className="text-emerald-200">starts here.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">GenLink brings the pieces of a meaningful life closer together — learn something useful, meet your people, manage your money, and find the opportunity that moves you forward.</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#features" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-[#08251f] shadow-[0_18px_35px_rgba(111,239,161,0.2)] transition hover:-translate-y-1 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061716]">Explore the experience <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></a>
              <a href="#download" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.08] px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061716]"><Play className="size-4 fill-current" aria-hidden /> See the app</a>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-5 border-t border-white/15 pt-5">
              {[["5", "ways to move forward"], ["1", "space for your whole journey"], ["∞", "possibilities ahead"]].map(([value, label]) => <div key={label}><p className="text-2xl font-semibold tracking-[-0.06em] text-white sm:text-3xl">{value}</p><p className="mt-1 max-w-[120px] text-[0.65rem] leading-4 text-white/45">{label}</p></div>)}
            </div>
          </div>

          <div className="mt-16 flex-1 lg:mt-4"><AppPreview /></div>
        </div>

        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-white/40 sm:flex"><span className="h-px w-10 bg-white/25" /> Scroll to explore <ChevronDown className="size-3.5 animate-bounce" aria-hidden /></div>
      </section>

      <section id="features" className="relative scroll-mt-20 bg-[#061716] px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/70">A little more, every day</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">Built around the things <span className="text-white/40">that matter.</span></h2></div>
            <p className="max-w-sm text-sm leading-6 text-white/45">Not another app asking for more of your attention. A gentle toolkit for turning intention into a life that feels more like yours.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{FEATURES.map((feature) => <FeatureCard key={feature.title} feature={feature} />)}</div>
        </div>
      </section>

      <section id="about" className="relative scroll-mt-20 overflow-hidden bg-[#0a201d] px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute -right-40 top-0 size-[28rem] rounded-full bg-emerald-300/10 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/70">Rooted here. Ready anywhere.</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">Technology with a <span className="text-emerald-200">human pulse.</span></h2><p className="mt-6 max-w-lg text-base leading-8 text-white/55">GenLink is a place to make progress feel personal. We are designing for ambitious people in Cambodia and beyond — people who want useful tools, warmer communities, and more confidence in the road ahead.</p><a href="#download" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">Meet the GenLink idea <ArrowRight className="size-4" aria-hidden /></a></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ title: "Human first", body: "Useful beats noisy. Every detail should help you make a better next move.", icon: HeartHandshake }, { title: "Progress over perfection", body: "We celebrate consistency, curiosity, and the small wins that compound.", icon: TrendingUp }, { title: "Local context", body: "Built with Cambodia's pace, ambitions, and communities in mind.", icon: Landmark }, { title: "Open possibility", body: "Learning, opportunity, and connection should feel closer to everyone.", icon: Compass }].map(({ title, body, icon: Icon }) => <div key={title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-emerald-200"><Icon className="size-5" aria-hidden /></span><h3 className="mt-7 text-lg font-semibold tracking-[-0.04em] text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{body}</p></div>)}
          </div>
        </div>
      </section>

      <section id="download" className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="landing-download-panel mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-emerald-100/20 bg-gradient-to-br from-emerald-900 via-[#0a2a25] to-[#102b37] px-7 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.24)] sm:px-12 sm:py-16 lg:flex lg:items-end lg:justify-between lg:px-16">
          <div className="relative max-w-xl"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-200 text-[#09231e]"><Sparkles className="size-5" aria-hidden /></span><h2 className="mt-7 text-4xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">Make room for what is next.</h2><p className="mt-5 max-w-md text-base leading-7 text-white/55">The GenLink mobile experience is coming soon. Leave the noise behind and keep your next step close.</p></div>
          <div className="relative mt-10 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col xl:flex-row"><StoreBadge store="App Store" detail="Download on the" /><StoreBadge store="Google Play" detail="Get it on" /></div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#061716] px-6 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div><Link href="/" aria-label="GenLink home" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"><Brand /></Link><p className="mt-4 max-w-xs text-sm leading-6 text-white/35">Grow with intention. Learn in public. Find your people. Build what is next.</p></div>
          <div className="flex flex-col gap-4 sm:items-end"><nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/45"><a href="#home" className="transition hover:text-emerald-200">Home</a><a href="#features" className="transition hover:text-emerald-200">Features</a><a href="#about" className="transition hover:text-emerald-200">About</a><Link href="/login" className="transition hover:text-emerald-200">Admin login</Link></nav><p className="text-xs text-white/25">© 2026 GenLink KH · Built for Cambodia, open to the world.</p></div>
        </div>
      </footer>
    </main>
  );
}
