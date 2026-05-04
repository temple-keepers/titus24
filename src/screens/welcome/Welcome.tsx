import { Link } from 'react-router-dom';
import {
  Heart,
  HandHeart,
  BookOpen,
  Users,
  Calendar,
  MessageCircle,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

/**
 * Public welcome / marketing page. Lives at /welcome — no auth required.
 * Designed to be shareable as a single beautiful page that "sells" the
 * sisterhood to a sister who hasn't joined yet.
 */
export default function Welcome() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #FFFBF9 0%, #FCE7EE 40%, #FFFBF9 100%)', color: '#3D1F2A' }}
    >
      <Hero />
      <WhatItIs />
      <FeatureGrid />
      <Privacy />
      <Closing />
      <Footer />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Sections                                                             */
/* ──────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <header className="relative overflow-hidden">
      <RoseSwirl className="absolute -top-12 -right-12 h-80 w-80 opacity-30" />
      <RoseSwirl className="absolute -bottom-24 -left-12 h-72 w-72 opacity-20 rotate-180" />
      <div className="relative mx-auto max-w-3xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <Logo />
        <p
          className="mt-6 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#E8668A' }}
        >
          A digital sisterhood for women
        </p>
        <h1
          className="mt-3 font-serif text-4xl leading-tight sm:text-6xl"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          Walk together.
          <br />
          Pray together.
          <br />
          <em style={{ color: '#E8668A' }}>Become together.</em>
        </h1>
        <p className="mt-6 text-base sm:text-lg" style={{ color: '#8B6F75' }}>
          Titus 2:4 is a private, faith-rooted home for women across cities and life-stages —
          single, engaged, married, mothering. Where older women teach the younger,
          and every sister is seen, prayed for, and never alone.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #F78DA7, #E8668A)' }}
          >
            Join the sisterhood
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-white"
            style={{ borderColor: 'rgba(61,31,42,0.15)', color: '#3D1F2A' }}
          >
            I already have an account
          </Link>
        </div>

        <ScriptureHero
          reference="Titus 2:3-4"
          text="That they may teach the young women to be sober, to love their husbands, to love their children…"
        />
      </div>
    </header>
  );
}

function WhatItIs() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div
        className="rounded-3xl border bg-white p-8 shadow-lg sm:p-10"
        style={{ borderColor: 'rgba(61,31,42,0.08)' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#E8668A' }}
        >
          What this is
        </p>
        <h2
          className="mt-2 font-serif text-3xl sm:text-4xl"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          A small, private home — not a social network.
        </h2>
        <p className="mt-4 text-base leading-7" style={{ color: '#3D1F2A' }}>
          No followers. No likes count. No strangers.
          Just the sisters you've been brought into community with — sharing the day's
          devotional, lifting each other in prayer, marking births and weddings,
          gathering on Zoom, and growing.
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            'Invitation-only — only the sisters added by leadership',
            'Free to use — no ads, no upsells',
            'Built for phones, tablets, and desktop',
            'Install to your home screen like an app',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm" style={{ color: '#3D1F2A' }}>
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#5E8C5E' }} />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features: Array<{
    Icon: typeof Heart;
    title: string;
    body: string;
    tint: 'rose' | 'pink' | 'sage';
  }> = [
    {
      Icon: BookOpen,
      title: 'A daily devotional, every morning',
      body:
        "Open the app and a fresh devotional — theme, scripture, reflection, affirmation, and a closing prayer — is ready for you. Built to take five minutes; built to last all day.",
      tint: 'rose',
    },
    {
      Icon: HandHeart,
      title: 'A prayer wall that actually gets prayed for',
      body:
        "Share a need, anonymously if you want. Sisters tap the praying-hands and you'll know they're standing with you. When the prayer is answered, mark it — and the sisterhood celebrates with you.",
      tint: 'pink',
    },
    {
      Icon: MessageCircle,
      title: 'Real conversations, not noise',
      body:
        "Post what's on your heart. Comment, encourage, react with hearts and amens. One-on-one messages live alongside the community feed for the things you only share with one sister.",
      tint: 'sage',
    },
    {
      Icon: Heart,
      title: 'Mentorship — older to younger, on purpose',
      body:
        "Leadership pairs you with a mentor or a mentee. You'll see her on your home screen, her city, her prayer focus — and a button to message her. The Titus 2:4 commission, made simple.",
      tint: 'rose',
    },
    {
      Icon: Calendar,
      title: 'Gatherings you actually attend',
      body:
        "Monthly Zooms, retreats, prayer nights — RSVP in seconds, the time auto-converts to your timezone, and the gallery from each gathering becomes part of the sisterhood's story.",
      tint: 'sage',
    },
    {
      Icon: Users,
      title: 'Smaller circles within the sisterhood',
      body:
        "Public groups you can join, private groups for closer accountability. Each group has its own discussion feed and its own pace. You can be in as many as serves you.",
      tint: 'pink',
    },
    {
      Icon: BookOpen,
      title: 'Bible studies you can finish',
      body:
        "Multi-day guided studies with a scripture, a reflection, and a journal prompt for each day. Mark a day complete and pick up where you left off, even months later.",
      tint: 'rose',
    },
    {
      Icon: Sparkles,
      title: 'A calendar of celebration',
      body:
        "Birthdays, anniversaries, baptisms, milestones — they show up on the home page so the sisterhood can celebrate them together. Privacy you control: show your birthday or keep it just to leadership.",
      tint: 'sage',
    },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <p
        className="text-center text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: '#E8668A' }}
      >
        What you'll do here
      </p>
      <h2
        className="mt-2 text-center font-serif text-3xl sm:text-4xl"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
      >
        Eight reasons sisters keep coming back
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  Icon,
  title,
  body,
  tint,
}: {
  Icon: typeof Heart;
  title: string;
  body: string;
  tint: 'rose' | 'pink' | 'sage';
}) {
  const tints: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
    rose: { bg: 'linear-gradient(135deg, #FCE7EE, #FFFFFF)', iconBg: 'linear-gradient(135deg, #F78DA7, #E8668A)', iconColor: 'white' },
    pink: { bg: 'linear-gradient(135deg, #FFF0EB, #FFFFFF)', iconBg: 'linear-gradient(135deg, #FFB0A0, #F78DA7)', iconColor: 'white' },
    sage: { bg: 'linear-gradient(135deg, #EDF3ED, #FFFFFF)', iconBg: 'linear-gradient(135deg, #AAC4AA, #82A882)', iconColor: 'white' },
  };
  const t = tints[tint];

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border p-6 shadow-sm transition hover:shadow-lg"
      style={{ borderColor: 'rgba(61,31,42,0.08)', background: t.bg }}
    >
      <div
        className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-md"
        style={{ background: t.iconBg, color: t.iconColor }}
      >
        <Icon size={22} />
      </div>
      <h3
        className="font-serif text-xl"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#3D1F2A' }}
      >
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: '#5C3A47' }}>
        {body}
      </p>
    </article>
  );
}

function Privacy() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div
        className="rounded-3xl p-8 sm:p-10"
        style={{ background: 'linear-gradient(135deg, #EDF3ED, #FFFFFF)', border: '1px solid rgba(170,196,170,0.4)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: 'linear-gradient(135deg, #AAC4AA, #82A882)' }}
          >
            <Lock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#5E8C5E' }}>
              Private. Quiet. Yours.
            </p>
            <h2
              className="mt-1 font-serif text-2xl sm:text-3xl"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              The sisterhood stays inside the sisterhood.
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: '#3D1F2A' }}>
              Posts, prayers, photos, messages — all of it visible only to sisters who've
              been invited. You decide whether your birthday is shared. You can post a
              prayer request anonymously. Your phone number is only ever visible to
              leadership. No data is sold. No ads, ever.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <ScripturePill
        reference="Proverbs 31:25"
        text="She is clothed with strength and dignity, and she laughs without fear of the future."
      />
      <h2
        className="mt-8 font-serif text-3xl sm:text-4xl"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
      >
        Step in, sister.
      </h2>
      <p className="mt-4 text-base" style={{ color: '#8B6F75' }}>
        If leadership has invited you, your account is waiting. If you're not invited yet,
        reach out to the sister who sent you here.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/sign-up"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #F78DA7, #E8668A)' }}
        >
          Create my account
          <ArrowRight size={16} />
        </Link>
        <Link
          to="/sign-in"
          className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-white"
          style={{ borderColor: 'rgba(61,31,42,0.15)', color: '#3D1F2A' }}
        >
          Sign in
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="mx-auto max-w-5xl px-6 py-10 text-center text-xs"
      style={{ color: '#8B6F75' }}
    >
      <p>
        With love and prayers,
        <br />
        <span className="font-serif italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          The Titus 2:4 Sisterhood
        </span>
      </p>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Reusable bits                                                        */
/* ──────────────────────────────────────────────────────────────────── */

function Logo() {
  return (
    <div className="inline-flex items-center gap-3">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #F78DA7, #E8668A)' }}
      >
        <span
          className="font-serif text-2xl font-bold"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          T
        </span>
      </div>
      <span
        className="font-serif text-2xl"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#3D1F2A' }}
      >
        Titus 2:4
      </span>
    </div>
  );
}

function ScripturePill({ reference, text }: { reference: string; text: string }) {
  return (
    <blockquote
      className="mx-auto max-w-xl rounded-2xl border-l-4 px-5 py-4 text-base italic"
      style={{
        borderColor: '#E8668A',
        background: '#FCE7EE',
        color: '#3D1F2A',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
      }}
    >
      <p className="text-lg leading-7">{text}</p>
      <footer className="mt-2 not-italic text-xs font-semibold uppercase tracking-wide" style={{ color: '#8B6F75' }}>
        {reference}
      </footer>
    </blockquote>
  );
}

function ScriptureHero({ reference, text }: { reference: string; text: string }) {
  return (
    <div className="mt-12">
      <ScripturePill reference={reference} text={text} />
    </div>
  );
}

/**
 * Hand-crafted SVG: stylised rose swirl, used as a soft background flourish.
 */
function RoseSwirl({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="rose-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F78DA7" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#E8668A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#rose-grad)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        const cx = 200 + Math.cos(angle) * 70;
        const cy = 200 + Math.sin(angle) * 70;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="50"
            ry="22"
            fill="#E8668A"
            fillOpacity="0.18"
            transform={`rotate(${(i / 8) * 360} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx="200" cy="200" r="38" fill="#E8668A" fillOpacity="0.35" />
      <circle cx="200" cy="200" r="18" fill="#3D1F2A" fillOpacity="0.25" />
    </svg>
  );
}
