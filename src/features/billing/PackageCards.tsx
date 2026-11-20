import { Check } from "lucide-react";
import { careEmail } from "../../shared/lib/contact";

export const packages = [
  {
    name: "Silver",
    subtitle: "Essential home health support",
    items: [
      "Scheduled monthly home visits",
      "Blood pressure and vital signs checks",
      "Health education and wellness advice",
      "Medication reminders and adherence support",
    ],
  },
  {
    name: "Gold",
    subtitle: "Enhanced health and wellness care",
    items: [
      "Everything in Silver",
      "Comprehensive assessments and periodic blood tests",
      "Chronic condition monitoring support",
      "Caregiver guidance, referral support and wellness planning",
    ],
  },
  {
    name: "Platinum",
    subtitle: "Closer monitoring and coordination",
    items: [
      "Everything in Gold",
      "Priority home healthcare and extended follow-up",
      "Personalised care coordination and family consultations",
      "Detailed progress reports and tailored care plans",
    ],
  },
] as const;

export function PackageCards() {
  return (
    <div className="three-columns">
      {packages.map(({ name, subtitle, items }, i) => (
        <article className="package" key={name}>
          <p className="eyebrow">CARE PACKAGE 0{i + 1}</p>
          <h3>{name}</h3>
          <p>{subtitle}</p>
          <ul>
            {items.map((item) => (
              <li key={item}>
                <Check size={17} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <a
            className={"button " + (i === 2 ? "accent" : "outline")}
            href={
              "mailto:" +
              careEmail +
              "?subject=" +
              encodeURIComponent(name + " care package quote")
            }
          >
            Ask about {name}
          </a>
        </article>
      ))}
    </div>
  );
}
