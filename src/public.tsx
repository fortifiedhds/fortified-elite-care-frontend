import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ClipboardList,
  House,
  Mail,
  Menu,
  Phone,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import { Brand } from "./shared";

const contactUrl = "https://www.fortifiedhds.com/contact";
const steps = [
  {
    icon: ClipboardList,
    title: "Tell us about yourself",
    detail:
      "Share your details and a preferred date. Our care team reviews your enrolment and helps coordinate your first visit.",
  },
  {
    icon: Stethoscope,
    title: "Meet your doctor at home",
    detail:
      "A medical doctor visits to carry out routine checks, discuss how you’re doing, and note any follow-up needs.",
  },
  {
    icon: CalendarDays,
    title: "Keep track of your care",
    detail:
      "See upcoming visits and approved summaries in your portal. The team can help coordinate referrals when needed.",
  },
];

const packages = [
  {
    name: "Silver",
    subtitle: "Essential home health support",
    items: [
      "Monthly doctor-led home visits",
      "Routine vital signs checks",
      "Health education and medication reminders",
    ],
  },
  {
    name: "Gold",
    subtitle: "Enhanced health and wellness care",
    items: [
      "Everything in Silver",
      "Periodic tests and closer monitoring",
      "Caregiver guidance and referral support",
    ],
  },
  {
    name: "Platinum",
    subtitle: "More personalised care coordination",
    items: [
      "Everything in Gold",
      "Extended monitoring and follow-up",
      "Family consultations and detailed reports",
    ],
  },
];

export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="public-header">
      <div className="wrap header-inner">
        <Brand />
        <button
          className="button icon mobile-menu"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="public-navigation"
          aria-label={menu ? "Close menu" : "Open menu"}
        >
          {menu ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav
          id="public-navigation"
          className={menu ? "public-nav open" : "public-nav"}
          aria-label="Main navigation"
          onClick={() => setMenu(false)}
        >
          <a href="/#how-it-works">How it works</a>
          <a href="/#packages">Care packages</a>
          <Link to="/for-doctors">For doctors</Link>
          <Link
            className="button small outline"
            to={signedIn ? "/portal" : "/login"}
          >
            {signedIn ? "My portal" : "Sign in"}{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="wrap footer-grid">
        <div>
          <Brand light />
          <p>
            Routine healthcare support for older adults, in familiar
            surroundings.
          </p>
        </div>
        <div>
          <strong>Explore</strong>
          <a href="/#how-it-works">How it works</a>
          <a href="/#packages">Care packages</a>
          <Link to="/for-doctors">For doctors</Link>
        </div>
        <div>
          <strong>Contact Fortified HDS</strong>
          <a href="mailto:fhdsltd@gmail.com">
            <Mail size={16} aria-hidden="true" /> fhdsltd@gmail.com
          </a>
          <a href="tel:+2348067294003">
            <Phone size={16} aria-hidden="true" /> +234 806 729 4003
          </a>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>Fortified Health & Development Solutions Limited</span>
        <span>
          Routine care only. For emergencies, seek immediate medical help.
        </span>
      </div>
    </footer>
  );
}

export function PublicHome({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <PublicHeader signedIn={signedIn} />
      <main id="main-content">
        <section className="wrap hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> HOME HEALTHCARE FOR OLDER ADULTS
            </p>
            <h1>
              Doctor-led care,
              <br /> <em>closer to home.</em>
            </h1>
            <p className="lede">
              Routine home visits that help older adults stay on top of their
              health and give families a clearer picture of their care.
            </p>
            <div className="actions">
              <Link className="button primary" to="/register?role=patient">
                Start patient enrolment{" "}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className="button text" href="#how-it-works">
                How it works <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="hero-note">
              <ShieldCheck size={17} aria-hidden="true" /> A programme by
              Fortified Health & Development Solutions
            </p>
          </div>
          <figure className="hero-image">
            <img
              src="/home-visit.jpg"
              alt="A healthcare professional checking a client's blood pressure"
              fetchPriority="high"
              width="6000"
              height="4000"
            />
            <figcaption>
              <span className="icon-box">
                <House size={22} aria-hidden="true" />
              </span>
              <span>
                <strong>Monthly home checkups</strong>
                <small>Routine monitoring and follow-up support</small>
              </span>
            </figcaption>
          </figure>
        </section>
        <section className="principles" aria-label="What the programme offers">
          <div className="wrap principles-inner">
            <span>
              <Stethoscope size={21} /> Medical doctor visits
            </span>
            <span>
              <CalendarDays size={21} /> Monthly routine checkups
            </span>
            <span>
              <House size={21} /> Care in familiar surroundings
            </span>
          </div>
        </section>
        <section className="wrap section" id="how-it-works">
          <div className="section-intro">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>From enrolment to your first visit</h2>
            <p>
              Our care team helps coordinate the visit and supports you with
              next steps.
            </p>
          </div>
          <div className="three-columns">
            {steps.map(({ icon: Icon, title, detail }, index) => (
              <article className="step" key={title}>
                <div className="step-top">
                  <span className="icon-box">
                    <Icon size={23} aria-hidden="true" />
                  </span>
                  <span className="step-number">0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="package-section" id="packages">
          <div className="wrap section">
            <div className="section-intro">
              <p className="eyebrow">CARE PACKAGES</p>
              <h2>Support for different care needs</h2>
              <p>
                Contact the FHDS team for pricing and to confirm what each
                package covers.
              </p>
            </div>
            <div className="three-columns">
              {packages.map(({ name, subtitle, items }) => (
                <article className="package" key={name}>
                  <p className="eyebrow">{name.toUpperCase()}</p>
                  <h3>{subtitle}</h3>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>
                        <Check size={16} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a className="text-link" href={contactUrl}>
                    Ask about {name}{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="wrap section faq">
          <div className="section-intro">
            <p className="eyebrow">PATIENTS & FAMILIES</p>
            <h2>Common questions</h2>
          </div>
          <div>
            <details>
              <summary>Who is Fortified Elite Care for?</summary>
              <p>
                The programme is designed for adults aged 60 and over, including
                seniors living alone or experiencing mobility challenges, and
                families seeking routine support.
              </p>
            </details>
            <details>
              <summary>What happens during a home visit?</summary>
              <p>
                A medical doctor carries out routine observations and discusses
                how the patient has been doing. Where further assessment is
                needed, the care team can help coordinate a referral.
              </p>
            </details>
            <details>
              <summary>Can a family member help?</summary>
              <p>
                A relative or sponsor can contact the care team about enrolment.
                Any sharing of health information is subject to the patient's
                authorization and FHDS policy.
              </p>
            </details>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

export function DoctorsPage({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <PublicHeader signedIn={signedIn} />
      <main className="wrap section doctors-page" id="main-content">
        <div className="section-intro">
          <p className="eyebrow">FOR MEDICAL DOCTORS</p>
          <h1>Support older adults in their homes.</h1>
          <p className="lede">
            Fortified Elite Care brings routine monitoring, preventive support
            and coordinated follow-up to older adults and their families.
          </p>
          <Link className="button primary" to="/register?role=doctor">
            Apply as a doctor <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="three-columns">
          <article className="step">
            <span className="icon-box">
              <ShieldCheck size={22} />
            </span>
            <h3>Apply for review</h3>
            <p>
              Share your service area. The care team reviews your application
              before visit access is enabled.
            </p>
          </article>
          <article className="step">
            <span className="icon-box">
              <CalendarDays size={22} />
            </span>
            <h3>Choose an available visit</h3>
            <p>
              Approved doctors can view dates and service areas for eligible
              requests and claim a visit.
            </p>
          </article>
          <article className="step">
            <span className="icon-box">
              <ClipboardList size={22} />
            </span>
            <h3>Document your visit</h3>
            <p>
              Record your observations and prepare a summary for the care team
              to review before release.
            </p>
          </article>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
