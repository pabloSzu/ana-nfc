"use client";

import { useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";
import LandingRenderer from "@/components/landing-renderer";
import ScaledPhoneCanvas from "@/components/scaled-phone-canvas";

type DeviceMode = "small" | "standard" | "large";
type RendererProps = ComponentProps<typeof LandingRenderer>;

const devices: { id: DeviceMode; label: string; size: string }[] = [
  { id: "small", label: "Chico", size: "360 px" },
  { id: "standard", label: "Común", size: "390 px" },
  { id: "large", label: "Grande", size: "430 px" },
];

// Same 720px band as .device-preview-frame's own mobile breakpoint in globals.css — below it,
// the frame already takes up most of the real screen, so scrolling INSIDE a phone-shaped box
// that's nearly the size of your actual phone reads as redundant (reported: "en mobile quiero
// que se vea entero el celular con todos sus botones, no scrolleable"). Above it there's normally
// plenty of desktop real estate to just show the phone at its real size and let the page scroll
// past it if there are a lot of buttons — same as scrolling any other tall page.
function useIsMobilePreview() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 720px)");
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

export default function DevicePreview({ landing, actions, backHref }: RendererProps & { backHref: string }) {
  const [device, setDevice] = useState<DeviceMode>("standard");
  const isMobile = useIsMobilePreview();
  return (
    <main className={`device-preview-shell device-${device}`}>
      <header className="device-preview-toolbar">
        <Link className="device-preview-back" href={backHref}>← Volver</Link>
        <div className="device-preview-title"><strong>Vista previa móvil</strong><small>{devices.find((item) => item.id === device)?.size}</small></div>
        <div className="device-preview-switcher">{devices.map((item) => <button key={item.id} type="button" className={device === item.id ? "active" : ""} onClick={() => setDevice(item.id)}>{item.label}</button>)}</div>
      </header>
      <section className="device-preview-stage">
        <div className={`device-preview-frame device-${device}`}>
          <ScaledPhoneCanvas className="scaled-phone-canvas" fit={isMobile ? "contain" : "width"}>
            <LandingRenderer landing={landing} actions={actions} />
          </ScaledPhoneCanvas>
        </div>
      </section>
    </main>
  );
}
