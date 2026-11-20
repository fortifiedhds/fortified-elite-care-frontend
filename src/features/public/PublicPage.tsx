import {
  CalendarDays,
  ClipboardList,
  Heart,
  House,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { siteHref } from "../../shared/lib/sites";
import { PackageCards } from "../billing/PackageCards";
import { FAQList, JoinBand, Start, Steps } from "./components/PublicContent";
import { HeroArt, hasHeroArt } from "./components/HeroArt";
import { Footer, PublicHeader } from "./components/PublicLayout";
import { publicInfo } from "./content";
import { ContactSection } from "./components/ContactSection";

export function PublicPage({
  page,
  signedIn,
}: {
  page: keyof typeof publicInfo;
  signedIn: boolean;
}) {
  const [tag, title, detail] = publicInfo[page];
  const art = hasHeroArt(page) ? page : null;
  return (
    <>
      <PublicHeader signedIn={signedIn} />
      <main id="main-content" className="page-enter">
        <section
          className={
            art
              ? `sub-hero has-art ${art === "how-it-works" ? "has-frame" : "has-cutout"}`
              : "sub-hero"
          }
        >
          <div className={art ? "wrap sub-hero-grid" : "wrap stack"}>
            <div className="stack sub-hero-copy">
              {/* <p className="eyebrow">{tag.toUpperCase()}</p> */}
              <h1>{title}</h1>
              <p className="lede">{detail}</p>
              {page === "for-doctors" && (
                <Start role="doctor" label="Apply as a doctor" />
              )}
              {page === "contact" && (
                <a href="#contact-form" className="button primary">
                  Send us a message
                </a>
              )}
              {(page === "how-it-works" || page === "for-families") && (
                <Start />
              )}
            </div>
            {art && <HeroArt page={art} />}
          </div>
        </section>
        <section className="wrap section stack">
          {page === "how-it-works" && (
            <>
              <Steps />
              <p className="feedback">
                Choose a preferred day each month. In shorter months, we use the
                last day. Your appointment is confirmed separately.
              </p>
            </>
          )}
          {page === "services" && (
            <>
              <div className="section-intro" id="packages">
                {/* <p className="eyebrow">CARE PACKAGES</p> */}
                <h2>What’s included in each package</h2>
              </div>
              <PackageCards />
              <p className="feedback">
                Routine services don’t replace hospital care. For emergencies,
                seek immediate medical care.
              </p>
            </>
          )}
          {page === "about" && (
            <Steps
              entries={[
                {
                  icon: Heart,
                  title: "Care with time to listen",
                  detail:
                    "The programme supports preventive care, routine monitoring and wellbeing in familiar surroundings.",
                },
                {
                  icon: House,
                  title: "Support at home",
                  detail:
                    "Scheduled doctor visits make routine checks easier to arrange.",
                },
                {
                  icon: UserRound,
                  title: "Families and carers",
                  detail:
                    "With the client’s permission, family members and carers can be included in care conversations.",
                },
              ]}
            />
          )}
          {page === "for-families" && (
            <>
              <Steps
                entries={[
                  {
                    icon: UserRound,
                    title: "Who can enrol",
                    detail:
                      "Older adults, executives, people in high-stress jobs and any adult who wants ongoing routine monitoring.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Family and sponsor support",
                    detail:
                      "You can add a sponsor contact. Sharing care information takes a separate, explicit choice.",
                  },
                  {
                    icon: CalendarDays,
                    title: "What to expect",
                    detail:
                      "A baseline assessment, scheduled monthly home visits and help coordinating follow-up when needed.",
                  },
                ]}
              />
              <JoinBand />
            </>
          )}
          {page === "for-doctors" && (
            <>
              <Steps
                entries={[
                  {
                    icon: Heart,
                    title: "Care with compassion",
                    detail:
                      "Listen, respect the client’s home and support their independence.",
                  },
                  {
                    icon: ClipboardList,
                    title: "Document the visit",
                    detail:
                      "Complete the baseline assessment and consultation note for your assigned client.",
                  },
                  {
                    icon: Stethoscope,
                    title: "Work within your access",
                    detail:
                      "Verification comes first. Identifying details are visible only for assigned visits.",
                  },
                ]}
              />
              <section className="panel">
                <h2>Before your first visit</h2>
                <p>
                  Share your service area and professional registration number.
                  The care team reviews your application before enabling visit
                  access. The welcome pack is available in the portal after
                  approval.
                </p>
              </section>
            </>
          )}
          {page === "faq" && (
            <div className="faq">
              <div className="stack">
                <h2>Need another answer?</h2>
                <Link to="/contact" className="button outline">
                  Contact support
                </Link>
              </div>
              <FAQList />
            </div>
          )}
          {page === "contact" && <ContactSection />}
          {page === "privacy" && (
            <section className="panel">
              <h2>Your sharing choices</h2>
              <p>
                Adding a sponsor or next of kin does not grant portal access. If
                you have an account, you can review who you have named for care
                updates in your portal.
              </p>
              <Link
                to={siteHref("dashboard", signedIn ? "/portal" : "/login")}
                className="button outline"
              >
                {signedIn ? "Go to your portal" : "Sign in"}
              </Link>
            </section>
          )}
          {page === "terms" && (
            <section className="panel">
              <h2>Review your agreement</h2>
              <p>
                Ask the care team for the current agreement and confirmed
                package terms before making a commitment.
              </p>
              <Link to="/contact" className="button outline">
                Contact the care team
              </Link>
            </section>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
