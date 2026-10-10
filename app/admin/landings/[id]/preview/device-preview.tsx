"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import LandingRenderer, { LandingPhotoBackground } from "@/components/landing-renderer";
import ScaledPhoneCanvas from "@/components/scaled-phone-canvas";
import PhoneBrowserChrome from "@/components/phone-browser-chrome";

type DeviceMode = "small" | "standard" | "large";
type RendererProps = ComponentProps<typeof LandingRenderer>;

const devices: { id: DeviceMode; label: string; size: string; width: number }[] = [
  { id: "small", label: "Compacto", size: "375 × 667 px · iPhone SE/8", width: 375 },
  { id: "standard", label: "Estándar", size: "390 × 844 px · iPhone 12–14", width: 390 },
  { id: "large", label: "Grande", size: "430 × 932 px · Pro Max", width: 430 },
];

export default function DevicePreview({ landing, actions, backHref }: RendererProps & { backHref: string }) {
  const [device, setDevice] = useState<DeviceMode>("standard");
  return (
    <main className={`device-preview-shell device-${device}`}>
      <header className="device-preview-toolbar">
        <Link className="device-preview-back" href={backHref}>← Volver</Link>
        <div className="device-preview-title"><strong>Vista previa · Safari</strong><small>{devices.find((item) => item.id === device)?.size} · área visible al abrir</small></div>
        <div className="device-preview-switcher">{devices.map((item) => <button key={item.id} type="button" className={device === item.id ? "active" : ""} onClick={() => setDevice(item.id)}>{item.label}</button>)}</div>
      </header>
      <section className="device-preview-stage">
        <div className={`device-preview-frame device-${device}`}>
          <PhoneBrowserChrome position="top" />
          <ScaledPhoneCanvas className="scaled-phone-canvas" designWidth={devices.find((item) => item.id === device)?.width} fit="width" photoBackground={landing.background_type === "image" ? <LandingPhotoBackground landing={landing} /> : undefined}>
            <LandingRenderer landing={landing} actions={actions} externalPhotoBackground={landing.background_type === "image"} />
          </ScaledPhoneCanvas>
          <PhoneBrowserChrome position="bottom" />
        </div>
      </section>
    </main>
  );
}
