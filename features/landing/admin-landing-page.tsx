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
  ChevronDown,
  Compass,
  Download,
  GraduationCap,
  HeartHandshake,
  Infinity,
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
const LOGO_SRC = `${BASE_PATH}/genlink_logo_dark.png`;
const HERO_SRC = `${BASE_PATH}/angkor-wat-hero.png`;
const REN_MAKARA_IMAGE = `${BASE_PATH}/team/ren-makara.png`;
const SOKNY_ENAT_IMAGE = `${BASE_PATH}/team/sokny-enat.png`;
const CHHAENG_SOKUNTHEARA_IMAGE = `${BASE_PATH}/team/chhaeng-sokuntheara.png`;
const HENG_CHANSELA_IMAGE = `${BASE_PATH}/team/heng-chansela.png`;

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
    name: "Heng Chansela",
    role: "Full Stack Developer",
    quote: "Every challenge is a chance to make something better.",
    github: "https://github.com/TommmyBoizzz",
    initials: "HC",
    profile: HENG_CHANSELA_IMAGE,
    accent: "from-violet-200/30 via-violet-400/10 to-cyan-300/10",
  },
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
    profile: CHHAENG_SOKUNTHEARA_IMAGE,
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
        alt="GenLink KH Logo"
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

const FLOATING_CARDS = [
  {
    id: "learn",
    title: "Learn",
    subtitle: "New skills for a brighter future",
    icon: GraduationCap,
    iconBg: "bg-purple-500/25 border-purple-400/30",
    iconColor: "text-purple-200",
    positionClasses: "sm:absolute sm:-left-8 lg:-left-20 sm:top-10 lg:top-8",
    animationClass: "landing-card-float-1",
  },
  {
    id: "grow",
    title: "Grow",
    subtitle: "Unlock your full potential",
    icon: TrendingUp,
    iconBg: "bg-teal-500/25 border-teal-400/30",
    iconColor: "text-teal-200",
    positionClasses: "sm:absolute sm:-right-6 lg:-right-16 sm:top-24 lg:top-20",
    animationClass: "landing-card-float-2",
  },
  {
    id: "connect",
    title: "Connect",
    subtitle: "Meet your people and community",
    icon: UsersRound,
    iconBg: "bg-blue-500/25 border-blue-400/30",
    iconColor: "text-blue-200",
    positionClasses: "sm:absolute sm:-left-6 lg:-left-16 sm:bottom-32 lg:bottom-28",
    animationClass: "landing-card-float-3",
  },
  {
    id: "manage",
    title: "Manage",
    subtitle: "Take control of your money",
    icon: WalletCards,
    iconBg: "bg-emerald-500/25 border-emerald-400/30",
    iconColor: "text-emerald-200",
    positionClasses: "sm:absolute sm:-right-4 lg:-right-12 sm:bottom-20 lg:bottom-16",
    animationClass: "landing-card-float-4",
  },
] as const;

function FloatingGlassCard({
  card,
  isMobile = false,
}: {
  card: (typeof FLOATING_CARDS)[number];
  isMobile?: boolean;
}) {
  const Icon = card.icon;
  return (
    <div
      className={`group relative flex items-center gap-3.5 rounded-2xl border border-white/20 bg-white/[0.12] p-3 pr-8 shadow-[0_20px_45px_rgba(0,0,0,0.35),0_0_20px_rgba(255,255,255,0.06)] backdrop-blur-2xl transition duration-500 hover:scale-105 hover:border-white/35 hover:bg-white/[0.18] ${
        isMobile ? "" : `${card.positionClasses} ${card.animationClass} hidden sm:flex z-20`
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-80" aria-hidden />
      <div className={`relative grid size-10 shrink-0 place-items-center rounded-xl border ${card.iconBg} ${card.iconColor} shadow-inner`}>
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="relative min-w-0">
        <span className="block text-xs font-bold tracking-tight text-white">{card.title}</span>
        <span className="block text-[0.66rem] leading-tight text-white/70">{card.subtitle}</span>
      </div>
      <span className="absolute bottom-2.5 right-2.5 grid size-4 place-items-center rounded-full bg-white/15 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:bg-white/25">
        <ArrowRight className="size-2.5" aria-hidden />
      </span>
    </div>
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
    <div className="relative mx-auto w-full max-w-[560px] py-4 lg:mr-0 lg:max-w-[600px]">
      {/* Curved Glowing Neon Light Trails behind phone and connecting to cards */}
      <svg
        className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 h-[calc(100%+48px)] w-[calc(100%+64px)] sm:-inset-x-12 sm:-inset-y-10 sm:h-[calc(100%+80px)] sm:w-[calc(100%+96px)]"
        viewBox="0 0 600 600"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="hero-neon-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="hero-trail-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#84ffbe" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#fbbf24" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d="M 90 140 C 200 40, 420 70, 500 180 C 580 300, 480 480, 320 500 C 160 520, 80 400, 140 320 C 190 250, 370 280, 480 390"
          stroke="url(#hero-trail-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#hero-neon-glow)"
          className="landing-trail-pulse"
        />
        <path
          d="M 90 140 C 200 40, 420 70, 500 180 C 580 300, 480 480, 320 500 C 160 520, 80 400, 140 320 C 190 250, 370 280, 480 390"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>

      {/* Floating Glass Cards on desktop/tablet */}
      {FLOATING_CARDS.map((card) => (
        <FloatingGlassCard key={card.id} card={card} />
      ))}

      {/* Central 3D Tilted Smartphone */}
      <div
        className="landing-phone relative mx-auto w-[min(100%,310px)] sm:w-[325px] rounded-[3.2rem] p-2.5 bg-gradient-to-b from-[#2d403c] via-[#111a18] to-[#071110] border border-white/25 shadow-[0_35px_80px_-15px_rgba(0,0,0,0.7),0_0_50px_rgba(74,222,128,0.22)] backdrop-blur-2xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {/* Subtle hardware buttons on sides */}
        <div className="pointer-events-none absolute -left-[3px] top-24 h-10 w-[3px] rounded-l-sm bg-white/30" aria-hidden />
        <div className="pointer-events-none absolute -left-[3px] top-38 h-10 w-[3px] rounded-l-sm bg-white/30" aria-hidden />
        <div className="pointer-events-none absolute -right-[3px] top-32 h-14 w-[3px] rounded-r-sm bg-white/30" aria-hidden />

        {/* Screen inner container */}
        <div
          id="app-screen-preview"
          role="tabpanel"
          aria-label={`${screen.label} screen preview`}
          className="relative aspect-[9/19.5] overflow-hidden rounded-[2.65rem] border border-black/80 bg-[#071312]"
        >
          {/* Dynamic Island / Notch */}
          <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex h-4.5 w-24 items-center justify-between rounded-full bg-black/95 px-2.5 shadow-sm">
            <span className="size-2 rounded-full bg-[#172528] border border-white/10" />
            <span className="size-1.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Diagonal Glass Sheen */}
          <div
            className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent"
            aria-hidden
          />

          <Image
            key={screen.src}
            src={screen.src}
            alt={screen.alt}
            fill
            sizes="(min-width: 1024px) 330px, 72vw"
            className="object-cover transition-opacity duration-500 motion-reduce:transition-none"
            priority={activeScreen === 0}
          />
        </div>
      </div>

      {/* Screen Selector Tablist */}
      <div
        className="relative z-30 mt-6 flex flex-wrap items-center justify-center gap-2"
        role="tablist"
        aria-label="GenLink app screens"
      >
        {APP_SCREENS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={activeScreen === index}
            aria-controls="app-screen-preview"
            aria-label={`Show ${item.label} screen`}
            onClick={() => setActiveScreen(index)}
            className={`rounded-full border px-3.5 py-1.5 text-[0.68rem] font-medium transition backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 motion-reduce:transition-none ${
              activeScreen === index
                ? "border-emerald-300/80 bg-emerald-300 text-[#06241b] font-semibold shadow-[0_0_15px_rgba(132,255,190,0.4)]"
                : "border-white/15 bg-white/[0.08] text-white/70 hover:border-white/30 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 2x2 grid for mobile screens (< sm) so mobile users also see all 4 cards */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:hidden">
        {FLOATING_CARDS.map((card) => (
          <FloatingGlassCard key={card.id} card={card} isMobile />
        ))}
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

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.045] transition duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[0.08]">
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
          <div className="relative grid size-24 place-items-center rounded-[2rem] border border-white/25 bg-[#0a2420]/60 text-3xl font-semibold tracking-[-0.08em] text-white shadow-[0_20px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl" aria-label={`${member.name} profile placeholder`}>
            {member.initials}
          </div>
        )}
        {!member.profile && <span className="absolute right-5 top-5 rounded-full border border-white/15 bg-[#071a19]/35 px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-white/55 backdrop-blur-xl">Profile coming soon</span>}
      </div>
      <div className="p-5">
        <h4 className="text-lg font-semibold tracking-[-0.04em] text-white">{member.name}</h4>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-emerald-200/65">{member.role}</p>
        <blockquote className="mt-5 min-h-12 text-sm leading-6 text-white/55">“{member.quote}”</blockquote>
        <a
          href={member.github}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-emerald-200/40 hover:bg-emerald-200/10 hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
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
    <main className="landing-page dark min-h-screen overflow-hidden bg-[#061716] text-white selection:bg-emerald-200 selection:text-[#061716]">
      <a href="#home" className="sr-only z-[100] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#071a19]">Skip to content</a>

      <header className="landing-nav fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-[#061716]/75 px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35),0_0_30px_rgba(6,23,22,0.5)] backdrop-blur-2xl">
          <Link
            href="/"
            aria-label="GenLink home"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            <Brand />
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 ${
                  index === 0
                    ? "text-white after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-5 after:rounded-full after:bg-emerald-300 after:shadow-[0_0_8px_#84ffbe]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <span className="hidden items-center gap-2 text-xs font-medium text-white/60 lg:flex">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#4ade80] animate-pulse" />
              For the next generation
            </span>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#06241b] shadow-[0_0_24px_rgba(132,255,190,0.35)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(132,255,190,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              Admin login <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            id="landing-mobile-nav"
            className="mx-auto mt-2 max-w-7xl rounded-3xl border border-white/15 bg-[#061716]/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            <nav aria-label="Mobile navigation" className="grid gap-2">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 px-5 py-3 text-sm font-semibold text-[#06241b]"
              >
                Admin login <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section id="home" className="relative isolate min-h-[920px] scroll-mt-24 overflow-hidden pt-36 pb-20 sm:min-h-[980px] sm:pt-44 lg:pt-40">
        <Image
          src={HERO_SRC}
          alt="Angkor Wat at sunrise reflected in calm water"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-center"
        />
        <div
          className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(4,20,18,0.95)_0%,rgba(4,20,18,0.84)_36%,rgba(4,20,18,0.38)_72%,rgba(4,20,18,0.65)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-20 bg-[linear-gradient(0deg,#061716_0%,transparent_32%,rgba(6,23,22,0.45)_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/3 top-1/3 -z-20 h-96 w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.16)_0%,rgba(245,158,11,0.06)_45%,transparent_70%)] blur-3xl"
          aria-hidden
        />
        <div
          className="landing-hero-glow pointer-events-none absolute -left-28 top-28 -z-10 size-[30rem] rounded-full bg-emerald-400/12 blur-[100px]"
          aria-hidden
        />
        <div
          className="landing-hero-glow pointer-events-none absolute right-4 top-1/3 -z-10 size-[32rem] rounded-full bg-emerald-400/14 blur-[120px]"
          style={{ animationDelay: "-4s" }}
          aria-hidden
        />

        <div className="pointer-events-none absolute left-1/4 top-1/4 -z-10 size-1 rounded-full bg-emerald-200/60 blur-[0.5px] shadow-[0_0_8px_#84ffbe]" aria-hidden />
        <div className="pointer-events-none absolute left-1/2 top-1/5 -z-10 size-1.5 rounded-full bg-amber-200/50 blur-[0.5px] shadow-[0_0_10px_#fde68a]" aria-hidden />
        <div className="pointer-events-none absolute right-1/4 top-1/2 -z-10 size-1 rounded-full bg-emerald-300/50 blur-[0.5px] shadow-[0_0_8px_#84ffbe]" aria-hidden />
        <div className="pointer-events-none absolute left-1/6 bottom-1/3 -z-10 size-1.5 rounded-full bg-teal-200/40 blur-[0.5px]" aria-hidden />

        <div className="mx-auto flex max-w-7xl flex-col px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
          <div className="max-w-2xl flex-1">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-950/50 px-4 py-1.5 text-xs font-medium text-emerald-200 shadow-[0_0_20px_rgba(74,222,128,0.18)] backdrop-blur-xl">
              <Sparkles className="size-3.5 text-emerald-300" aria-hidden />
              <span>Made for Cambodia&apos;s next generation</span>
            </div>

            <h1 className="mt-6 max-w-[720px] text-5xl font-extrabold leading-[1.04] tracking-[-0.06em] text-white sm:text-7xl lg:text-[5.4rem]">
              Your next <br />
              chapter{" "}
              <span className="bg-gradient-to-r from-[#84ffbe] via-[#4ade80] to-[#2dd4bf] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(74,222,128,0.35)]">
                starts
              </span>{" "}
              <br />
              <span className="bg-gradient-to-r from-[#84ffbe] via-[#4ade80] to-[#2dd4bf] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(74,222,128,0.35)]">
                here.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base font-normal leading-relaxed text-white/75 sm:text-lg sm:leading-8">
              GenLink brings the pieces of a meaningful life closer together — learn something useful, meet your people, manage your money, and find the opportunity that moves you forward.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#features"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#84ffbe] via-[#5eead4] to-[#4ade80] px-7 py-4 text-sm font-semibold text-[#06241b] shadow-[0_0_30px_rgba(132,255,190,0.35),0_10px_20px_rgba(0,0,0,0.25)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_42px_rgba(132,255,190,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
              >
                <span>Explore the experience</span>
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </a>
              <a
                href="#download"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/[0.08] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-white/40 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
              >
                <span className="grid size-6 place-items-center rounded-full bg-white/15 text-white transition duration-300 group-hover:bg-white/25">
                  <Play className="ml-0.5 size-3 fill-current" aria-hidden />
                </span>
                <span>See the app</span>
              </a>
            </div>

            <div className="mt-8 flex items-center gap-3.5">
              <div className="flex -space-x-2.5 overflow-hidden">
                {[
                  { src: REN_MAKARA_IMAGE, name: "Ren Makara" },
                  { src: SOKNY_ENAT_IMAGE, name: "Sokny Enat" },
                  { src: CHHAENG_SOKUNTHEARA_IMAGE, name: "Chhaeng Sokuntheara" },
                  { src: HENG_CHANSELA_IMAGE, name: "Heng Chansela" },
                ].map((u) => (
                  <div
                    key={u.name}
                    className="relative size-10 overflow-hidden rounded-full border-2 border-[#09231f] bg-slate-800 shadow-md"
                  >
                    <Image src={u.src} alt={u.name} fill sizes="40px" className="object-cover object-top" />
                  </div>
                ))}
              </div>
              <p className="max-w-[220px] text-xs leading-snug text-white/75">
                Join a growing community <br />
                <span className="text-white/50">of students and young professionals</span>
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 sm:gap-8 border-t border-white/15 pt-6">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl border border-white/15 bg-white/[0.07] text-emerald-300">
                  <UsersRound className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">5</p>
                  <p className="text-[0.68rem] font-medium leading-tight text-white/50">ways to move forward</p>
                </div>
              </div>

              <div className="hidden h-9 w-px bg-white/15 sm:block" aria-hidden />

              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl border border-white/15 bg-white/[0.07] text-emerald-300">
                  <Compass className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">1</p>
                  <p className="text-[0.68rem] font-medium leading-tight text-white/50">space for your whole journey</p>
                </div>
              </div>

              <div className="hidden h-9 w-px bg-white/15 sm:block" aria-hidden />

              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl border border-white/15 bg-white/[0.07] text-emerald-300">
                  <Infinity className="size-4" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">∞</p>
                  <p className="text-[0.68rem] font-medium leading-tight text-white/50">possibilities ahead</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex-1 lg:mt-4">
            <AppPreview />
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-white/40 sm:flex">
          <span className="h-px w-10 bg-white/25" /> Scroll to explore <ChevronDown className="size-3.5 animate-bounce" aria-hidden />
        </div>
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
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/70">About GenLink</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-white sm:text-6xl">Technology with a <span className="text-emerald-200">human pulse.</span></h2><p className="mt-6 max-w-lg text-base leading-8 text-white/55">GenLink is a place to make progress feel personal. We are designing for ambitious people in Cambodia and beyond — people who want useful tools, warmer communities, and more confidence in the road ahead.</p><a href="#download" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">Meet the GenLink idea <ArrowRight className="size-4" aria-hidden /></a></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ title: "Human first", body: "Useful beats noisy. Every detail should help you make a better next move.", icon: HeartHandshake }, { title: "Progress over perfection", body: "We celebrate consistency, curiosity, and the small wins that compound.", icon: TrendingUp }, { title: "Local context", body: "Built with Cambodia's pace, ambitions, and communities in mind.", icon: Landmark }, { title: "Open possibility", body: "Learning, opportunity, and connection should feel closer to everyone.", icon: Compass }].map(({ title, body, icon: Icon }) => <div key={title} className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-emerald-200"><Icon className="size-5" aria-hidden /></span><h3 className="mt-7 text-lg font-semibold tracking-[-0.04em] text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{body}</p></div>)}
          </div>
        </div>
        <div className="relative mx-auto mt-24 max-w-7xl sm:mt-32">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/70">The people behind the progress</p><h3 className="mt-4 text-3xl font-semibold tracking-[-0.07em] text-white sm:text-5xl">Meet the <span className="text-white/40">GenLink team.</span></h3></div>
            <p className="max-w-sm text-sm leading-6 text-white/45">A small team building a more connected way to grow, learn, and find what comes next.</p>
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

      <footer className="border-t border-white/10 bg-[#061716] px-6 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div><Link href="/" aria-label="GenLink home" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"><Brand /></Link><p className="mt-4 max-w-xs text-sm leading-6 text-white/35">Grow with intention. Learn in public. Find your people. Build what is next.</p></div>
          <div className="flex flex-col gap-4 sm:items-end"><nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60"><a href="#home" className="transition hover:text-emerald-200">Home</a><a href="#features" className="transition hover:text-emerald-200">Features</a><a href="#about" className="transition hover:text-emerald-200">About</a><Link href="/login" className="transition hover:text-emerald-200">Admin login</Link></nav><p className="text-xs text-white/25">© 2026 GenLink KH · Built for Cambodia, open to the world.</p></div>
        </div>
      </footer>
    </main>
  );
}
