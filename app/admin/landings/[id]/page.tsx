import { redirect } from "next/navigation";

// The classic editor used to live at this exact route. editor-v2 is now the only editor, but
// this route stays as a redirect (instead of just deleting the page and letting it 404) so any
// old bookmark or link to `/admin/landings/[id]` still lands somewhere useful.
export default async function LandingRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/landings/${id}/editor-v2`);
}
