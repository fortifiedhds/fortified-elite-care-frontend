import { Link } from "react-router-dom";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="Fortified Elite Care home">
      <img
        src={light ? "/brand/fec-logo-light.svg" : "/brand/fec-logo.svg"}
        width={170}
        height={52}
        alt=""
      />
    </Link>
  );
}
