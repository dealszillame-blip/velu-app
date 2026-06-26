"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { VeluLogo } from "@/components/shared/VeluLogo";
import "./landing.css";

const TICKER_ITEMS = [
  { type: "Sold", dot: "td-red", text: "450m² in Ingleburn 2565 · $595k" },
  { type: "Listed", dot: "td-green", text: "512m² in Campbelltown 2560 · $640k" },
  { type: "Under offer", dot: "td-amber", text: "380m² in Liverpool 2170" },
  { type: "Listed", dot: "td-green", text: "600m² in Camden 2570 · $720k" },
  { type: "Sold", dot: "td-red", text: "420m² in Leppington 2179 · $585k" },
  { type: "Listed", dot: "td-green", text: "465m² in Oran Park 2570 · $612k" },
  { type: "Sold", dot: "td-red", text: "550m² in Gregory Hills 2557 · $688k" },
  { type: "Under offer", dot: "td-amber", text: "410m² in Edmondson Park 2174" },
];

const MAP_PINS = [
  { cls: "pin-available pulse", top: "27%", left: "23%" },
  { cls: "pin-available", top: "39%", left: "36%" },
  { cls: "pin-available", top: "56%", left: "49%" },
  { cls: "pin-available", top: "41%", left: "64%" },
  { cls: "pin-sold", top: "31%", left: "55%" },
  { cls: "pin-sold", top: "63%", left: "29%" },
  { cls: "pin-sold", top: "49%", left: "77%" },
  { cls: "pin-offer", top: "21%", left: "71%" },
  { cls: "pin-offer", top: "69%", left: "61%" },
];

const PROPOSALS = [
  {
    featured: false,
    initials: "MH",
    color: "#1d3a58",
    name: "Meridian Homes",
    design: "The Kingsford 24 · Single storey",
    price: "$372,000",
    specs: [
      { val: "4", label: "Bed" },
      { val: "2", label: "Bath" },
      { val: "2", label: "Car" },
      { val: "24w", label: "Build" },
    ],
    inclusions: [
      "Stone benchtops throughout",
      "Ducted air conditioning — 1 zone",
      "Exposed aggregate driveway",
    ],
    cta: "line" as const,
    ctaLabel: "View full proposal",
  },
  {
    featured: true,
    initials: "SC",
    color: "#509242",
    name: "Southern Cross Builders",
    design: "The Hawkesbury 25 · Single storey",
    price: "$385,000",
    specs: [
      { val: "4", label: "Bed" },
      { val: "2.5", label: "Bath" },
      { val: "2", label: "Car" },
      { val: "26w", label: "Build" },
    ],
    inclusions: [
      "7-star energy rating included",
      "900mm appliances + stone benchtops",
      "Ducted air — 2 zones",
      "Landscaping to front boundary",
    ],
    cta: "solid" as const,
    ctaLabel: "Approach builder",
  },
  {
    featured: false,
    initials: "BW",
    color: "#4a5d72",
    name: "Bellwood Constructions",
    design: "The Camden 28 · Double storey",
    price: "$448,000",
    specs: [
      { val: "5", label: "Bed" },
      { val: "3", label: "Bath" },
      { val: "2", label: "Car" },
      { val: "32w", label: "Build" },
    ],
    inclusions: [
      "Double storey — maximises block",
      "Butler's pantry + media room",
      "Premium facade range",
    ],
    cta: "line" as const,
    ctaLabel: "View full proposal",
  },
];

function Reveal({
  className = "",
  delay,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const delayClass =
    delay === 1
      ? "rd1"
      : delay === 2
        ? "rd2"
        : delay === 3
          ? "rd3"
          : delay === 4
            ? "rd4"
            : delay === 5
              ? "rd5"
              : "";

  return (
    <div ref={ref} className={`reveal ${delayClass} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [msProgress, setMsProgress] = useState(false);
  const msTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const track = msTrackRef.current;
    if (!track) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setMsProgress(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    io.observe(track);
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing">
      <nav id="nav" className={navScrolled ? "scrolled" : undefined}>
        <Link href="/" className="nav-brand">
          <Image
            src="/velu-logo-nav.png"
            alt="Velu logo"
            width={120}
            height={34}
            priority
          />
          <span>Velu</span>
        </Link>
        <ul className="nav-links">
          <li>
            <a href="#how">How it works</a>
          </li>
          <li>
            <a href="#compare">Compare builders</a>
          </li>
          <li>
            <a href="#builders">For builders</a>
          </li>
          <li>
            <a href="#trust">Why Velu</a>
          </li>
        </ul>
        <Link href="/register/buyer" className="nav-cta">
          Get early access
        </Link>
      </nav>

      <section className="hero" id="hero">
        <div className="hero-grid" aria-hidden />
        <div className="hero-glow" aria-hidden />
        <div className="hero-content">
          <Image
            src="/velu-logo-hero.png"
            alt="Velu"
            width={600}
            height={270}
            className="hero-logo"
            priority
          />
          <h1>
            <span className="ln">You bring the land.</span>
            <span className="ln">
              <em>We connect you.</em>
            </span>
            <span className="ln">You review. You decide.</span>
          </h1>
          <p className="hero-sub">
            Whether you&apos;re searching for vacant land or already hold a
            block, Velu connects South West Sydney buyers with licensed builders
            the moment you&apos;re ready to build.
          </p>
          <div className="hero-actions">
            <Link href="/register/buyer" className="btn-green">
              Find vacant land
            </Link>
            <Link href="/register/buyer?intent=own-land" className="btn-outline">
              I already own land
            </Link>
            <Link href="/builders/join" className="btn-outline">
              Register builder interest →
            </Link>
            <Link href="/register/builder" className="btn-outline">
              I&apos;m a builder →
            </Link>
          </div>
          <div className="hero-pillars">
            <div className="pillar">
              <div className="pillar-icon">🏞️</div>
              <div className="pillar-label">Bring land</div>
              <div className="pillar-sub">Your block, your build</div>
            </div>
            <div className="pillar">
              <div className="pillar-icon">🤝</div>
              <div className="pillar-label">Connect with builders</div>
              <div className="pillar-sub">Verified &amp; matched to your block</div>
            </div>
            <div className="pillar">
              <div className="pillar-icon">📋</div>
              <div className="pillar-label">Review proposals</div>
              <div className="pillar-sub">Compare side by side</div>
            </div>
          </div>
        </div>
      </section>

      <div className="ticker-wrap">
        <div className="ticker">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span className="tick-item" key={`${item.type}-${i}`}>
              <span className={`tick-dot ${item.dot}`} />
              <strong>{item.type}</strong> · {item.text}
            </span>
          ))}
        </div>
      </div>

      <section className="problem" id="problem">
        <div className="problem-inner">
          <Reveal delay={1}>
            <span className="section-label">
              <span className="label-line" />
              The gap in the market
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="section-title centered">
              Three groups. All disconnected.
              <br />
              Until now.
            </h2>
          </Reveal>
          <div className="problem-grid">
            <Reveal className="problem-card" delay={2}>
              <div className="pc-icon">🔑</div>
              <div className="pc-role">Home buyer</div>
              <div className="pc-title">
                Six display home visits to make one decision
              </div>
              <div className="pc-desc">
                No way to compare verified builders, check credentials, or see
                real pricing — without driving to each display home blind.
              </div>
            </Reveal>
            <Reveal className="problem-card" delay={3}>
              <div className="pc-icon">🏗️</div>
              <div className="pc-role">Builder</div>
              <div className="pc-title">
                Misses buyers at the exact moment they&apos;re ready
              </div>
              <div className="pc-desc">
                A perfect client buys land two streets away — and the builder
                never knows. No visibility on sales. No way to reach buyers
                first.
              </div>
            </Reveal>
            <Reveal className="problem-card" delay={4}>
              <div className="pc-icon">📍</div>
              <div className="pc-role">Land agent</div>
              <div className="pc-title">No platform built for vacant land</div>
              <div className="pc-desc">
                Existing platforms focus on existing homes. Agents listing land
                for developers have no specialised marketplace for the
                new-build journey.
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="how-inner">
          <div className="how-header">
            <Reveal delay={1}>
              <span className="section-label">
                <span className="label-line" />
                How it works
              </span>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="section-title">
                From vacant block
                <br />
                to your front door.
              </h2>
            </Reveal>
          </div>
          <div className="steps">
            {[
              { icon: "🏞️", title: "Agent lists land", desc: "Verified agents add vacant blocks. Appears on the map instantly." },
              { icon: "🗺️", title: "Buyer browses", desc: "Filter by suburb, size, price, and zoning. Save searches with alerts." },
              { icon: "⚡", title: "Land sells", desc: "Matched builders notified in seconds. Only designs that physically fit." },
              { icon: "📋", title: "Compare proposals", desc: "Side-by-side pricing, inclusions, and build timelines." },
              { icon: "🏠", title: "Build tracked", desc: "Every milestone — slab to handover — visible in real time." },
            ].map((step) => (
              <div className="step" key={step.title}>
                <div className="step-num">
                  <span>{step.icon}</span>
                </div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="map-feature" id="map">
        <div className="map-inner">
          <div className="map-text">
            <Reveal delay={1}>
              <span className="section-label">
                <span className="label-line" />
                The live map
              </span>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="section-title">
                Real data. Updated the moment it happens.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="section-body">
                Every vacant block in South West Sydney — available, under
                offer, and recently sold. When a sale is recorded, the map
                updates in seconds. Not the next morning.
              </p>
            </Reveal>
            <div className="map-features-list">
              <Reveal className="map-feat" delay={2}>
                <div className="map-feat-dot dot-green" />
                <div>
                  <div className="map-feat-title">Available blocks</div>
                  <div className="map-feat-desc">
                    Live vacant land for sale. Click any pin for size, frontage,
                    price, and zoning.
                  </div>
                </div>
              </Reveal>
              <Reveal className="map-feat" delay={3}>
                <div className="map-feat-dot dot-amber" />
                <div>
                  <div className="map-feat-title">
                    NSW lot boundaries &amp; zoning
                  </div>
                  <div className="map-feat-desc">
                    Zoom in to see exact block boundaries and zoning codes from
                    NSW government data.
                  </div>
                </div>
              </Reveal>
              <Reveal className="map-feat" delay={4}>
                <div className="map-feat-dot dot-red" />
                <div>
                  <div className="map-feat-title">Recently sold</div>
                  <div className="map-feat-desc">
                    Real market context. Sold blocks stay visible for 90 days —
                    with independent value estimates.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
          <div className="map-visual">
            <div className="map-canvas">
              <div className="map-mockup">
                <div className="map-grid-bg" aria-hidden />
                {MAP_PINS.map((pin, i) => (
                  <div
                    key={i}
                    className={`map-pin ${pin.cls}`}
                    style={{ top: pin.top, left: pin.left }}
                  />
                ))}
                <div
                  className="map-label-box"
                  style={{ top: "27%", left: "23%", marginTop: "-58px" }}
                >
                  <div style={{ fontWeight: 600 }}>
                    450m² · $595,000 · R2
                  </div>
                </div>
                <div className="map-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#5aa84a" }} />
                    Available
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#dba94e" }} />
                    Under offer
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: "#e05b3a" }} />
                    Sold
                  </div>
                </div>
                <div className="map-live">
                  <span className="live-dot" />
                  LIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="compare" id="compare">
        <div className="compare-inner">
          <Reveal delay={1}>
            <span className="section-label" style={{ justifyContent: "center" }}>
              <span className="label-line" />
              Compare proposals
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="section-title centered">
              Verified builders.
              <br />
              Side by side.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="section-body centered">
              When your land sells, matched builders submit proposals built
              around your exact block. You compare everything in one view.
            </p>
          </Reveal>
          <div className="compare-cards">
            {PROPOSALS.map((p) => (
              <div
                key={p.name}
                className={`cc${p.featured ? " featured" : ""}`}
              >
                {p.featured && (
                  <div className="cc-pop">Best match for your block</div>
                )}
                <div className="cc-builder">
                  <div
                    className="cc-avatar"
                    style={{ background: p.color }}
                  >
                    {p.initials}
                  </div>
                  <div>
                    <div className="cc-name">{p.name}</div>
                    <div className="cc-verified">✓ Verified · Licensed NSW</div>
                  </div>
                </div>
                <div className="cc-design">{p.design}</div>
                <div className="cc-price">{p.price}</div>
                <div className="cc-price-note">Indicative estimate · incl. GST</div>
                <div className="cc-specs">
                  {p.specs.map((s) => (
                    <div className="cc-spec" key={s.label}>
                      <div className="cc-spec-val">{s.val}</div>
                      <div className="cc-spec-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                <ul className="cc-list">
                  {p.inclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link
                  href="/register/buyer"
                  className={`cc-btn ${p.cta}`}
                >
                  {p.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
          <p className="compare-note">
            All prices are indicative estimates based on publicly available land
            dimensions — subject to soil testing, site cost assessment, and
            council approvals. Your contact details remain private until you
            choose to approach a builder.
          </p>
        </div>
      </section>

      <section className="builder-feature" id="builders">
        <div className="builder-inner">
          <div>
            <Reveal delay={1}>
              <span className="section-label">
                <span className="label-line" />
                For verified builders
              </span>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="section-title">
                Be the first builder they see — the moment their land settles.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="section-body">
                Velu connects verified builders with land buyers at the exact
                moment of settlement. When a buyer registers their new block,
                you&apos;re notified in real time and your verified profile and
                current packages go straight to them. No more waiting for
                walk-ins — reach motivated clients the day they&apos;re ready to
                build.
              </p>
            </Reveal>
            <div className="map-features-list">
              <Reveal className="map-feat" delay={2}>
                <div className="map-feat-dot dot-green" />
                <div>
                  <div className="builder-feat-title">Frontage matching</div>
                  <div className="builder-feat-desc">
                    Only notified when a block&apos;s dimensions fit your
                    uploaded designs. Zero irrelevant leads.
                  </div>
                </div>
              </Reveal>
              <Reveal className="map-feat" delay={3}>
                <div className="map-feat-dot dot-green" />
                <div>
                  <div className="builder-feat-title">Under 3 seconds</div>
                  <div className="builder-feat-desc">
                    Real-time alerts the moment the agent records the sale —
                    before any competitor knows the block exists.
                  </div>
                </div>
              </Reveal>
              <Reveal className="map-feat" delay={4}>
                <div className="map-feat-dot dot-green" />
                <div>
                  <div className="builder-feat-title">Direct to the buyer</div>
                  <div className="builder-feat-desc">
                    Your design and pricing land in front of the buyer alongside
                    a small number of other verified builders. No middlemen.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
          <Reveal delay={2}>
            <div className="builder-visual">
              <div className="bv-header">
                <div className="bv-dot" style={{ background: "#ff5f56" }} />
                <div className="bv-dot" style={{ background: "#febc2e" }} />
                <div className="bv-dot" style={{ background: "#28c840" }} />
              </div>
              <div className="bv-content">
                <div className="bv-step">
                  <div className="bv-num">✓</div>
                  <div>
                    <div className="bv-step-title">Builder&apos;s licence</div>
                    <div className="bv-step-sub">
                      NSW Fair Trading — valid to Jun 2027
                    </div>
                  </div>
                  <div className="bv-badge">Verified</div>
                </div>
                <div className="bv-step">
                  <div className="bv-num">✓</div>
                  <div>
                    <div className="bv-step-title">Insurance certificate</div>
                    <div className="bv-step-sub">
                      HBCF + Public Liability confirmed
                    </div>
                  </div>
                </div>
                <div className="bv-step">
                  <div className="bv-num">✓</div>
                  <div>
                    <div className="bv-step-title">Home designs uploaded</div>
                    <div className="bv-step-sub">
                      4 active designs — from 10m frontage
                    </div>
                  </div>
                </div>
                <div className="bv-step">
                  <div className="bv-num">✓</div>
                  <div>
                    <div className="bv-step-title">Profile approved</div>
                    <div className="bv-step-sub">Lead feed active</div>
                  </div>
                </div>
                <div className="bv-alert">
                  <span style={{ fontSize: 22 }}>⚡</span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--green)",
                        marginBottom: 2,
                      }}
                    >
                      New lead — Ingleburn 2565
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-mid)" }}>
                      450m² · 15.5m frontage · R2 · Sold 38 seconds ago · 2 of
                      your designs fit
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="milestones-section" id="milestones">
        <div className="ms-inner">
          <Reveal delay={1}>
            <span className="section-label" style={{ justifyContent: "center" }}>
              <span className="label-line" />
              After you choose
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="section-title centered">
              Watch your home being built.
              <br />
              Stage by stage.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="section-body centered">
              Once your contract is signed, your builder updates every milestone
              on Velu — and you see it the moment it happens.
            </p>
          </Reveal>
          <div className="ms-track" ref={msTrackRef}>
            <div className={`ms-progress${msProgress ? " visible" : ""}`} />
            {[
              { state: "done", icon: "📋", name: "Contract", date: "12 Mar" },
              { state: "done", icon: "🏗️", name: "Slab", date: "28 Apr" },
              { state: "active", icon: "🪵", name: "Frame", date: "In progress" },
              { state: "upcoming", icon: "🔒", name: "Lock-up", date: "Est. Jul" },
              { state: "upcoming", icon: "🔧", name: "Fixing", date: "Est. Aug" },
              { state: "upcoming", icon: "🏠", name: "Handover", date: "Est. Oct" },
            ].map((m) => (
              <div className={`ms-item ${m.state}`} key={m.name}>
                <div className="ms-circle">
                  <span>{m.icon}</span>
                </div>
                <div className="ms-name">{m.name}</div>
                <div className="ms-date">{m.date}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="trust" id="trust">
        <div className="trust-inner">
          <Reveal delay={1}>
            <span className="section-label" style={{ justifyContent: "center" }}>
              <span className="label-line" />
              Why Velu
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="section-title centered">
              Built on trust. Backed by law.
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="section-body centered">
              Every interaction on Velu is designed to protect the people who
              matter most — the buyers building their homes.
            </p>
          </Reveal>
          <div className="trust-grid">
            {[
              {
                icon: "🛡️",
                title: "Only verified builders",
                desc: "Licence checked against the NSW register, insurance confirmed, profile reviewed by the Velu team. No builder reaches buyers until every step is complete.",
                delay: 2,
              },
              {
                icon: "🔒",
                title: "Your details stay private",
                desc: 'Builders cannot see your name, phone, or email until you explicitly click "Approach Builder." Privacy Act 1988 compliant by design.',
                delay: 3,
              },
              {
                icon: "🇦🇺",
                title: "Data stays in Australia",
                desc: "Everything is stored on servers in Sydney. No personal information leaves Australian shores.",
                delay: 4,
              },
              {
                icon: "⚠️",
                title: "Honest pricing, always",
                desc: "Every proposal carries a mandatory disclaimer — indicative pricing subject to soil testing and council approvals. No one can mislead you.",
                delay: 2,
              },
              {
                icon: "📊",
                title: "Full build transparency",
                desc: "From contract to keys, every milestone of your build is tracked and visible — with automatic alerts if updates fall behind.",
                delay: 3,
              },
              {
                icon: "📍",
                title: "Vacant land only",
                desc: "Velu is built exclusively for new homes on vacant land. No existing homes, no rentals — a platform with one clear purpose.",
                delay: 4,
              },
            ].map((card) => (
              <Reveal key={card.title} className="trust-card" delay={card.delay}>
                <div className="trust-icon">{card.icon}</div>
                <div className="trust-title">{card.title}</div>
                <div className="trust-desc">{card.desc}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-inner">
          <div className="stat">
            <div className="stat-val">$140B</div>
            <div className="stat-label">
              Annual Australian residential construction market
            </div>
          </div>
          <div className="stat">
            <div className="stat-val">300K+</div>
            <div className="stat-label">
              Licensed builders in Australia — all underserved
            </div>
          </div>
          <div className="stat">
            <div className="stat-val">
              <em>0</em>
            </div>
            <div className="stat-label">
              Platforms connecting vacant land buyers to verified builders at the
              moment of sale
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="cta">
        <div className="cta-glow" aria-hidden />
        <div className="cta-content">
          <Reveal delay={1}>
            <Image
              src="/velu-logo-cta.png"
              alt="Velu"
              width={120}
              height={120}
              className="cta-logo"
            />
          </Reveal>
          <Reveal delay={1}>
            <h2 className="cta-h">
              Building a home should
              <br />
              feel <em>exciting.</em>
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="cta-sub">
              Join the waitlist for early access — launching in South West
              Sydney.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="cta-actions">
              <Link href="/register/buyer" className="btn-green">
                Find vacant land
              </Link>
              <Link href="/builders/join" className="btn-outline">
                Register builder interest
              </Link>
              <Link href="/register/builder" className="btn-outline">
                Join as a builder
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <Image
              src="/velu-logo-nav.png"
              alt="Velu logo"
              width={120}
              height={30}
            />
            <span>Velu</span>
          </div>
          <ul className="footer-links">
            <li>
              <a href="#how">How it works</a>
            </li>
            <li>
              <a href="#builders">For builders</a>
            </li>
            <li>
              <Link href="/login">Sign in</Link>
            </li>
          </ul>
          <span className="footer-copy">
            © 2026 Velu Pty Ltd · Ingleburn NSW
          </span>
        </div>
      </footer>
    </div>
  );
}
