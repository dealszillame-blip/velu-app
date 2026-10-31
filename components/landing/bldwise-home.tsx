"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./bldwise-home.css";

const JOURNEY_STEPS = [
  ["01", "Your land", "Address, boundaries, fall, purchase and settlement details."],
  ["02", "Your home", "Bedrooms, storeys, frame type, budget and must-have inclusions."],
  ["03", "Site reports", "Soil, geotechnical and survey data before builders price."],
  ["04", "Matched builders", "Licensed NSW builders suited to your land, area and brief."],
  ["05", "One template", "Each builder answers the same specification and inclusions list."],
  ["06", "Compare", "Side-by-side pricing, gaps, allowances, upgrades and questions."],
  ["07", "Choose", "A clear recommendation before display homes and contract signing."],
  ["08", "Build", "Milestones, checks, payments and add-on services through handover."],
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
    body: "Land is owned, measured and moving toward tender. Builders price real opportunities, not window-shopping.",
  },
  {
    title: "One response format",
    body: "Brands, sizes, quality tier, tag marks, inclusions, variations and upgrades are captured in one template.",
  },
  {
    title: "Success fee model",
    body: "Homeowners use BLD-Wise free. Builders pay a 1% success fee only when a contract is signed.",
  },
];

const PROBLEM_STATS = [
  ["$517k", "Average approved value of a new NSW house cited in the application."],
  ["23%", "New builds finishing on schedule in the referenced Equifax iCIRT survey."],
  ["377k", "New homes NSW is targeting by 2029."],
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bw-home">
      <div className="bw-proto">
        Launching in NSW in March 2027. Builders, prices and examples shown here are illustrative.
      </div>

      <header className={`bw-site-head${scrolled ? " is-scrolled" : ""}`}>
        <div className="bw-wrap bw-head-inner">
          <Link href="/" className="bw-logo" aria-label="BLD-Wise home">
            BLD<span>-</span>Wise
          </Link>
          <nav className="bw-nav" aria-label="Main">
            <a href="#journey">Landowner journey</a>
            <a href="#template">Template</a>
            <a href="#builders">For builders</a>
            <a href="#milestones">Milestones</a>
          </nav>
          <Link href="/login" className="bw-nav-cta">
            Start with your land
          </Link>
        </div>
      </header>

      <main>
        <section className="bw-wrap bw-hero">
          <Reveal className="bw-hero-copy">
            <p className="bw-eyebrow">For NSW landowners ready to build</p>
            <h1>You own the land. Now choose the builder with the facts in hand.</h1>
            <p className="bw-lede">
              BLD-Wise takes you from a block of land to a finished home: get site
              reports first, ask every builder to quote the same specification, compare
              what is included and missing, then track each milestone until handover.
            </p>
            <div className="bw-actions">
              <Link href="/login" className="bw-btn bw-btn-primary">
                Register your land
              </Link>
              <Link href="/buyer/compare" className="bw-btn">
                Compare proposals
              </Link>
              <Link href="/builders/join" className="bw-btn">
                I am a builder
              </Link>
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

        <section className="bw-band bw-problem">
          <div className="bw-wrap">
            <Reveal className="bw-section-head centered">
              <p className="bw-eyebrow">The problem from the application</p>
              <h2>Homeowners are not short on builders. They are short on clarity.</h2>
              <p>
                Quotes describe specifications, materials, inclusions and allowances in
                different ways. Site conditions can change the price, and after signing
                there is often no clear view of what to check before each payment.
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
                BLD-Wise maps every builder response to one schedule: included,
                excluded, allowance, standard, premium, upgrade and variation.
              </p>
            </Reveal>
            <Reveal className="bw-rule-card">
              <span>After signing</span>
              <h3>The guide stays with you.</h3>
              <p>
                Contract checks, payment stages, inspections and add-on services appear
                when they matter, not months too early.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="bw-band bw-template" id="template">
          <div className="bw-wrap">
            <div className="bw-template-grid">
              <Reveal className="bw-section-head">
                <p className="bw-eyebrow">One standard template</p>
                <h2>A bill-of-quantities style comparison, built for home builders.</h2>
                <p>
                  The prototype theme&apos;s schedule view is the right pattern for this
                  product: enough structure for builders, plain enough for homeowners.
                </p>
                <ul className="bw-checks">
                  <li>Item, size or thickness, brand and model</li>
                  <li>Standard or premium tier</li>
                  <li>Included, excluded, allowance or variation</li>
                  <li>Tag mark so the contract item can be found again</li>
                </ul>
              </Reveal>
              <Reveal className="bw-table-card">
                <div className="bw-sheet-top">
                  <span>Example schedule</span>
                  <em>Fictional</em>
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

        <section className="bw-wrap bw-band" id="builders">
          <div className="bw-split">
            <Reveal className="bw-section-head">
              <p className="bw-eyebrow">For builders</p>
              <h2>Meet landowners who are ready to build.</h2>
              <p>
                Every request comes from someone who owns their land, knows the site
                details and is comparing a shortlist. You receive a code, fill in one
                template, and your offer is shown beside the others in the same format.
              </p>
              <div className="bw-actions">
                <Link href="/builders/join" className="bw-btn bw-btn-primary">
                  Register builder interest
                </Link>
                <Link href="/register/builder" className="bw-btn">
                  Create builder account
                </Link>
              </div>
            </Reveal>
            <div className="bw-builder-points">
              {BUILDER_POINTS.map((point) => (
                <Reveal className="bw-builder-point" key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-band bw-milestones" id="milestones">
          <div className="bw-wrap">
            <Reveal className="bw-section-head centered">
              <p className="bw-eyebrow">After you choose</p>
              <h2>BLD-Wise stays from contract to keys.</h2>
              <p>
                The PDF is clear: the product should not stop at matching. The app
                should guide what to do next, what to check, and which services belong
                at each stage.
              </p>
            </Reveal>
            <div className="bw-milestone-grid">
              {[
                ["Contract", "Deposit limit, HBCF certificate, soil class and variation process."],
                ["Pre-construction", "Selections, BASIX, CDC or DA, survey and reports."],
                ["Base", "Slab class, piers and mandatory inspection before payment."],
                ["Frame", "Frame certificate and independent inspection access."],
                ["Lock-up", "Glazing, insulation, lender schedule and progress claim."],
                ["Handover", "Defects list, warranties and documents before final payment."],
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
        <span>Prototype positioning adapted from the supplied review HTML and application draft.</span>
      </footer>
    </div>
  );
}
