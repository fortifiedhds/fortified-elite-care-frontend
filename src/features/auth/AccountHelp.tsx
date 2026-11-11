import { Link } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";

export function AccountHelp() {
  return (
    <AuthLayout
      title="Need help signing in?"
      subtitle="Contact the care team for help getting back into your account."
    >
      <Link to="/contact" className="button primary">
        Contact the care team
      </Link>
      <Link to="/login" className="text-link">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
