type ContactAction = { type: string; url?: string | null };

type ContactLanding = {
  business_name: string;
  description?: string | null;
  title_style?: unknown;
  button_style?: unknown;
};

function escapeVCard(value: string): string {
  return value.trim().replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

export function buildContactCard(landing: ContactLanding, actions: ContactAction[], pageUrl: string): string {
  const style = landing.title_style && typeof landing.title_style === "object" ? landing.title_style as Record<string, unknown> : {};
  const role = typeof style.eyebrow === "string" ? style.eyebrow.trim() : "";
  const company = (landing.description || "").trim();
  const name = landing.business_name.trim();
  const action = (type: string) => (actions.find((item) => item.type === type)?.url || "").trim();
  const phone = action("phone");
  const whatsapp = action("whatsapp");
  const email = action("email");
  const website = action("website");
  const buttonStyle = landing.button_style && typeof landing.button_style === "object" ? landing.button_style as Record<string, unknown> : {};
  const secondPhone = typeof buttonStyle.contactSecondPhone === "string" ? buttonStyle.contactSecondPhone.trim().slice(0, 50) : "";
  const address = typeof buttonStyle.contactAddress === "string" ? buttonStyle.contactAddress.trim().slice(0, 200) : "";
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCard(name)}`, `N:;${escapeVCard(name)};;;`];
  if (role) lines.push(`TITLE:${escapeVCard(role)}`);
  if (company) lines.push(`ORG:${escapeVCard(company)}`);
  // A second unlabeled mobile number is ambiguous in iOS/Android contacts. Use WhatsApp
  // as the contact number only when no phone was provided; its own quick action stays separate.
  if (phone || whatsapp) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone || whatsapp)}`);
  if (secondPhone && secondPhone.replace(/\D/g, "") !== (phone || whatsapp).replace(/\D/g, "")) lines.push(`TEL;TYPE=VOICE:${escapeVCard(secondPhone)}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email)}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(address)};;;;`);
  if (website && /^https?:\/\//i.test(website)) lines.push(`URL:${escapeVCard(website)}`);
  lines.push(`URL:${escapeVCard(pageUrl)}`, "END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}
