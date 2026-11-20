import {
  CalendarDays,
  Check,
  Heart,
  House,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export type HeroArtPage = "how-it-works" | "for-families" | "for-doctors";

export function hasHeroArt(page: string): page is HeroArtPage {
  return (
    page === "how-it-works" || page === "for-families" || page === "for-doctors"
  );
}

/**
 * Decorative artwork for the right-hand side of a sub-page hero.
 * Cut-out portraits stand on the bottom edge of the band and "pop out" of a
 * brand arch; the full photo gets a framed, layered treatment instead.
 * The floating cards repeat what the page already says, so they're hidden
 * from assistive tech; only the photo carries alt text.
 */
export function HeroArt({ page }: { page: HeroArtPage }) {
  if (page === "how-it-works") return <JourneyArt />;
  return page === "for-doctors" ? <DoctorArt /> : <FamilyArt />;
}

function DoctorArt() {
  return (
    <figure className="hero-art cutout art-doctor">
      <div className="art-stage">
        <span className="art-dots" aria-hidden="true" />
        <span className="art-ring" aria-hidden="true" />
        <span className="art-arch" aria-hidden="true" />
        <img
          src="/hero/doctor-680.png"
          srcSet="/hero/doctor-400.png 400w, /hero/doctor-680.png 680w"
          sizes="(max-width: 800px) 260px, 340px"
          alt="A smiling doctor in a white coat with a stethoscope"
          width={680}
          height={979}
          fetchPriority="high"
        />
        <span className="art-chip chip-a" aria-hidden="true">
          <span className="icon-box">
            <ShieldCheck size={20} />
          </span>
          <span>
            <strong>Verification first</strong>
            <small>Reviewed by the care team</small>
          </span>
        </span>
        <span className="art-chip chip-b" aria-hidden="true">
          <MapPin size={17} />
          Visits in your service area
        </span>
      </div>
    </figure>
  );
}

function FamilyArt() {
  return (
    <figure className="hero-art cutout art-family">
      <div className="art-stage">
        <span className="art-dots" aria-hidden="true" />
        <span className="art-ring" aria-hidden="true" />
        <span className="art-arch" aria-hidden="true" />
        <img
          src="/hero/elderly-patient-960.png"
          srcSet="/hero/elderly-patient-560.png 560w, /hero/elderly-patient-960.png 960w"
          sizes="(max-width: 800px) 340px, 480px"
          alt="An older man with grey hair, glasses and a red jumper"
          width={960}
          height={734}
          fetchPriority="high"
        />
        <span className="art-chip chip-a" aria-hidden="true">
          <span className="icon-box">
            <CalendarDays size={20} />
          </span>
          <span>
            <strong>One visit each month</strong>
            <small>In the comfort of home</small>
          </span>
        </span>
        <span className="art-chip chip-b" aria-hidden="true">
          <Heart size={17} />
          Family included, with consent
        </span>
      </div>
    </figure>
  );
}

function JourneyArt() {
  return (
    <figure className="hero-art framed art-journey">
      <span className="art-dots" aria-hidden="true" />
      <span className="art-offset" aria-hidden="true" />
      <div className="art-photo">
        <img
          src="/hero/how-it-works-1400.jpg"
          srcSet="/hero/how-it-works-900.jpg 900w, /hero/how-it-works-1400.jpg 1400w"
          sizes="(max-width: 800px) 92vw, 560px"
          alt="A woman and an older adult review medication together at home"
          width={1400}
          height={933}
          fetchPriority="high"
        />
      </div>
      <span className="art-stamp" aria-hidden="true">
        <svg className="art-stamp-ring" viewBox="0 0 120 120">
          <defs>
            <path
              id="art-stamp-circle"
              d="M60 60m-42 0a42 42 0 1 1 84 0a42 42 0 1 1-84 0"
            />
          </defs>
          <text>
            <textPath href="#art-stamp-circle" textLength="256">
              MONTHLY • HOME CHECKUPS •
            </textPath>
          </text>
        </svg>
        <House className="art-stamp-icon" size={24} />
      </span>
      <div className="art-tracker" aria-hidden="true">
        <p className="eyebrow">YOUR CARE JOURNEY</p>
        <ol>
          <li className="is-done">
            <span>
              <Check size={13} strokeWidth={3} />
            </span>
            Register
          </li>
          <li className="is-current">
            <span>2</span>
            Home visit
          </li>
          <li>
            <span>3</span>
            What comes next
          </li>
        </ol>
      </div>
    </figure>
  );
}
