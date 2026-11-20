import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { AuthLayout } from "./components/AuthLayout";
import { Register } from "./Register";
import type { Props } from "./types";
import type { components } from "../../shared/api/schema";

export function GoogleOnboarding(props: Props) {
  const [profile, setProfile] =
    useState<components["schemas"]["GoogleProfileView"]>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void api
      .GET("/auth/google/profile", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setProfile(readResponse(result));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(messageFor(error));
      });
    return () => controller.abort();
  }, []);
  if (profile) return <Register {...props} googleProfile={profile} />;
  return (
    <AuthLayout
      title="Complete your profile."
      subtitle="Choose how you will use Fortified Elite Care."
    >
      {error ? (
        <>
          <p role="alert">{error}</p>
          <Link to="/login">Continue from sign in</Link>
        </>
      ) : (
        <p role="status">Loading your Google profile…</p>
      )}
    </AuthLayout>
  );
}
