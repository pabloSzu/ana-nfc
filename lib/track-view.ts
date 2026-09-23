import { after } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Todo lo que pide la página sin ser una persona. Los cuatro primeros son los que más
// ensucian el número en este producto: cada vez que alguien pega el link de una landing en
// WhatsApp, Instagram o Slack, esa app abre la página para armar la previsualización. Sin
// este filtro, compartir el link una vez ya cuenta como varios "escaneos".
const BOT_PATTERN = /bot\b|bots?\/|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|twitter|linkedin|skype|pinterest|embedly|quora|vkshare|preview|scrap|monitor|uptime|curl|wget|httpie|headless|lighthouse|pagespeed|gtmetrix|python-requests|go-http|java\/|okhttp|axios|node-fetch|undici/i;

const SOURCES = ["nfc", "qr", "direct"] as const;
export type ViewSource = (typeof SOURCES)[number];

export function normalizeSource(raw: string | string[] | undefined): ViewSource {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase().trim();
  return SOURCES.includes(value as ViewSource) ? (value as ViewSource) : "direct";
}

/**
 * Registra una visita a una landing publicada.
 *
 * Corre dentro de `after()`, es decir después de que la respuesta ya salió: contar es lo menos
 * importante que pasa en esta request y no tiene por qué hacerle esperar un viaje a la base a
 * alguien que acaba de apoyar el celular en una tarjeta. Por el mismo motivo nunca lanza: si
 * la base falla, la landing igual se ve. Un contador roto no puede romper el producto.
 */
export async function trackLandingView(landingId: string, source: ViewSource, ownerId?: string | null) {
  const userAgent = (await headers()).get("user-agent") || "";
  // Sin user-agent es casi siempre un script; un navegador real siempre manda uno.
  if (!userAgent || BOT_PATTERN.test(userAgent)) return;

  // El cliente se arma acá y no adentro de after(): necesita cookies(), que pertenece a la
  // request y ya no está disponible una vez que la respuesta se fue.
  const supabase = await createClient();

  // El dueño mirando su propia landing no es un escaneo. El botón "Ver" del panel abre la
  // página pública igual que cualquier visitante, así que sin esto cada vez que se revisa
  // el trabajo de un cliente se le infla el contador — y revisar es lo que más se hace.
  //
  // No cuesta una consulta: getClaims() verifica el JWT de la cookie localmente, y cuando no
  // hay sesión —el caso de cualquier visitante real— devuelve vacío al instante.
  if (ownerId) {
    const { data: claims } = await supabase.auth.getClaims();
    if ((claims?.claims as { sub?: string } | undefined)?.sub === ownerId) return;
  }

  after(async () => {
    try {
      await supabase.from("landing_views").insert({ landing_id: landingId, source });
    } catch {
      // Intencionalmente en silencio.
    }
  });
}
