import {
  ArrowRight,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  careAddress,
  careEmail,
  carePhone,
  careWhatsApp,
} from "../../../shared/lib/contact";
import { ContactForm } from "./ContactForm";

export function ContactSection() {
  const map =
    "https://maps.google.com/maps?q=" + encodeURIComponent(careAddress);
  return (
    <div className="contact-grid">
      <aside className="panel contact-details">
        <div>
          <p className="eyebrow">LET’S TALK</p>
          <h2>
            A little guidance.
            <br />A helpful next step.
          </h2>
          <p className="muted">
            Ask about care, share feedback, or enquire about careers at FEC.
          </p>
        </div>
        <ul className="contact-methods">
          <li>
            <span className="contact-method-icon">
              <Mail size={21} aria-hidden="true" />
            </span>
            <div>
              <span>Email our team</span>
              <a href={"mailto:" + careEmail}>{careEmail}</a>
            </div>
          </li>
          <li>
            <span className="contact-method-icon">
              <Phone size={21} aria-hidden="true" />
            </span>
            <div>
              <span>Give us a call</span>
              <a href={"tel:" + carePhone.replaceAll(" ", "")}>{carePhone}</a>
            </div>
          </li>
          <li>
            <span className="contact-method-icon">
              <MessageCircle size={21} aria-hidden="true" />
            </span>
            <div>
              <span>Chat on WhatsApp</span>
              <a
                href={"https://wa.me/" + careWhatsApp.replace("+", "")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {careWhatsApp} <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </li>
          <li>
            <span className="contact-method-icon">
              <MapPin size={21} aria-hidden="true" />
            </span>
            <div>
              <span>Our team in Ibadan</span>
              <p>{careAddress}</p>
            </div>
          </li>
        </ul>
        <div className="contact-map">
          <iframe
            title="Fortified HDS office in Ibadan"
            src={map + "&t=&z=15&ie=UTF8&iwloc=&output=embed"}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a href={map} target="_blank" rel="noopener noreferrer">
            Open in Google Maps <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
        <p className="contact-routine-note">
          <strong>For routine enquiries.</strong> For emergencies, seek
          immediate medical care.
        </p>
      </aside>
      <ContactForm />
    </div>
  );
}
