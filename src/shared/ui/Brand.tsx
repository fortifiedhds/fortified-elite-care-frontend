import { Link } from "react-router-dom";
import { siteHref } from "../lib/sites";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      className="brand"
      to={siteHref("public", "/")}
      aria-label="Fortified Elite Care home"
    >
      <img
        src={light ? "/brand/fec-logo-light.svg" : "/brand/fec-logo.svg"}
        width={135}
        height={52}
        alt=""
      />
    </Link>
  );
}
