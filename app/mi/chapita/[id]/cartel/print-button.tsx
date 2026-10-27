"use client";

import { LuPrinter } from "react-icons/lu";

export default function PrintPosterButton() {
  return <button type="button" className="poster-print" onClick={() => window.print()}><LuPrinter aria-hidden="true" />Imprimir o guardar PDF</button>;
}
