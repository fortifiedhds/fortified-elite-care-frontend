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
import { careEmail, carePhone } from "../../shared/lib/contact";
import { PackageCards } from "../billing/PackageCards";
import { FAQList, JoinBand, Start, Steps } from "./components/PublicContent";
import { Footer, PublicHeader } from "./components/PublicLayout";
import { publicInfo } from "./content";

export function PublicPage({
  page,
  signedIn,
}: {
  page: keyof typeof publicInfo;
  signedIn: boolean;
}) {
  const [tag, title, detail] = publicInfo[page];
  return (
    <>
      <PublicHeader signedIn={signedIn} />
      <main id="main-content" className="page-enter">
        <section className="sub-hero">
          <div className="wrap stack">
            <p className="eyebrow">{tag.toUpperCase()}</p>
            <h1>{title}</h1>
            <p className="lede">{detail}</p>
            {page === "for-doctors" && (
              <Start role="doctor" label="Apply as a doctor" />
            )}
            {(page === "how-it-works" || page === "for-families") && <Start />}
          </div>
        </section>
        <section className="wrap section stack">
          {page === "how-it-works" && (
            <>
              <Steps />
              <p className="feedback">
                A preferred date is a request. Your visit is confirmed
                separately when a doctor is assigned.
              </p>
            </>
          )}
          {page === "services" && (
            <>
              <div className="section-intro" id="packages">
                <p className="eyebrow">CARE PACKAGES</p>
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
                    "The programme supports preventive care and healthy ageing in familiar surroundings.",
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
                      "Older adults living alone, with mobility challenges, or looking for ongoing routine monitoring.",
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
          {page === "contact" && (
            <div className="portal-grid">
              <section className="panel">
                <h2>Contact the care team</h2>
                <a href={"mailto:" + careEmail}>{careEmail}</a>
                <a href={"tel:" + carePhone.replaceAll(" ", "")}>{carePhone}</a>
              </section>
              <section className="panel">
                <h2>For routine enquiries</h2>
                <p>
                  For emergencies, seek immediate medical care. Please don’t
                  send clinical details by email.
                </p>
              </section>
            </div>
          )}
          {page === "privacy" && (
            <section className="panel">
              <h2>Your sharing choices</h2>
              <p>
                Adding a sponsor or next of kin does not grant portal access. If
                you have an account, you can review who you have named for care
                updates in your portal.
              </p>
              <Link
                to={signedIn ? "/portal" : "/login"}
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
