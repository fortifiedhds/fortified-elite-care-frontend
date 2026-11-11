import { FileText, House, UserRound } from "lucide-react";

export const steps = [
  {
    icon: UserRound,
    title: "Register and choose a package",
    detail:
      "Tell us about yourself and your visit preferences. The care team reviews your enrolment.",
  },
  {
    icon: House,
    title: "Meet your doctor at home",
    detail:
      "Start with a baseline assessment, then receive scheduled monthly doctor-led checkups.",
  },
  {
    icon: FileText,
    title: "See what comes next",
    detail:
      "Find authorised reports and follow-up information in your portal. Your doctor may recommend a referral.",
  },
];

export const questions = [
  [
    "Who is Fortified Elite Care for?",
    "The programme is designed for adults aged 60 and over, including older adults with mobility challenges or who would benefit from routine monitoring.",
  ],
  [
    "What happens during a home visit?",
    "A qualified doctor carries out routine checks and discusses how you are doing. The first visit includes a baseline assessment.",
  ],
  [
    "Can a relative or sponsor help?",
    "Yes. A relative can support enrolment or payments. Sharing health information takes a separate, explicit choice.",
  ],
  [
    "What do the packages cost?",
    "Contact the care team for the current rate card and a quote for your preferred package.",
  ],
  [
    "Can I use this in an emergency?",
    "No. Fortified Elite Care provides scheduled routine care. For emergencies, seek immediate medical care.",
  ],
  [
    "How can doctors join?",
    "Apply as a doctor. You can access assigned patient records and claim visits after verification.",
  ],
] as const;

export const publicInfo = {
  about: [
    "Our purpose",
    "Dignity and independence, at home.",
    "We bring routine healthcare closer to older adults who face mobility or transport barriers, and help them stay connected to their primary healthcare providers.",
  ],
  "how-it-works": [
    "The care journey",
    "From your first form to your next visit.",
    "Know what happens before, during and after a routine home checkup.",
  ],
  services: [
    "Routine services",
    "Care that meets you at home.",
    "From regular health checks to follow-up coordination, choose the level of support that fits your needs.",
  ],
  "for-families": [
    "Patients and families",
    "A familiar place for better conversations.",
    "Designed for people aged 60 and over who would benefit from planned home healthcare.",
  ],
  "for-doctors": [
    "For medical officers",
    "Bring good care closer.",
    "Every home visit is a chance to build trust. We welcome qualified doctors who put dignity, integrity and person-centred care first.",
  ],
  faq: [
    "Help centre",
    "Frequently asked questions",
    "Find out about enrolment, care packages, home visits and sharing health information.",
  ],
  contact: [
    "Contact",
    "How can we help?",
    "Ask about enrolment, care packages or changes to your visit.",
  ],
  privacy: [
    "Privacy",
    "Privacy and confidentiality",
    "Contact the care team for the current privacy notice and questions about how your information is handled.",
  ],
  terms: [
    "Service terms",
    "Terms and service agreement",
    "Your service agreement is separate from clinical consent. Review your package, agreed fees and responsibilities with the care team.",
  ],
} as const;

export const publicPages = Object.keys(publicInfo) as Array<
  keyof typeof publicInfo
>;
