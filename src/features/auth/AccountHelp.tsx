import { Link } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";

export function AccountHelp() {
  return (
    <AuthLayout
      title="Need help signing in?"
      subtitle="Recover your password or contact the care team for help getting back into your account."
    >
      <Link to="/forgot-password" className="button primary">
        Reset your password
      </Link>
      <Link to="/contact" className="button outline">
        Contact the care team
      </Link>
      <Link to="/login" className="text-link">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
