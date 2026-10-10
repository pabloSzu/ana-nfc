type PhoneBrowserChromeProps = {
  position: "top" | "bottom";
};

export default function PhoneBrowserChrome({ position }: PhoneBrowserChromeProps) {
  if (position === "top") {
    return (
      <div className="phone-browser-chrome phone-browser-top" aria-hidden="true">
        <span className="phone-browser-time">9:41</span>
        <span className="phone-browser-island" />
        <span className="phone-browser-status"><i /><i /><b /></span>
      </div>
    );
  }

  return (
    <div className="phone-browser-chrome phone-browser-bottom" aria-hidden="true">
      <div className="phone-browser-address"><span>Aa</span><strong>▣</strong><em>bionfc.com.ar</em><b>↻</b></div>
      <div className="phone-browser-toolbar"><span>‹</span><span>›</span><span>⌑</span><span>▢</span></div>
      <i className="phone-browser-home" />
    </div>
  );
}
