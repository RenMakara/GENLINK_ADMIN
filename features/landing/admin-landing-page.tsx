"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  Compass,
  Download,
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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
const REN_MAKARA_IMAGE = `${BASE_PATH}/team/ren-makara.png`;
const SOKNY_ENAT_IMAGE = `${BASE_PATH}/team/sokny-enat.png`;

type TeamMember = {
  name: string;
  role: string;
  quote: string;
  github: string;
  initials: string;
  profile: string | null;
  accent: string;
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Ren Makara",
    role: "Full Stack Developer",
    quote: "Build with curiosity, ship with purpose.",
    github: "https://github.com/RenMakara",
    initials: "RM",
    profile: REN_MAKARA_IMAGE,
    accent: "from-emerald-200/30 via-emerald-400/10 to-cyan-300/10",
  },
  {
    name: "Heng Chansela",
    role: "Full Stack Developer",
    quote: "Every challenge is a chance to make something better.",
    github: "https://github.com/TommmyBoizzz",
    initials: "HC",
    profile: null,
    accent: "from-violet-200/30 via-violet-400/10 to-cyan-300/10",
  },
  {
    name: "Sokny Enat",
    role: "Full Stack Developer",
    quote: "Good technology should feel useful, human, and shared.",
    github: "https://github.com/E-Nat",
    initials: "SE",
    profile: SOKNY_ENAT_IMAGE,
    accent: "from-amber-200/30 via-amber-400/10 to-rose-300/10",
  },
  {
    name: "Chhaeng Sokuntheara",
    role: "Full Stack Developer",
    quote: "Keep learning, keep building, keep opening doors.",
    github: "https://github.com/rabengbek",
    initials: "CS",
    profile: null,
    accent: "from-cyan-200/30 via-cyan-400/10 to-emerald-300/10",
  },
];

const APP_SCREENS = [
  {
    label: "Home",
    src: `${BASE_PATH}/app-screens/genlink-home.png`,
    alt: "GenLink Home screen showing the feed, event discovery, and community navigation",
  },
  {
    label: "Level Up",
    src: `${BASE_PATH}/app-screens/genlink-level-up.png`,
    alt: "GenLink Level Up screen showing progress, habits, goals, and experience points",
  },
  {
    label: "Finance",
    src: `${BASE_PATH}/app-screens/genlink-finance.png`,
    alt: "GenLink Finance screen showing balance, quick actions, and monthly spending",
  },
  {
    label: "Quiz",
    src: `${BASE_PATH}/app-screens/genlink-quiz.png`,
    alt: "GenLink Quiz screen showing learning categories and quiz cards",
  },
] as const;

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
        <span className="block text-[1.05rem] font-semibold tracking-[-0.04em] text-foreground dark:text-white">GenLink</span>
        <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-primary/80 dark:text-emerald-200/70">
          Cambodia
        </span>
      </span>
    </span>
  );
}

function DownloadButton() {
  return (
    <a
      href="#download"
      className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-semibold text-[#08251f] shadow-[0_18px_35px_rgba(111,239,161,0.2)] transition hover:-translate-y-1 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061716]"
      aria-label="Download app, coming soon"
    >
      <Download className="size-4 transition group-hover:translate-y-0.5" aria-hidden />
      Download app
      <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
    </a>
  );
}

function AppPreview() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const screen = APP_SCREENS[activeScreen];

  useEffect(() => {
    if (isPaused || shouldReduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveScreen((current) => (current + 1) % APP_SCREENS.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused, shouldReduceMotion]);

  return (
    <div className="relative mx-auto w-full max-w-[510px] lg:mr-0">
      <div className="landing-preview-orbit absolute -left-10 top-1/2 size-24 -translate-y-1/2 rounded-full border border-emerald-200/15 sm:-left-14" aria-hidden />
      <div className="landing-preview-orbit landing-preview-orbit--delayed absolute -right-6 top-12 size-14 rounded-full border border-amber-200/20" aria-hidden />

      <div
        className="landing-phone relative mx-auto w-[min(100%,330px)] rotate-[3deg] rounded-[3rem] border border-white/30 bg-[#071617]/85 p-2 shadow-[0_44px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:mr-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <div
          id="app-screen-preview"
          role="tabpanel"
          aria-label={`${screen.label} screen preview`}
          className="relative aspect-[9/19.5] overflow-hidden rounded-[2.45rem] border border-white/10 bg-[#101716]"
        >
          <Image
            key={screen.src}
            src={screen.src}
            alt={screen.alt}
            fill
            sizes="(min-width: 1024px) 330px, 72vw"
            className="object-cover transition-opacity duration-500 motion-reduce:transition-none"
            priority={activeScreen === 0}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" aria-hidden />
        </div>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:pl-4" role="tablist" aria-label="GenLink app screens">
        {APP_SCREENS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={activeScreen === index}
            aria-controls="app-screen-preview"
            aria-label={`Show ${item.label} screen`}
            onClick={() => setActiveScreen(index)}
            className={`rounded-full border px-3 py-1.5 text-[0.65rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 motion-reduce:transition-none ${activeScreen === index ? "border-emerald-200/70 bg-emerald-200 text-[#08251f]" : "border-white/20 bg-white/[0.08] text-white/65 hover:border-white/40 hover:text-white"}`}
          >
            {item.label}
          </button>
        ))}
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
    <article className="group relative overflow-hidden rounded-[1.8rem] border border-border bg-card/70 p-6 transition duration-500 hover:-translate-y-2 hover:border-primary/30 hover:bg-card dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-white/20 dark:hover:bg-white/[0.08]">
      <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${feature.accent} opacity-70 blur-2xl transition duration-500 group-hover:opacity-100`} aria-hidden />
      <div className="relative flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl border border-border bg-primary/10 text-primary shadow-inner dark:border-white/10 dark:bg-white/10 dark:text-emerald-100"><Icon className="size-5" aria-hidden /></span>
        <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground/60 dark:text-white/25">{feature.number}</span>
      </div>
      <p className="relative mt-8 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-primary/80 dark:text-emerald-200/65">{feature.eyebrow}</p>
      <h3 className="relative mt-2 text-2xl font-semibold tracking-[-0.06em] text-foreground dark:text-white">{feature.title}</h3>
      <p className="relative mt-3 text-sm leading-6 text-muted-foreground dark:text-white/50">{feature.description}</p>
      <span className="relative mt-6 inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 transition group-hover:text-primary dark:text-white/70 dark:group-hover:text-emerald-200">Explore <ArrowUpRight className="size-3.5" aria-hidden /></span>
    </article>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-border bg-card/70 transition duration-500 hover:-translate-y-2 hover:border-primary/30 hover:bg-card dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-white/20 dark:hover:bg-white/[0.08]">
      <div className={`relative flex aspect-[1.12] items-end overflow-hidden bg-gradient-to-br ${member.accent} p-5`}>
        <div className="absolute -right-8 -top-10 size-40 rounded-full border border-white/15 bg-white/10 blur-2xl transition duration-500 group-hover:scale-125" aria-hidden />
        {member.profile ? (
          <Image
            src={member.profile}
            alt={`${member.name} profile`}
            fill
            sizes="(min-width: 1024px) 240px, 50vw"
            className="object-cover object-top transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative grid size-24 place-items-center rounded-[2rem] border border-primary/25 bg-primary/10 text-3xl font-semibold tracking-[-0.08em] text-foreground shadow-[0_20px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl dark:border-white/25 dark:bg-[#0a2420]/60 dark:text-white" aria-label={`${member.name} profile placeholder`}>
            {member.initials}
          </div>
        )}
        {!member.profile && <span className="absolute right-5 top-5 rounded-full border border-border bg-background/75 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-xl dark:border-white/15 dark:bg-[#071a19]/35 dark:text-white/55">Profile coming soon</span>}
      </div>
      <div className="p-5">
        <h4 className="text-lg font-semibold tracking-[-0.04em] text-foreground dark:text-white">{member.name}</h4>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-primary/80 dark:text-emerald-200/65">{member.role}</p>
        <blockquote className="mt-5 min-h-12 text-sm leading-6 text-muted-foreground dark:text-white/55">“{member.quote}”</blockquote>
        <a
          href={member.github}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground/75 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75 dark:hover:border-emerald-200/40 dark:hover:bg-emerald-200/10 dark:hover:text-emerald-100 dark:focus-visible:ring-emerald-200"
          aria-label={`Open ${member.name}'s GitHub profile`}
        >
          <span className="text-[0.62rem] font-bold tracking-[-0.08em]" aria-hidden>GH</span>
          GitHub
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </div>
    </article>
  );
}

export function AdminLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-background text-foreground selection:bg-emerald-200 selection:text-[#061716]">
      <a href="#home" className="sr-only z-[100] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#071a19]">Skip to content</a>

      <header className="landing-nav fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.35rem] border border-border bg-background/80 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur-2xl dark:border-white/15 dark:bg-[#061716]/65 sm:px-5">
          <Link href="/" aria-label="GenLink home" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-emerald-200 dark:focus-visible:ring-offset-[#061716]"><Brand /></Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item, index) => (
              <a key={item.href} href={item.href} className={`text-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-emerald-200 dark:focus-visible:ring-emerald-200 ${index === 0 ? "text-foreground dark:text-white" : "text-foreground/60 dark:text-white/55"}`}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="hidden items-center gap-2 text-xs font-medium text-muted-foreground lg:flex dark:text-white/40"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(132,255,190,0.9)] dark:bg-emerald-300" />For the next generation</span>
            <ThemeToggle />
            <Link href="/login" className="group inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-[#08251f] shadow-[0_10px_24px_rgba(111,239,161,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-[#061716]">
              Admin login <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button type="button" className="grid size-10 place-items-center rounded-xl border border-border bg-muted/60 text-foreground dark:border-white/15 dark:bg-white/5 dark:text-white" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="landing-mobile-nav" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="landing-mobile-nav" className="mx-auto mt-2 max-w-7xl rounded-[1.35rem] border border-border bg-background/95 p-3 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-[#061716]/90 md:hidden">
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/75 transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-emerald-200">{item.label}</a>
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

      <section id="features" className="relative scroll-mt-20 bg-background px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80 dark:text-emerald-200/70">A little more, every day</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-foreground sm:text-6xl dark:text-white">Built around the things <span className="text-muted-foreground/60 dark:text-white/40">that matter.</span></h2></div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground dark:text-white/45">Not another app asking for more of your attention. A gentle toolkit for turning intention into a life that feels more like yours.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{FEATURES.map((feature) => <FeatureCard key={feature.title} feature={feature} />)}</div>
        </div>
      </section>

      <section id="about" className="relative scroll-mt-20 overflow-hidden bg-muted px-6 py-24 sm:py-32 lg:px-8 dark:bg-[#0a201d]">
        <div className="absolute -right-40 top-0 size-[28rem] rounded-full bg-emerald-300/10 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80 dark:text-emerald-200/70">About GenLink</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-foreground sm:text-6xl dark:text-white">Technology with a <span className="text-primary dark:text-emerald-200">human pulse.</span></h2><p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground dark:text-white/55">GenLink is a place to make progress feel personal. We are designing for ambitious people in Cambodia and beyond — people who want useful tools, warmer communities, and more confidence in the road ahead.</p><a href="#download" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-emerald-200 dark:hover:text-emerald-100 dark:focus-visible:ring-emerald-200">Meet the GenLink idea <ArrowRight className="size-4" aria-hidden /></a></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ title: "Human first", body: "Useful beats noisy. Every detail should help you make a better next move.", icon: HeartHandshake }, { title: "Progress over perfection", body: "We celebrate consistency, curiosity, and the small wins that compound.", icon: TrendingUp }, { title: "Local context", body: "Built with Cambodia's pace, ambitions, and communities in mind.", icon: Landmark }, { title: "Open possibility", body: "Learning, opportunity, and connection should feel closer to everyone.", icon: Compass }].map(({ title, body, icon: Icon }) => <div key={title} className="rounded-[1.6rem] border border-border bg-card/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10 dark:text-emerald-200"><Icon className="size-5" aria-hidden /></span><h3 className="mt-7 text-lg font-semibold tracking-[-0.04em] text-foreground dark:text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/45">{body}</p></div>)}
          </div>
        </div>
        <div className="relative mx-auto mt-24 max-w-7xl sm:mt-32">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80 dark:text-emerald-200/70">The people behind the progress</p><h3 className="mt-4 text-3xl font-semibold tracking-[-0.07em] text-foreground sm:text-5xl dark:text-white">Meet the <span className="text-muted-foreground/60 dark:text-white/40">GenLink team.</span></h3></div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground dark:text-white/45">A small team building a more connected way to grow, learn, and find what comes next.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{TEAM_MEMBERS.map((member) => <TeamMemberCard key={member.name} member={member} />)}</div>
        </div>
      </section>

      <section id="download" className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="landing-download-panel mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-emerald-100/20 bg-gradient-to-br from-emerald-900 via-[#0a2a25] to-[#102b37] px-7 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.24)] sm:px-12 sm:py-16 lg:flex lg:items-end lg:justify-between lg:px-16">
          <div className="relative max-w-xl"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-200 text-[#09231e]"><Sparkles className="size-5" aria-hidden /></span><h2 className="mt-7 text-4xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">Make room for what is next.</h2><p className="mt-5 max-w-md text-base leading-7 text-white/55">The GenLink mobile experience is coming soon. Leave the noise behind and keep your next step close.</p></div>
          <div className="relative mt-10 flex lg:mt-0"><DownloadButton /></div>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-6 py-10 lg:px-8 dark:border-white/10 dark:bg-[#061716]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div><Link href="/" aria-label="GenLink home" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-emerald-200"><Brand /></Link><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground dark:text-white/35">Grow with intention. Learn in public. Find your people. Build what is next.</p></div>
          <div className="flex flex-col gap-4 sm:items-end"><nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><a href="#home" className="transition hover:text-primary dark:hover:text-emerald-200">Home</a><a href="#features" className="transition hover:text-primary dark:hover:text-emerald-200">Features</a><a href="#about" className="transition hover:text-primary dark:hover:text-emerald-200">About</a><Link href="/login" className="transition hover:text-primary dark:hover:text-emerald-200">Admin login</Link></nav><p className="text-xs text-muted-foreground/70 dark:text-white/25">© 2026 GenLink KH · Built for Cambodia, open to the world.</p></div>
        </div>
      </footer>
    </main>
  );
}
