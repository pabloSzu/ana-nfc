import { FiDownload, FiUserPlus } from "react-icons/fi";
import { LuContact } from "react-icons/lu";
import type { ButtonZoneStyle } from "@/lib/landing-catalog";

export default function ContactSaveIcon({ icon = "add" }: { icon?: ButtonZoneStyle["contactSaveIcon"] }) {
  if (icon === "card") return <LuContact aria-hidden="true" />;
  if (icon === "add") return <FiUserPlus aria-hidden="true" />;
  return <FiDownload aria-hidden="true" />;
}
