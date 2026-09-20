// BIONFC wordmark: "BIO" solid, "NFC" in the brand gradient, then three NFC signal arcs. Drawn in
// HTML/SVG on purpose so it stays sharp at any size and takes its color from the surrounding
// surrounding section (navy in the light navigation).
export default function Logo() {
  return (
    <span className="bx-logo">
      <span className="bx-logo-word">BIO<span className="bx-logo-nfc">NFC</span></span>
      <svg className="bx-logo-waves" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M3.5 9.2a4.6 4.6 0 0 1 0 5.6" />
        <path d="M8.6 6.4a8.6 8.6 0 0 1 0 11.2" />
        <path d="M13.9 3.6a12.6 12.6 0 0 1 0 16.8" />
      </svg>
    </span>
  );
}
