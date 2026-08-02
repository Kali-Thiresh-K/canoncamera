import { createFileRoute } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { CanvasSequence } from "@/components/CanvasSequence";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canon EOS R1 — Engineered Without Compromise" },
      {
        name: "description",
        content:
          "Flagship full-frame mirrorless. 45 MP CMOS, DIGIC Accelerator, 40 FPS, 8K RAW. A cinematic exploded-view story of Canon's finest instrument.",
      },
      { property: "og:title", content: "Canon EOS R1 — Engineered Without Compromise" },
      {
        property: "og:description",
        content: "A cinematic look at Canon's flagship EOS R1, layer by layer.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const FRAME_COUNT = 101;
const framePath = (i: number) =>
  `/frames/frame-${String(i + 1).padStart(4, "0")}.jpg`;

const NAV_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Engineering", href: "#engineering" },
  { label: "Specifications", href: "#specs" },
  { label: "Gallery", href: "#gallery" },
  { label: "Reserve", href: "#reserve" },
];

function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  // Imperative bridge: scroll progress never touches React state.
  const overlayApi = useRef<((p: number) => void) | null>(null);
  const handleProgress = useCallback((p: number) => {
    overlayApi.current?.(p);
  }, []);



  // Nav state toggled via class only — no re-render while scrolling.
  useEffect(() => {
    let last = false;
    const onScroll = () => {
      const next = window.scrollY > 40;
      if (next === last) return;
      last = next;
      navRef.current?.classList.toggle("nav-solid", next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative bg-bg text-ink">
      <Navigation navRef={navRef} />

      {/* HERO */}
      {reduced ? (
        <StaticHero />
      ) : (
        <section
          ref={heroRef}
          id="overview"
          className="relative h-screen w-full overflow-hidden bg-bg"
        >
          <CanvasSequence
            containerRef={heroRef}
            frameCount={FRAME_COUNT}
            framePath={framePath}
            onProgress={handleProgress}
            frameStep={mobile ? 2 : 1}
          />
          <HeroOverlays api={overlayApi} />
          <ScrollHint mobile={mobile} />
        </section>
      )}


      <FadeSection enabled={reduced}><EngineeringSection /></FadeSection>
      <FadeSection enabled={reduced}><ExplodedInteractive /></FadeSection>
      <FadeSection enabled={reduced}><SpecsSection /></FadeSection>
      <FadeSection enabled={reduced}><FeaturesSection /></FadeSection>
      <FadeSection enabled={reduced}><GallerySection /></FadeSection>
      <FadeSection enabled={reduced}><ReserveSection /></FadeSection>
      <SiteFooter />
    </div>
  );
}

/* -------------- REDUCED-MOTION HERO -------------- */
function StaticHero() {
  // Frame 50 shows the fully exploded assembly — the story image at rest.
  const explodedFrame = framePath(49);
  return (
    <section
      id="overview"
      className="relative flex min-h-[100dvh] w-full items-center overflow-hidden bg-bg"
    >
      <img
        src={explodedFrame}
        alt="Canon EOS R1 exploded engineering view"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(6,6,6,0.35) 0%, rgba(6,6,6,0.85) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 md:px-10">
        <p className="mb-8 text-[10px] uppercase tracking-luxe text-ink-muted">
          Flagship · Full Frame · Mirrorless
        </p>
        <h1 className="font-display text-[13vw] font-light leading-[0.9] tracking-[-0.02em] text-ink md:text-[8.5rem]">
          Canon EOS R1
        </h1>
        <p className="mt-8 max-w-xl font-display text-lg italic text-ink-muted md:text-2xl">
          Engineered without compromise.
        </p>
        <div className="mt-12">
          <a
            href="#specs"
            className="group inline-flex items-center gap-3 border border-ink/60 px-8 py-4 text-[11px] uppercase tracking-luxe text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-bg"
          >
            Explore Specifications
            <span className="inline-block">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------- SECTION FADE (reduced-motion) -------------- */
const FadeSection = memo(function FadeSection({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
});

/* -------------- NAV -------------- */
const Navigation = memo(function Navigation({ navRef }: { navRef: React.RefObject<HTMLElement | null> }) {
  const [open, setOpen] = useState(false);
  return (
    <header
      ref={navRef}
      className="site-nav fixed inset-x-0 top-0 z-50 border-b border-transparent"
    >

      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:h-20 md:px-10">
        <a href="#overview" className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-medium tracking-tight text-ink">
            Canon
          </span>
          <span className="text-[10px] uppercase tracking-luxe text-ink-muted">
            EOS R1
          </span>
        </a>
        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[12px] uppercase tracking-[0.22em] text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <button
          aria-label="Menu"
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="h-px w-6 bg-ink" />
          <span className="h-px w-6 bg-ink" />
        </button>
      </div>
      {open && (
        <div className="overflow-hidden border-t border-divider bg-[#0a0a0a] md:hidden">
          <div className="flex flex-col gap-5 px-6 py-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.22em] text-ink-muted"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>

  );
});

/* -------------- HERO OVERLAYS (imperative, zero re-renders) -------------- */
const CHAPTERS = [
  {
    label: "Canon EOS R1 · Flagship",
    title: ["Engineered", "Without Compromise"],
    body: "A full-frame mirrorless instrument built around a single idea: capture the decisive moment with absolute fidelity, in any condition.",
    cta: { label: "Explore Engineering", href: "#engineering" },
    start: 0,
    end: 0.18,
  },
  {
    label: "Chapter I · Structure",
    title: ["Precision", "in Every Layer"],
    body: "Every component is engineered for speed, durability, and optical precision — a magnesium chassis machined to micron tolerances.",
    cta: { label: "See the Structure", href: "#engineering" },
    start: 0.25,
    end: 0.43,
  },
  {
    label: "Chapter II · The Core",
    title: ["The Heart", "of Performance"],
    body: "A stacked 45 MP sensor, the DIGIC Accelerator, and cross-type dual pixel autofocus, calibrated to behave as one continuous system.",
    cta: { label: "View Specifications", href: "#specs" },
    start: 0.50,
    end: 0.68,
  },
  {
    label: "Chapter III · Reassembled",
    title: ["Built to Become", "One Again"],
    body: "Each element returns to perfect alignment. What remains is a single, quiet instrument — ready for the next frame.",
    cta: { label: "Reserve the EOS R1", href: "#reserve" },
    start: 0.75,
    end: 1,
  },
];

function opacityFor(progress: number, start: number, end: number) {
  const fade = 0.03;
  if (progress < start - fade || progress > end + fade) return 0;
  if (progress < start) return (progress - (start - fade)) / fade;
  if (progress > end) return 1 - (progress - end) / fade;
  return 1;
}

const HeroOverlays = memo(function HeroOverlays({
  api,
}: {
  api: React.RefObject<((p: number) => void) | null>;
}) {
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const last: number[] = CHAPTERS.map(() => -1);
    api.current = (p: number) => {
      for (let i = 0; i < CHAPTERS.length; i++) {
        const o = Math.round(opacityFor(p, CHAPTERS[i].start, CHAPTERS[i].end) * 100) / 100;
        if (o === last[i]) continue;
        last[i] = o;
        const el = panelsRef.current[i];
        if (!el) continue;
        el.style.opacity = String(o);
        el.style.visibility = o === 0 ? "hidden" : "visible";
      }
    };
    api.current(0);
    return () => {
      api.current = null;
    };
  }, [api]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 h-screen">
      {/* static legibility scrim — never animated */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-full md:w-[60%]"
        style={{
          background:
            "linear-gradient(90deg, rgba(6,6,6,0.88) 0%, rgba(6,6,6,0.62) 45%, rgba(6,6,6,0) 100%)",
        }}
      />
      <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-6 md:px-16 lg:px-24">
        <div className="relative w-full max-w-[520px]">
          {CHAPTERS.map((c, i) => (
            <div
              key={c.label}
              ref={(el) => {
                panelsRef.current[i] = el;
              }}
              className="absolute inset-0 flex flex-col justify-center"
              style={{
                opacity: 0,
                visibility: "hidden",
                transform: "translate3d(0,0,0)",
                willChange: "opacity",
              }}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-ink-faint">
                {c.label}
              </p>
              {i === 0 ? (
                <h1 className="mt-7 font-display text-[2.75rem] font-light leading-[1.08] tracking-[-0.015em] text-ink sm:text-[3.25rem] lg:text-[3.75rem]">
                  {c.title[0]}
                  <br />
                  {c.title[1]}
                </h1>
              ) : (
                <h2 className="mt-7 font-display text-[2.5rem] font-light leading-[1.08] tracking-[-0.015em] text-ink sm:text-[3rem] lg:text-[3.5rem]">
                  {c.title[0]}
                  <br />
                  {c.title[1]}
                </h2>
              )}
              <div className="mt-8 h-px w-14 bg-canon" />
              <p className="mt-8 max-w-[460px] text-[15px] leading-[1.75] tracking-[0.01em] text-ink-muted">
                {c.body}
              </p>
              <div className="pointer-events-auto mt-10">
                <a
                  href={c.cta.href}
                  className="group inline-flex items-center gap-3 border-b border-ink/30 pb-2 text-[11px] uppercase tracking-[0.28em] text-ink transition-colors duration-300 hover:border-ink"
                >
                  {c.cta.label}
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});



const ScrollHint = memo(function ScrollHint({ mobile }: { mobile: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 1 }}
      className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-center"
    >
      <div className="mx-auto mb-3 h-8 w-px bg-gradient-to-b from-transparent to-ink/60" />
      <span className="text-[10px] uppercase tracking-luxe text-ink-muted">
        {mobile ? "Swipe" : "Scroll"}
      </span>
    </motion.div>
  );
});

/* -------------- ENGINEERING -------------- */
const ENGINEERING = [
  {
    n: "01",
    title: "Magnesium Alloy Chassis",
    body:
      "A single-piece frame precision-milled for absolute rigidity, reducing sensor micro-vibration to imperceptible levels.",
  },
  {
    n: "02",
    title: "Weather Sealing",
    body:
      "Over 90 sealing points shield the internals from rain, dust and cold — engineered for expedition-grade reliability.",
  },
  {
    n: "03",
    title: "DIGIC Accelerator",
    body:
      "A dedicated neural coprocessor accelerates subject recognition, denoising and deep-learning autofocus in real time.",
  },
  {
    n: "04",
    title: "45 MP Full-Frame Sensor",
    body:
      "A stacked back-illuminated CMOS designed for extraordinary dynamic range and 40 FPS blackout-free capture.",
  },
  {
    n: "05",
    title: "IBIS Stabilization",
    body:
      "Five-axis in-body stabilization delivers up to eight stops of correction with coordinated RF lens control.",
  },
  {
    n: "06",
    title: "Dual CFexpress Type-B",
    body:
      "Symmetrical high-throughput slots sustain 8K RAW and unbroken high-speed bursts with redundant reliability.",
  },
];

const EngineeringSection = memo(function EngineeringSection() {
  return (
    <section id="engineering" className="relative bg-bg py-32 md:py-48">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="mb-8 text-[10px] uppercase tracking-luxe text-ink-muted">
              — Engineering
            </p>
            <h2 className="font-display text-5xl font-light leading-[0.95] tracking-tight md:text-7xl">
              A camera <br />
              is a <em className="italic font-normal">system</em> <br />
              of decisions.
            </h2>
            <p className="mt-10 max-w-md text-sm leading-relaxed text-ink-muted md:text-base">
              The EOS R1 is the result of every decision made in favour of the
              image — a discipline visible in each layer, each surface, each
              interconnect.
            </p>
          </div>

          <div className="md:col-span-7">
            <ul className="border-t border-divider">
              {ENGINEERING.map((e) => (
                <li key={e.n} className="border-b border-divider py-10 md:py-12">
                  <div className="grid grid-cols-12 items-baseline gap-6">
                    <span className="col-span-2 font-display text-sm text-ink-faint md:text-base">
                      {e.n}
                    </span>
                    <h3 className="col-span-10 font-display text-2xl font-light leading-tight tracking-tight md:col-span-4 md:text-3xl">
                      {e.title}
                    </h3>
                    <p className="col-span-12 max-w-lg text-sm leading-relaxed text-ink-muted md:col-span-6 md:text-base">
                      {e.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
});

/* -------------- INTERACTIVE EXPLODED -------------- */
const HOTSPOTS: { id: string; label: string; sub: string; x: number; y: number }[] = [
  { id: "lens", label: "RF Lens Group", sub: "Multi-layer optical assembly", x: 15, y: 52 },
  { id: "sensor", label: "45 MP CMOS", sub: "Stacked full-frame sensor", x: 46, y: 47 },
  { id: "ibis", label: "IBIS Unit", sub: "5-axis stabilization gimbal", x: 40, y: 63 },
  { id: "pcb", label: "Main PCB", sub: "DIGIC Accelerator core", x: 71, y: 52 },
  { id: "lcd", label: "Rear LCD", sub: "Vari-angle display", x: 88, y: 46 },
  { id: "evf", label: "EVF", sub: "OLED electronic viewfinder", x: 55, y: 15 },
  { id: "battery", label: "LP-E19 Battery", sub: "Endurance power cell", x: 22, y: 82 },
  { id: "ports", label: "I/O Ports", sub: "HDMI · USB-C · Ethernet", x: 91, y: 78 },
];

const ExplodedInteractive = memo(function ExplodedInteractive() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section className="relative bg-bg py-32 md:py-48">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <p className="mb-6 text-[10px] uppercase tracking-luxe text-ink-muted">
              — The Exploded View
            </p>
            <h2 className="font-display text-4xl font-light leading-tight tracking-tight md:text-6xl">
              Every part, <br />
              in its right place.
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm leading-relaxed text-ink-muted md:block">
            Tap or hover a marker to trace each component through the assembly.
          </p>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <img
            src={framePath(49)}
            alt="Canon EOS R1 exploded engineering view"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          {HOTSPOTS.map((h) => (
            <Hotspot
              key={h.id}
              h={h}
              active={active === h.id}
              onEnter={() => setActive(h.id)}
              onLeave={() => setActive((v) => (v === h.id ? null : v))}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

const Hotspot = memo(function Hotspot({
  h,
  active,
  onEnter,
  onLeave,
}: {
  h: (typeof HOTSPOTS)[number];
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  // pick label side
  const rightSide = h.x < 55;
  return (
    <div
      className="absolute"
      style={{ left: `${h.x}%`, top: `${h.y}%` }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={() => (active ? onLeave() : onEnter())} /* tap-to-toggle on mobile */
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={0}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <span
          className="block h-3 w-3 rounded-full bg-ink md:h-2 md:w-2"
          style={{ boxShadow: "0 0 0 6px rgba(243,240,235,0.15)" }}
        />
        <AnimatePresence>
          {active && (
            <motion.div
              key="lbl"
              initial={{ opacity: 0, x: rightSide ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: rightSide ? -8 : 8 }}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="absolute top-1/2 flex -translate-y-1/2 items-center gap-3"
              style={rightSide ? { left: 12 } : { right: 12, flexDirection: "row-reverse" }}
            >
              <span
                className="block h-px"
                style={{
                  width: 64,
                  background:
                    "linear-gradient(to right, rgba(183,110,121,0), rgba(183,110,121,1))",
                }}
              />
              <div
                className={`whitespace-nowrap ${rightSide ? "text-left" : "text-right"}`}
              >
                <div className="font-display text-sm text-ink md:text-base">
                  {h.label}
                </div>
                <div className="text-[10px] uppercase tracking-luxe text-ink-muted">
                  {h.sub}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

/* -------------- SPECS -------------- */
const SPECS: [string, string][] = [
  ["Sensor", "45 MP Full-Frame CMOS"],
  ["Processor", "DIGIC Accelerator"],
  ["Continuous Shooting", "40 FPS"],
  ["Video", "8K RAW Internal"],
  ["Stabilization", "In-Body 5-Axis IBIS"],
  ["Storage", "Dual CFexpress Type-B"],
  ["Mount", "Canon RF"],
  ["Weather Sealing", "Professional Grade"],
];

const SpecsSection = memo(function SpecsSection() {
  return (
    <section id="specs" className="relative bg-bg py-32 md:py-48">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="mb-20 flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="mb-6 text-[10px] uppercase tracking-luxe text-ink-muted">
              — Specifications
            </p>
            <h2 className="font-display text-5xl font-light leading-[0.95] tracking-tight md:text-7xl">
              Documented, <br />
              to the decimal.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            Every figure has been measured, verified and re-measured. A
            reference document for those who build alongside light.
          </p>
        </div>

        <dl>
          {SPECS.map(([k, v], i) => (
            <div
              key={k}
              className={`grid grid-cols-12 items-baseline gap-6 py-6 md:py-7 ${
                i === 0 ? "border-t border-divider" : ""
              } border-b border-divider`}
            >
              <dt className="col-span-12 text-[11px] uppercase tracking-luxe text-ink-muted md:col-span-4">
                {k}
              </dt>
              <dd className="col-span-12 font-display text-2xl font-light tracking-tight md:col-span-8 md:text-3xl">
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
});

/* -------------- FEATURES -------------- */
const FEATURES = [
  {
    tag: "Intelligence",
    title: "Autofocus that anticipates.",
    body:
      "Deep-learning subject recognition tracks eye, face and body across even the most demanding scenes — sports, wildlife, cinema.",
    frame: 8,
  },
  {
    tag: "Sensitivity",
    title: "Light, honoured.",
    body:
      "An extended sensitivity range and refined noise architecture make the R1 an instrument for the darkest and most nuanced conditions.",
    frame: 30,
  },
  {
    tag: "Ergonomics",
    title: "Made for the hand that made it.",
    body:
      "Every button, every dial has been placed with the intent of professional use — hours long, in gloves, in motion, without thought.",
    frame: 70,
  },
  {
    tag: "Cinema",
    title: "8K, without compromise.",
    body:
      "Internal 8K RAW recording with cinema-grade colour science, delivering post-production latitude that meets the highest workflows.",
    frame: 88,
  },
  {
    tag: "Workflow",
    title: "Integrated from capture to delivery.",
    body:
      "Cloud-native connectivity, dual protocols and rapid ingest reduce the distance between the moment and the finished frame.",
    frame: 96,
  },
];

const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section className="relative bg-bg py-32 md:py-48">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-24 max-w-xl">
          <p className="mb-6 text-[10px] uppercase tracking-luxe text-ink-muted">
            — Features
          </p>
          <h2 className="font-display text-5xl font-light leading-[0.95] tracking-tight md:text-7xl">
            The instrument, <br />
            expressed.
          </h2>
        </div>

        <div className="space-y-40 md:space-y-56">
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} feature={f} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
});

const FeatureRow = memo(function FeatureRow({
  feature,
  reverse,
}: {
  feature: (typeof FEATURES)[number];
  reverse: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yMotion = useTransform(scrollYProgress, [0, 1], [40, -40]);
  // Disable parallax on mobile to avoid scroll jank
  const y = (reduced || mobile) ? 0 : yMotion;


  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-20 ${
        reverse ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div className="md:col-span-7">
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-[5/4]">
          <motion.img
            src={framePath(feature.frame)}
            alt={feature.title}
            loading="lazy"
            style={{ y }}
            className="absolute inset-[-8%] h-[116%] w-[116%] object-cover"
          />
        </div>
      </div>
      <div className="md:col-span-5">
        <p className="mb-6 text-[10px] uppercase tracking-luxe text-ink-muted">
          — {feature.tag}
        </p>
        <h3 className="font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
          {feature.title}
        </h3>
        <div className="my-8 h-px w-12 bg-canon" />
        <p className="max-w-md text-sm leading-relaxed text-ink-muted md:text-base">
          {feature.body}
        </p>
      </div>
    </div>
  );
});

/* -------------- GALLERY -------------- */
const GALLERY_FRAMES = [2, 12, 22, 34, 46, 58, 70, 82, 92, 100];

const GallerySection = memo(function GallerySection() {
  return (
    <section id="gallery" className="relative bg-bg py-32 md:py-48">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-16 flex items-end justify-between">
          <div>
            <p className="mb-6 text-[10px] uppercase tracking-luxe text-ink-muted">
              — Gallery
            </p>
            <h2 className="font-display text-5xl font-light leading-[0.95] tracking-tight md:text-7xl">
              In detail.
            </h2>
          </div>
        </div>

        <div className="columns-1 gap-6 md:columns-2 lg:columns-3 [&>*]:mb-6">
          {GALLERY_FRAMES.map((f, i) => (
            <GalleryItem key={f} frame={f} tall={i % 3 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
});

const GalleryItem = memo(function GalleryItem({ frame, tall }: { frame: number; tall: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yMotion = useTransform(scrollYProgress, [0, 1], [30, -30]);
  // Disable parallax on mobile to avoid scroll jank
  const y = (reduced || mobile) ? 0 : yMotion;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduced ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: reduced ? 0.5 : 1, ease: [0.22, 0.61, 0.36, 1] }}
      className={`group relative overflow-hidden break-inside-avoid ${
        tall ? "aspect-[3/4]" : "aspect-[4/3]"
      }`}
    >
      <motion.img
        src={framePath(frame)}
        alt=""
        loading="lazy"
        style={{ y }}
        className="absolute inset-[-6%] h-[112%] w-[112%] object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
      />
    </motion.div>
  );
});

/* -------------- CTA -------------- */
const ReserveSection = memo(function ReserveSection() {
  return (
    <section id="reserve" className="relative bg-bg py-40 md:py-64">
      <div className="mx-auto max-w-[1200px] px-6 text-center md:px-10">
        <p className="mb-8 text-[10px] uppercase tracking-luxe text-ink-muted">
          — Available Soon
        </p>
        <h2 className="font-display text-4xl font-light italic leading-[0.95] tracking-tight sm:text-6xl md:text-[9rem]">
          Ready to Create.
        </h2>
        <div
          className="mx-auto my-14 h-px w-24"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(200, 138, 79, 0.9), transparent)",
          }}
        />
        <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-muted md:text-base">
          Reserve the EOS R1 with your local Canon Professional Services
          representative.
        </p>
        <a
          href="#"
          className="group mt-12 inline-flex items-center gap-3 border border-ink px-10 py-5 text-[11px] uppercase tracking-luxe text-ink transition-all duration-500 hover:bg-ink hover:text-bg"
        >
          Discover Canon EOS R1
          <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </section>
  );
});

/* -------------- FOOTER -------------- */
const SiteFooter = memo(function SiteFooter() {
  return (
    <footer className="border-t border-divider bg-bg pb-10 pt-16">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div>
            <div className="font-display text-3xl font-light tracking-tight">
              Canon
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink-muted">
              Delighting you always. Canon Inc., est. 1937.
            </p>
          </div>
          <nav className="flex flex-wrap gap-8 text-[11px] uppercase tracking-luxe text-ink-muted">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Support</a>
            <a href="#" className="hover:text-ink">Contact</a>
          </nav>
          <div className="flex gap-5 text-ink-muted">
            {["IG", "YT", "X", "IN"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="flex h-9 w-9 items-center justify-center border border-divider text-[10px] tracking-widest transition-colors hover:border-ink hover:text-ink"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-divider pt-6 text-[10px] uppercase tracking-luxe text-ink-faint md:flex-row">
          <span>© {new Date().getFullYear()} Canon Inc. All rights reserved.</span>
          <span>EOS R1 · Reference Site</span>
        </div>
      </div>
    </footer>
  );
});
