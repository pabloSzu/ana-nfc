"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import LandingRenderer from "@/components/landing-renderer";

type DeviceMode = "small" | "standard" | "large";
type RendererProps = ComponentProps<typeof LandingRenderer>;

const devices: { id: DeviceMode; label: string; size: string }[] = [
  { id: "small", label: "Chico", size: "360 px" },
  { id: "standard", label: "Común", size: "390 px" },
  { id: "large", label: "Grande", size: "430 px" },
];

export default function DevicePreview({ landing, actions, backHref }: RendererProps & { backHref: string }) {
  const [device, setDevice] = useState<DeviceMode>("standard");
  return (
    <main className={`device-preview-shell device-${device}`}>
      <header className="device-preview-toolbar">
        <Link className="device-preview-back" href={backHref}>← Volver</Link>
        <div className="device-preview-title"><strong>Vista previa móvil</strong><small>{devices.find((item) => item.id === device)?.size}</small></div>
        <div className="device-preview-switcher">{devices.map((item) => <button key={item.id} type="button" className={device === item.id ? "active" : ""} onClick={() => setDevice(item.id)}>{item.label}</button>)}</div>
      </header>
      <section className="device-preview-stage">
        <div className={`device-preview-frame device-${device}`}>
          <LandingRenderer landing={landing} actions={actions} preview />
        </div>
      </section>
    </main>
  );
}
