import Link from "next/link";
import BioNFCLogo from "./bionfc-logo";

export default function BioNFCSignature({ className = "" }: { className?: string }) {
  return <footer className={`bionfc-signature${className ? ` ${className}` : ""}`}>
    <Link href="/" aria-label="Hecho con BIONFC. Conocé BIONFC">
      <span>Hecho con</span>
      <BioNFCLogo />
    </Link>
  </footer>;
}
