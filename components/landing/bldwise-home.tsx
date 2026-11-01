"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./bldwise-home.css";

const JOURNEY_STEPS = [
  ["01", "Your land", "Address, boundaries, fall, purchase and settlement details."],
  ["02", "Your home", "Bedrooms, storeys, frame type, budget and must-have inclusions."],
  ["03", "Site reports", "Soil, geotechnical and survey data before builders price."],
  ["04", "Builder quotes", "We request quotes from multiple builders for your project."],
  ["05", "One template", "Every builder quotes on the same standard template."],
  ["06", "Compare", "Line by line across inclusions, exclusions, specifications and allowances."],
  ["07", "Choose", "A clear recommendation, so you visit only a shortlist of display homes."],
  ["08", "Build", "A milestone tracker from approvals and contract signing through to handover."],
];

const TEMPLATE_ROWS = [
  {
    item: "Site costs",
    requirement: "Soil class, rock, cut, fill and spoil stated",
    harbourline: "Allowance",
    redgum: "Fixed",
    southwest: "Fixed",
  },
  {
    item: "Kitchen benchtop",
    requirement: "40 mm stone, waterfall edge",
    harbourline: "+$2,400",
    redgum: "Included",
    southwest: "Included",
  },
  {
    item: "Glazing",
    requirement: "Double glazed throughout",
    harbourline: "+$6,500",
    redgum: "Included",
    southwest: "Included",
  },
  {
    item: "Heating and cooling",
    requirement: "Ducted reverse cycle, 4 zones",
    harbourline: "+$9,000",
    redgum: "+$1,800",
    southwest: "Included",
  },
];

const BUILDER_POINTS = [
  {
    title: "Qualified requests",
    body: "Homeowners already own their land and are ready to build, so builders spend their time on serious customers.",
  },
  {
    title: "One response format",
    body: "Inclusions, exclusions, specifications and allowances are captured in one standard template.",
  },
  {
    title: "Success fee model",
    body: "Homeowners use BLD-Wise free. Builders pay a 1% success fee only when a contract is signed.",
  },
];

const DIFFERENCE_CARDS = [
  {
    title: "One template",
    body: "Every builder quotes on the same template, so differences in inclusions, exclusions, specifications and allowances show up line by line.",
  },
  {
    title: "Ground checked first",
    body: "We recommend soil and geotechnical reports first, so builders can price the site from real data instead of allowances.",
  },
  {
    title: "We stay after you sign",
    body: "A milestone tracker shows where the project is, what to check or do next, and brings in add-on services when each stage arrives.",
  },
];

const PROBLEM_STATS = [
  ["$517k", "Average value of a new private house approval, 2025-26 (ABS)."],
  ["23%", "Of new builds finished on schedule in the past year (Equifax iCIRT survey, Sep 2026)."],
  ["12+ months", "To build a new house in NSW, against about 9 before the pandemic (Master Builders NSW, citing ABS)."],
];

const VALIDATION_POINTS = [
  {
    label: "Paid proof",
    title: "Five people have paid for a manual tender review.",
    body: "$250 each, $1,250 in total since March 2026, through a paid tender-analysis service run on social media.",
  },
  {
    label: "Customer calls",
    title: "We have spoken with 30 to 40 prospective homeowners.",
    body: "The same two things kept coming up: they do not understand why items are in a tender or how good they are, and they do not know what the best option on the market is.",
  },
  {
    label: "Audience",
    title: "Homeowners follow the build journey.",
    body: "A home-building account started in November 2025 reaches 1,850 followers, 86% in Australia, and about 80,000 views a month.",
  },
];

const TEAM_POINTS = [
  {
    title: "Construction cost expertise",
    body: "Furqan is a chartered civil engineer (CPEng) and Certified Cost Professional (CCP) with 13+ years on major construction projects in project controls and cost management. He also reviews real builder tenders for homeowners.",
  },
  {
    title: "Software and infrastructure",
    body: "Ubaid is a Control Systems Engineer at AWS with 7+ years in industrial and building automation, and has built and deployed a full-stack web application end to end.",
  },
  {
    title: "Lived problem",
    body: "Furqan is building his own home in Sydney and Ubaid built his two years ago. Both struggled to choose a builder, compare tenders and understand inclusions and exclusions.",
  },
];

const INSIGHT_POINTS = [
  "Homeowners do not need more quotes. They need to understand what is behind each one, and a guide who stays after they sign.",
  "The cheapest decisions happen before tender: soil and geotechnical reports let builders price the site from real data.",
  "Most platforms we have seen stop at signing, just when reports, approvals and milestones start piling up.",
];

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -48px", threshold: 0.12 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`bw-reveal ${className}`.trim()}>
      {children}
    </div>
  );
}

export function BldwiseHome() {
  const [scrolled, setScrolled] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bw-home" data-theme="light">
      <div className="bw-proto">
        Planning to launch in NSW in March 2027. Builders, prices and examples shown here are illustrative.
      </div>

      <header className={`bw-site-head${scrolled ? " is-scrolled" : ""}`}>
        <div className="bw-wrap bw-head-inner">
          <Link href="/" className="bw-logo" aria-label="BLD-Wise home">
            <Image
              src="/bldwise-logo-wordmark.png"
              alt="BLD-Wise.com.au"
              width={220}
              height={52}
              priority
            />
          </Link>
          <nav className="bw-nav" aria-label="Main">
            <a href="#start">Start with your land</a>
            <a href="#builders">For builders</a>
            <a href="#portal">Builder portal</a>
            <a href="#check">Check existing quotes</a>
          </nav>
          <Link href="/login" className="bw-nav-cta">
            Start with your land
          </Link>
        </div>
      </header>

      <main>
        <section className="bw-wrap bw-hero" id="start">
          <Reveal className="bw-hero-copy">
            <p className="bw-eyebrow">For landowners ready to build - starting in NSW</p>
            <h1>You own the land. Now choose the builder with the facts in hand.</h1>
            <p className="bw-lede">
              Tell us about your land and the home you want. We recommend soil
              and geotechnical reports first, so builders price your real site.
              Then we request quotes from multiple builders on one standard
              template, review them line by line, and recommend one before you
              sign. After that we stay with you through every milestone.
            </p>
            <div className="bw-actions">
              <Link href="/login" className="bw-btn bw-btn-primary">
                Start with your land
              </Link>
              <a href="#builders" className="bw-btn">
                I am a builder
              </a>
              <a href="#check" className="bw-btn">
                Check existing quotes
              </a>
            </div>
          </Reveal>

          <Reveal className="bw-sheet-card">
            <div className="bw-sheet-top">
              <span>Land to living</span>
              <span>8 steps</span>
            </div>
            <ol className="bw-journey-list">
              {JOURNEY_STEPS.map(([no, title, body]) => (
                <li key={no}>
                  <span>{no}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section className="bw-wrap bw-band bw-difference">
          <Reveal className="bw-section-head">
            <p className="bw-eyebrow">What is different</p>
            <h2>Quotes that answer the same questions.</h2>
          </Reveal>
          <div className="bw-three">
            {DIFFERENCE_CARDS.map((card) => (
              <Reveal className="bw-rule-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bw-band bw-problem">
          <div className="bw-wrap">
            <Reveal className="bw-section-head centered">
              <p className="bw-eyebrow">The problem</p>
              <h2>Homeowners are not short on builders. They are short on clarity.</h2>
              <p>
                Building a home is one of the largest financial decisions a household
                makes. Yet buyers compare quotes that describe specifications,
                materials, inclusions and allowances in different ways, and after
                signing there is often no single guide on what happens next.
              </p>
            </Reveal>
            <div className="bw-stats">
              {PROBLEM_STATS.map(([value, label]) => (
                <Reveal className="bw-stat" key={value}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-wrap bw-band bw-proof">
          <Reveal className="bw-section-head">
            <p className="bw-eyebrow">Why now</p>
            <h2>Built from real tender reviews.</h2>
            <p>
              In those reviews, homeowners could not tell why items were in a
              tender or how good they were.
            </p>
          </Reveal>
          <div className="bw-proof-grid">
            {VALIDATION_POINTS.map((point) => (
              <Reveal className="bw-evidence-card" key={point.title}>
                <span>{point.label}</span>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bw-band bw-insight">
          <div className="bw-wrap bw-split">
            <Reveal className="bw-section-head">
              <p className="bw-eyebrow">The non-obvious insight</p>
              <h2>The hard part is not finding a builder. It is knowing what you are buying.</h2>
              <p>
                Two builders can quote the same house with different specifications,
                materials and allowances. A first-time builder often cannot see the
                difference until it is too late or too expensive to change.
              </p>
            </Reveal>
            <Reveal className="bw-note-card">
              <div className="bw-sheet-top">
                <span>What BLD-Wise believes</span>
              </div>
              <ul>
                {INSIGHT_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="bw-wrap bw-band">
          <Reveal className="bw-section-head">
            <p className="bw-eyebrow">Why this team</p>
            <h2>Construction cost expertise plus software execution.</h2>
          </Reveal>
          <div className="bw-three">
            {TEAM_POINTS.map((point) => (
              <Reveal className="bw-rule-card" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bw-wrap bw-band" id="journey">
          <Reveal className="bw-section-head">
            <p className="bw-eyebrow">What changes</p>
            <h2>Before tender, at tender, and through every milestone.</h2>
          </Reveal>
          <div className="bw-three">
            <Reveal className="bw-rule-card">
              <span>Before tender</span>
              <h3>Price the site from facts.</h3>
              <p>
                Soil, geotechnical and survey reports come first, because the site is
                where price risk starts. Builders see the same land facts before they
                quote.
              </p>
            </Reveal>
            <Reveal className="bw-rule-card">
              <span>At tender</span>
              <h3>Quotes answer the same questions.</h3>
              <p>
                We review the quotes line by line across inclusions, exclusions,
                specifications and allowances, and check whether materials are
                standard or premium.
              </p>
            </Reveal>
            <Reveal className="bw-rule-card">
              <span>After signing</span>
              <h3>The guide stays with you.</h3>
              <p>
                Services such as BAL assessments, acoustic reports, fencing,
                landscaping and solar appear only when that milestone arrives, so
                nothing is sold too early and nothing is missed.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="bw-wrap bw-band" id="builders">
          <div className="bw-split">
            <Reveal className="bw-section-head">
              <p className="bw-eyebrow">For builders</p>
              <h2>Meet landowners who are ready to build.</h2>
              <p>
                Every request comes from a landowner who already owns their land and
                is ready to build. You fill in one standard template, and your
                quote is shown beside the others in the same format. Homeowners
                use BLD-Wise free. Builders pay a 1% success fee only when a
                homeowner introduced through BLD-Wise signs a building contract.
              </p>
              <div className="bw-actions">
                <Link href="/builders/join" className="bw-btn bw-btn-primary">
                  Register interest
                </Link>
                <a href="#portal" className="bw-btn">
                  Try the builder template
                </a>
              </div>
            </Reveal>
            <Reveal className="bw-lead-card">
              <div className="bw-sheet-top">
                <span>Example request</span>
                <em>Ready to build</em>
              </div>
              <dl className="bw-facts">
                <dt>Land</dt>
                <dd>4 sides, 400 sqm, settled</dd>
                <dt>Fall</dt>
                <dd>1.2 m across the lot</dd>
                <dt>Home</dt>
                <dd>Double storey, 4 bed, timber</dd>
                <dt>Budget</dt>
                <dd>Up to $520,000</dd>
                <dt>Site reports</dt>
                <dd>Geotech: class H1</dd>
                <dt>Shortlist</dt>
                <dd>3 builders</dd>
              </dl>
            </Reveal>
          </div>
          <div className="bw-three bw-builder-strip">
            {BUILDER_POINTS.map((point) => (
              <Reveal className="bw-builder-point" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bw-band bw-portal" id="portal">
          <div className="bw-wrap bw-template-grid">
            <Reveal className="bw-section-head">
              <p className="bw-eyebrow">Builder portal</p>
              <h2>Open a request and fill in the template.</h2>
              <p>
                This is the builder-facing side of the same workflow: a job summary
                and a fixed list of specification fields.
              </p>
            </Reveal>
            <Reveal className="bw-portal-card">
              <div className="bw-sheet-top">
                <span>Template fields</span>
              </div>
              <ul className="bw-template-fields">
                <li><b>Thickness or size</b><span>40 mm, 2700 mm, R4.0, class H1</span></li>
                <li><b>Quality tier</b><span>Standard or premium</span></li>
                <li><b>Price basis</b><span>Included, allowance, excluded</span></li>
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="bw-band bw-template" id="check">
          <div className="bw-wrap">
            <div className="bw-template-grid">
              <Reveal className="bw-section-head">
                <p className="bw-eyebrow">Quote Compare</p>
                <h2>Compare builder quotes, like for like.</h2>
                <p>
                  Upload or enter builder quotes for the same job. BLD-Wise maps
                  them line by line across inclusions, exclusions, specifications
                  and allowances, and gives you the right questions to ask each builder.
                </p>
                <ul className="bw-checks">
                  <li>One schedule across every builder</li>
                  <li>Standard or premium materials, against what the market commonly offers</li>
                  <li>Questions to ask before you choose</li>
                </ul>
              </Reveal>
              <Reveal className="bw-table-card">
                <div className="bw-sheet-top">
                  <span>Example schedule</span>
                </div>
                <div className="bw-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Requirement</th>
                        <th>Harbourline</th>
                        <th>Redgum</th>
                        <th>Southwest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEMPLATE_ROWS.map((row) => (
                        <tr key={row.item}>
                          <th scope="row">{row.item}</th>
                          <td>{row.requirement}</td>
                          <td>{row.harbourline}</td>
                          <td>{row.redgum}</td>
                          <td>{row.southwest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="bw-band bw-milestones" id="milestones">
          <div className="bw-wrap">
            <Reveal className="bw-section-head centered">
              <p className="bw-eyebrow">After you choose</p>
              <h2>BLD-Wise stays from contract to keys.</h2>
              <p>
                BLD-Wise does not stop at the tender. At each milestone it shows where
                the project is, what you need to do or check next, and what decisions
                are coming.
              </p>
            </Reveal>
            <div className="bw-milestone-grid">
              {[
                ["Approvals", "Soil and geotechnical reports first, then the approvals your build needs."],
                ["Contract", "What to check and decide before you sign with your chosen builder."],
                ["Base", "Where the project is and what to check at the base stage."],
                ["Frame", "Where the project is and what to check at the frame stage."],
                ["Lock-up", "What decisions are coming, and which services belong at this stage."],
                ["Handover", "What to check before you take the keys."],
              ].map(([title, body], index) => (
                <Reveal className="bw-milestone" key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-wrap bw-wait">
          <div>
            <h2>Planning to launch in NSW in March 2027.</h2>
            <p>Leave your email and we will tell you when it opens. Landowners and builders are both welcome.</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setWaitlistMessage("This is a prototype, so nothing was sent. At launch this form will save your details.");
            }}
          >
            <label htmlFor="bw-email">Email</label>
            <input id="bw-email" type="email" placeholder="you@example.com" required />
            <label htmlFor="bw-role">I am a</label>
            <select id="bw-role" defaultValue="Landowner ready to build">
              <option>Landowner ready to build</option>
              <option>Builder</option>
              <option>Other</option>
            </select>
            <button className="bw-btn bw-btn-primary" type="submit">
              Join the waitlist
            </button>
            <p className="bw-form-msg" role="status" aria-live="polite">
              {waitlistMessage}
            </p>
          </form>
        </section>

        <section className="bw-wrap bw-cta">
          <Reveal>
            <div>
              <p className="bw-eyebrow">Starting in NSW</p>
              <h2>Build with fewer guesses.</h2>
              <p>
                Register your land, request the reports, invite builders to one
                standard template and compare the answers before you sign.
              </p>
            </div>
            <div className="bw-actions">
              <Link href="/login" className="bw-btn bw-btn-primary">
                Start with your land
              </Link>
              <Link href="/builders/join" className="bw-btn bw-btn-light">
                Builder interest
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="bw-wrap bw-foot">
        <span>BLD-Wise - land to living - starting in NSW</span>
        <span>bld-wise.com.au</span>
      </footer>
    </div>
  );
}
