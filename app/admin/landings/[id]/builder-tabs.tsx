"use client";

import { useState, type ReactNode } from "react";
import { IconUser, IconLink, IconRocket } from "@/components/icons";

const TABS = [
  { id: "identity", label: "Identidad", Icon: IconUser },
  { id: "actions", label: "Botones", Icon: IconLink },
  { id: "publish", label: "Publicar", Icon: IconRocket },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BuilderTabs({ identity, actions, publish }: { identity: ReactNode; actions: ReactNode; publish: ReactNode }) {
  const [tab, setTab] = useState<TabId>("identity");
  const panels: Record<TabId, ReactNode> = { identity, actions, publish };
  return (
    <div>
      <div className="tab-bar" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "tab-button active" : "tab-button"}
            onClick={() => setTab(item.id)}
          >
            <item.Icon /> {item.label}
          </button>
        ))}
      </div>
      <div className="tab-panel" key={tab}>{panels[tab]}</div>
    </div>
  );
}
