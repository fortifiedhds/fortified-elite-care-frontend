import {
  ArrowRight,
  CalendarDays,
  Clock,
  FileText,
  House,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PackageCards } from "../billing/PackageCards";
import { FAQList, JoinBand, Start, Steps } from "./components/PublicContent";
import { Footer, PublicHeader } from "./components/PublicLayout";

export function PublicHome({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <PublicHeader signedIn={signedIn} />
      <main id="main-content" className="page-enter">
        <div className="hero-band">
          <section className="wrap hero">
            <div className="hero-copy">
              <h1>
                Good care <em>feels closer.</em>
              </h1>
              <p className="lede">
                Monthly home visits from a qualified doctor for older adults,
                busy professionals and anyone seeking routine monitoring. Time
                to listen, check how you’re doing and plan what comes next.
              </p>
              <div className="actions">
                <Start />
                <Link to="/how-it-works" className="button outline">
                  See how it works <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
              <p className="hero-note">
                {/* <ShieldCheck size={17} aria-hidden="true" /> */}
                Routine care for adults. For emergencies, seek immediate medical
                care.
              </p>
            </div>
            <figure className="hero-image">
              <img
                src="/hero/how-it-works-1400.jpg"
                srcSet="/hero/how-it-works-900.jpg 900w, /hero/how-it-works-1400.jpg 1400w"
                sizes="(max-width: 900px) 100vw, 900px"
                alt="A woman and an older adult review medication together at home"
                width={1400}
                height={933}
                fetchPriority="high"
              />
              <span className="hero-stamp" aria-hidden="true">
                Care
                <br />
                at home
              </span>
              <figcaption>
                <span className="icon-box">
                  <CalendarDays size={22} aria-hidden="true" />
                </span>
                <span>
                  <strong>One routine visit each month</strong>
                  <small>In the comfort of your home</small>
                </span>
              </figcaption>
            </figure>
          </section>
        </div>
        <div className="principles">
          <div className="wrap principles-inner">
            <span>
              <House size={22} aria-hidden="true" />A doctor comes to you
            </span>
            <span>
              <Clock size={22} aria-hidden="true" />
              Time to talk and ask questions
            </span>
            <span>
              <FileText size={22} aria-hidden="true" />
              Follow-up and authorised reports
            </span>
          </div>
        </div>
        <section className="wrap section">
          <div className="section-intro">
            {/* <p className="eyebrow">HOW IT WORKS</p> */}
            <h2>From enrolment to your first checkup</h2>
            <p>
              A straightforward process, with someone to help at every step.
            </p>
          </div>
          <Steps />
        </section>
        <section className="package-section" id="packages">
          <div className="wrap section">
            <div className="section-intro">
              {/* <p className="eyebrow">CARE PACKAGES</p> */}
              <h2>Choose the level of support you need</h2>
              <p>
                Each package includes monthly home visits. Ask the care team
                what’s included and request a quote.
              </p>
            </div>
            <PackageCards />
          </div>
        </section>
        <section className="wrap section faq">
          <div className="section-intro">
            {/* <p className="eyebrow">COMMON QUESTIONS</p> */}
            <h2>Before you get started</h2>
            <Link to="/faq" className="button outline">
              See all questions
            </Link>
          </div>
          <FAQList brief />
        </section>
        <section className="wrap section join-section">
          <JoinBand />
        </section>
      </main>
      <Footer />
    </>
  );
}
