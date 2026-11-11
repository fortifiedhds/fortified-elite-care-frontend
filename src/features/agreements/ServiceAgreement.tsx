import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function ServiceAgreement() {
  return (
    <div className="form-shell">
      <section className="panel">
        <h2>Review your service agreement</h2>
        <p>
          Your service agreement covers the care package, agreed fees,
          appointments and responsibilities. It is separate from your care
          permissions.
        </p>
        {[
          [
            "Package and services",
            "Confirm which services are included and your start date with the care team.",
          ],
          [
            "Fees and payment",
            "The care team will provide your agreed fee, billing frequency, due date and payment method.",
          ],
          [
            "Confidentiality",
            "Ask the care team for the current confidentiality and privacy information.",
          ],
          [
            "Signatures and copies",
            "Contact the care team to arrange signing and request a copy of your agreement.",
          ],
        ].map(([heading, detail]) => (
          <details key={heading}>
            <summary>{heading}</summary>
            <p>{detail}</p>
          </details>
        ))}
        <Link to="/contact" className="button primary">
          Contact the care team
        </Link>
      </section>
      <aside className="panel">
        <FileText aria-hidden="true" size={22} />
        <h3>Agreement status</h3>
        <p>Online signing is not available.</p>
        <Link to="/portal/consent" className="button outline">
          Review care permissions
        </Link>
      </aside>
    </div>
  );
}
