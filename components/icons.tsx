type IconProps = { className?: string };

const base = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconPlus(props: IconProps) {
  return <svg {...base} {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

export function IconEdit(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
}

export function IconEye(props: IconProps) {
  return <svg {...base} {...props}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
}

export function IconQrCode(props: IconProps) {
  return <svg {...base} {...props}><path d="M3 8V5a2 2 0 0 1 2-2h3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" /><path d="M21 16v3a2 2 0 0 1-2 2h-3" /><path d="M8 21H5a2 2 0 0 1-2-2v-3" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>;
}

export function IconPlay(props: IconProps) {
  return <svg {...base} {...props}><polygon points="6 3 20 12 6 21 6 3" /></svg>;
}

export function IconPause(props: IconProps) {
  return <svg {...base} {...props}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
}

export function IconTrash(props: IconProps) {
  return <svg {...base} {...props}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}

export function IconExternalLink(props: IconProps) {
  return <svg {...base} {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
}

export function IconUsers(props: IconProps) {
  return <svg {...base} {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}

export function IconFileText(props: IconProps) {
  return <svg {...base} {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}

export function IconCheckCircle(props: IconProps) {
  return <svg {...base} {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
}

export function IconAlertCircle(props: IconProps) {
  return <svg {...base} {...props}><circle cx="12" cy="12" r="9.5" /><line x1="12" y1="7.5" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" /></svg>;
}

export function IconX(props: IconProps) {
  return <svg {...base} {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

export function IconLogOut(props: IconProps) {
  return <svg {...base} {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}

export function IconUser(props: IconProps) {
  return <svg {...base} {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" /></svg>;
}

export function IconLink(props: IconProps) {
  return <svg {...base} {...props}><path d="M10.5 13.5a5 5 0 0 0 7.5.5l2.8-2.8a5 5 0 0 0-7-7l-1.6 1.5" /><path d="M13.5 10.5a5 5 0 0 0-7.5-.5L3.2 12.8a5 5 0 0 0 7 7l1.6-1.5" /></svg>;
}

export function IconRocket(props: IconProps) {
  return <svg {...base} {...props}><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.18 2.18 0 0 0-2.9-.1Z" /><path d="M12 15l-3-3a22 22 0 0 1 2-4A13 13 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2Z" /><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0" /><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" /></svg>;
}

export function IconImage(props: IconProps) {
  return <svg {...base} {...props}><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><circle cx="8" cy="9.5" r="1.5" /><path d="M21.5 17 15 10.5 4 21.5" /></svg>;
}

export function IconMessageCircle(props: IconProps) {
  return <svg {...base} {...props}><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1-4.5A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 0 1 11.5 3 8.38 8.38 0 0 1 21 11.5Z" /></svg>;
}

export function IconDroplet(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 2c-4 4-7 8.5-7 12a7 7 0 0 0 14 0c0-3.5-3-8-7-12Z" /></svg>;
}

export function IconWifi(props: IconProps) {
  return <svg {...base} {...props}><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a5.5 5.5 0 0 1 7 0" /><circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
