import { Manrope, Plus_Jakarta_Sans } from "next/font/google";

// The home's two typefaces, loaded through next/font (self-hosted, no layout shift) and exposed
// as CSS variables on the .bx root — see marketing.css. Kept out of the root layout on purpose
// so /admin and the public landings don't pay for fonts they never use.
export const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--bx-display", display: "swap" });
export const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--bx-body", display: "swap" });
