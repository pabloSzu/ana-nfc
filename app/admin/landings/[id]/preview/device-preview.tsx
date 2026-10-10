"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import LandingRenderer, { LandingPhotoBackground } from "@/components/landing-renderer";
import ScaledPhoneCanvas from "@/components/scaled-phone-canvas";
import PhoneBrowserChrome from "@/components/phone-browser-chrome";

type DeviceMode = "small" | "standard" | "large";
type RendererProps = ComponentProps<typeof LandingRenderer>;

const devices: { id: DeviceMode; label: string; model: string; dimensions: string; width: number }[] = [
  { id: "small", label: "Compacto", model: "iPhone SE / 8", dimensions: "375 × 667 px", width: 375 },
  { id: "standard", label: "Estándar", model: "iPhone 12–14", dimensions: "390 × 844 px", width: 390 },
  { id: "large", label: "Grande", model: "iPhone Pro Max", dimensions: "430 × 932 px", width: 430 },
];

export default function DevicePreview({ landing, actions, backHref }: RendererProps & { backHref: string }) {
  const [device, setDevice] = useState<DeviceMode>("standard");
  const activeDevice = devices.find((item) => item.id === device) ?? devices[1];
  return (
    <main className={`device-preview-shell device-${device}`}>
      <header className="device-preview-toolbar">
        <Link className="device-preview-back" href={backHref}>← Volver</Link>
        <div className="device-preview-title"><strong>Probá tu página en distintos celulares</strong><small>Vista real en Safari · {activeDevice.dimensions}</small></div>
        <div className="device-preview-switcher" aria-label="Cambiar tamaño del celular">{devices.map((item) => <button key={item.id} type="button" className={device === item.id ? "active" : ""} aria-pressed={device === item.id} onClick={() => setDevice(item.id)}><span className="device-preview-phone-icon" aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.model}</small></span></button>)}</div>
      </header>
      <section className="device-preview-stage">
        <div className={`device-preview-frame device-${device}`}>
          <PhoneBrowserChrome position="top" />
          <ScaledPhoneCanvas className="scaled-phone-canvas" designWidth={activeDevice.width} fit="width" photoBackground={landing.background_type === "image" ? <LandingPhotoBackground landing={landing} /> : undefined}>
            <LandingRenderer landing={landing} actions={actions} externalPhotoBackground={landing.background_type === "image"} />
          </ScaledPhoneCanvas>
          <PhoneBrowserChrome position="bottom" />
        </div>
      </section>
    </main>
  );
}
