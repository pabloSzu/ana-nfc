// Diseños completos por rubro: una página ya diseñada (foto, colores, tipografía, textos y
// botones de ejemplo) que se aplica entera desde el editor. A diferencia de las plantillas de
// lib/design-presets.ts, que solo cambian el estilo, estas traen también el contenido.
//
// Cada una es una foto de una landing armada y revisada en el navegador, copiada tal cual de la
// base: así lo que se ve en el selector es exactamente lo que va a ver el cliente. Para sumar un
// rubro, armarlo como página de prueba, exportar sus columnas y agregarlo acá.

export type BusinessTemplateAction = { type: string; title: string; subtitle?: string; url?: string; message?: string; icon?: string };

export type BusinessTemplate = {
  id: string;
  name: string;
  note: string;
  landing: {
    business_name: string;
    description: string;
    primary_color: string;
    background_type: string;
    background_color: string;
    background_gradient_to: string;
    font_pair: string;
    button_font: string;
    cover_image_url: string;
    cover_style: Record<string, unknown>;
    title_style: Record<string, unknown>;
    subtitle_style: Record<string, unknown>;
    logo_style: Record<string, unknown>;
    button_style: Record<string, unknown>;
  };
  actions: BusinessTemplateAction[];
};

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    "id": "gastronomia",
    "name": "Café y restó",
    "note": "Cafeterías, restaurantes, brunch y delivery",
    "landing": {
      "business_name": "Molino Café",
      "description": "Café de especialidad, pastelería propia y brunch todo el día.",
      "primary_color": "#d9a066",
      "background_type": "gradient",
      "background_color": "#1c1410",
      "background_gradient_to": "#120d0a",
      "font_pair": "fraunces",
      "button_font": "manrope",
      "cover_image_url": "/marketing/showcase/coffee.jpg",
      "cover_style": {
        "x": 50,
        "y": 45,
        "fade": 60,
        "mode": "fade",
        "size": "large",
        "zoom": 1,
        "enabled": true,
        "overlay": 0.35,
        "overlayColor": "#120d0a",
        "stableSizing": true
      },
      "title_style": {
        "bg": "#000000",
        "font": "fraunces",
        "size": 34,
        "align": "center",
        "color": "#f6ead8",
        "bgMode": "none",
        "weight": 700,
        "eyebrow": "Café de especialidad · Palermo",
        "headline": "Molino Café",
        "eyebrowSize": 11,
        "eyebrowColor": "#d9a066",
        "eyebrowWeight": 700,
        "eyebrowTransform": "uppercase",
        "eyebrowLetterSpacing": 0.16
      },
      "subtitle_style": {
        "bg": "#000000",
        "font": "manrope",
        "size": 14,
        "color": "#d8c7b3",
        "bgMode": "none",
        "weight": 500,
        "maxWidth": 290,
        "lineHeight": 1.5
      },
      "logo_style": {
        "x": 50,
        "y": 50,
        "size": 96,
        "zoom": 1,
        "shape": "round",
        "shadow": "soft",
        "fallback": "#f6ead8",
        "initials": "two",
        "treatment": "template",
        "shadowSize": 1,
        "borderColor": "#d9a066",
        "borderWidth": 2,
        "backgroundMode": "auto"
      },
      "button_style": {
        "gap": 11,
        "width": 100,
        "finish": "glass",
        "height": 56,
        "layout": "center",
        "preset": "glass",
        "radius": 16,
        "shadow": "soft",
        "iconSize": 28,
        "oneColor": "#f6ead8",
        "textSize": 14,
        "colorMode": "one",
        "collection": "glass",
        "headerCard": false,
        "templateId": "rubro:gastronomia",
        "contentAlign": "left",
        "quickSocials": [
          {
            "url": "molinocafe",
            "type": "instagram"
          },
          {
            "url": "5493511234567",
            "type": "whatsapp"
          }
        ],
        "showBranding": true,
        "iconAppearance": "minimal",
        "colorModeManual": true,
        "contentAlignMode": "manual",
        "quickSocialsFilled": true
      }
    },
    "actions": [
      {
        "type": "url",
        "title": "Ver la carta",
        "subtitle": "Cafetería, brunch y pastelería",
        "url": "https://molinocafe.com.ar/carta",
        "icon": "book"
      },
      {
        "type": "whatsapp",
        "title": "Reservá tu mesa",
        "subtitle": "Te confirmamos al toque",
        "url": "5493511234567",
        "message": "Hola! Quiero reservar una mesa.",
        "icon": "→"
      },
      {
        "type": "url",
        "title": "Pedí para llevar",
        "subtitle": "Delivery y take away",
        "url": "https://pedidos.molinocafe.com.ar",
        "icon": "bag"
      },
      {
        "type": "maps",
        "title": "Cómo llegar",
        "subtitle": "Thames 1234, Palermo",
        "url": "https://maps.google.com/?q=Thames+1234",
        "icon": "→"
      }
    ]
  },
  {
    "id": "bar",
    "name": "Bar y noche",
    "note": "Bares, cervecerías, boliches y eventos",
    "landing": {
      "business_name": "Distrito Neón",
      "description": "Coctelería de autor, DJs en vivo y cocina hasta tarde.",
      "primary_color": "#ff4fa3",
      "background_type": "gradient",
      "background_color": "#0b0614",
      "background_gradient_to": "#170a24",
      "font_pair": "unbounded",
      "button_font": "manrope",
      "cover_image_url": "/templates/bar-portada.jpg",
      "cover_style": {
        "x": 50,
        "y": 40,
        "fade": 60,
        "mode": "fade",
        "size": "large",
        "zoom": 1,
        "enabled": true,
        "overlay": 0.2,
        "overlayColor": "#0b0614",
        "stableSizing": true
      },
      "title_style": {
        "bg": "#000000",
        "font": "unbounded",
        "size": 30,
        "align": "center",
        "color": "#ffffff",
        "bgMode": "none",
        "effect": "shadow",
        "weight": 800,
        "eyebrow": "Coctelería de autor · Jue a Sáb",
        "headline": "Distrito Neón",
        "effectColor": "#ff4fa3",
        "eyebrowSize": 11,
        "eyebrowColor": "#ffb347",
        "eyebrowWeight": 700,
        "eyebrowTransform": "uppercase",
        "eyebrowLetterSpacing": 0.16
      },
      "subtitle_style": {
        "bg": "#000000",
        "font": "manrope",
        "size": 14,
        "color": "#cdbfe0",
        "bgMode": "none",
        "weight": 500,
        "maxWidth": 290,
        "lineHeight": 1.5
      },
      "logo_style": {
        "x": 50,
        "y": 50,
        "size": 92,
        "zoom": 1,
        "shape": "round",
        "shadow": "glow",
        "fallback": "#ff4fa3",
        "initials": "two",
        "treatment": "template",
        "shadowSize": 1,
        "borderColor": "#ffffff",
        "borderWidth": 2,
        "shadowColor": "#ff4fa3",
        "backgroundMode": "auto"
      },
      "button_style": {
        "gap": 11,
        "width": 100,
        "finish": "outline",
        "height": 56,
        "layout": "center",
        "preset": "neon",
        "radius": 16,
        "shadow": "none",
        "iconSize": 28,
        "oneColor": "#ff4fa3",
        "textSize": 14,
        "colorMode": "one",
        "collection": "aura",
        "fontWeight": 800,
        "headerCard": false,
        "templateId": "rubro:bar",
        "contentAlign": "left",
        "quickSocials": [
          {
            "url": "distritoneon",
            "type": "instagram"
          },
          {
            "url": "https://open.spotify.com/",
            "type": "spotify"
          }
        ],
        "showBranding": true,
        "iconAppearance": "minimal",
        "colorModeManual": true,
        "contentAlignMode": "manual",
        "quickSocialsFilled": true
      }
    },
    "actions": [
      {
        "type": "url",
        "title": "Carta de tragos",
        "subtitle": "Clásicos y de autor",
        "url": "https://distritoneon.com.ar/carta",
        "icon": "book"
      },
      {
        "type": "whatsapp",
        "title": "Reservá tu mesa",
        "subtitle": "Grupos y cumpleaños",
        "url": "5493511234567",
        "message": "Hola! Quiero reservar una mesa."
      },
      {
        "type": "url",
        "title": "Agenda de la semana",
        "subtitle": "DJs, shows y promos",
        "url": "https://distritoneon.com.ar/agenda",
        "icon": "calendar"
      },
      {
        "type": "maps",
        "title": "Cómo llegar",
        "subtitle": "Abasto, Córdoba",
        "url": "https://maps.google.com/?q=Abasto+Cordoba"
      }
    ]
  },
  {
    "id": "turismo",
    "name": "Turismo y experiencias",
    "note": "Excursiones, alojamientos, guías y aventura",
    "landing": {
      "business_name": "Senderos del Valle",
      "description": "Excursiones guiadas, trekking y turismo aventura en las Sierras de Córdoba.",
      "primary_color": "#f2b05e",
      "background_type": "gradient",
      "background_color": "#0f2a24",
      "background_gradient_to": "#0a1f1a",
      "font_pair": "outfit",
      "button_font": "outfit",
      "cover_image_url": "/templates/turismo-portada.jpg",
      "cover_style": {
        "x": 50,
        "y": 40,
        "fade": 55,
        "mode": "fade",
        "size": "large",
        "zoom": 1,
        "enabled": true,
        "overlay": 0.2,
        "overlayColor": "#0f2a24",
        "stableSizing": true
      },
      "title_style": {
        "bg": "#000000",
        "font": "outfit",
        "size": 36,
        "align": "center",
        "color": "#ffffff",
        "bgMode": "none",
        "weight": 800,
        "eyebrow": "Turismo aventura · Sierras de Córdoba",
        "headline": "Senderos del Valle",
        "lineHeight": 1.05,
        "eyebrowSize": 11,
        "eyebrowColor": "#f2b05e",
        "eyebrowWeight": 700,
        "eyebrowTransform": "uppercase",
        "eyebrowLetterSpacing": 0.14
      },
      "subtitle_style": {
        "bg": "#000000",
        "font": "outfit",
        "size": 14,
        "color": "#cfe0d6",
        "bgMode": "none",
        "weight": 400,
        "maxWidth": 300,
        "lineHeight": 1.5
      },
      "logo_style": {
        "x": 50,
        "y": 50,
        "size": 92,
        "zoom": 1,
        "shape": "round",
        "shadow": "soft",
        "fallback": "#f2b05e",
        "initials": "two",
        "treatment": "template",
        "shadowSize": 1,
        "borderColor": "#ffffff",
        "borderWidth": 3,
        "backgroundMode": "auto"
      },
      "button_style": {
        "gap": 10,
        "width": 100,
        "finish": "solid",
        "height": 56,
        "layout": "center",
        "preset": "soft",
        "radius": 28,
        "shadow": "soft",
        "iconSize": 28,
        "oneColor": "#f6efe2",
        "textSize": 14,
        "colorMode": "one",
        "textColor": "#0f2a24",
        "collection": "soft",
        "fontWeight": 700,
        "headerCard": false,
        "templateId": "rubro:turismo",
        "contentAlign": "left",
        "quickSocials": [
          {
            "url": "senderosdelvalle",
            "type": "instagram"
          },
          {
            "url": "@senderosdelvalle",
            "type": "youtube"
          }
        ],
        "showBranding": true,
        "iconAppearance": "minimal",
        "colorModeManual": true,
        "contentAlignMode": "manual",
        "quickSocialsFilled": true
      }
    },
    "actions": [
      {
        "type": "url",
        "title": "Ver salidas y fechas",
        "subtitle": "Calendario de excursiones",
        "url": "https://senderosdelvalle.com.ar/salidas",
        "icon": "calendar"
      },
      {
        "type": "whatsapp",
        "title": "Reservá tu lugar",
        "subtitle": "Cupos limitados por salida",
        "url": "5493511234567",
        "message": "Hola! Quiero reservar una excursión."
      },
      {
        "type": "url",
        "title": "Qué incluye cada excursión",
        "subtitle": "Dificultad, duración y equipo",
        "url": "https://senderosdelvalle.com.ar/info",
        "icon": "info"
      },
      {
        "type": "review",
        "title": "Opiniones de viajeros",
        "subtitle": "4,9 en Google",
        "url": "https://g.page/r/senderos/review"
      },
      {
        "type": "maps",
        "title": "Punto de encuentro",
        "subtitle": "Plaza de Villa Carlos Paz",
        "url": "https://maps.google.com/?q=Villa+Carlos+Paz"
      }
    ]
  },
  {
    "id": "profesional",
    "name": "Profesionales",
    "note": "Abogados, contadores, salud y consultorios",
    "landing": {
      "business_name": "Estudio Rivas",
      "description": "Asesoramiento legal claro y cercano. Primera consulta sin cargo.",
      "primary_color": "#5b7a6a",
      "background_type": "gradient",
      "background_color": "#f5f2ec",
      "background_gradient_to": "#ebe5da",
      "font_pair": "domine",
      "button_font": "manrope",
      "cover_image_url": "/templates/profesional-portada.jpg",
      "cover_style": {
        "x": 50,
        "y": 45,
        "fade": 40,
        "mode": "banner",
        "size": "medium",
        "zoom": 1,
        "enabled": true,
        "overlay": 0,
        "overlayColor": "#1f2a2e",
        "stableSizing": true
      },
      "title_style": {
        "bg": "#000000",
        "font": "domine",
        "size": 32,
        "align": "center",
        "color": "#1f2a2e",
        "bgMode": "none",
        "weight": 700,
        "eyebrow": "Abogada · Derecho de familia",
        "headline": "Estudio Rivas",
        "eyebrowSize": 12,
        "eyebrowColor": "#5b7a6a",
        "eyebrowWeight": 700,
        "eyebrowTransform": "uppercase",
        "eyebrowLetterSpacing": 0.12
      },
      "subtitle_style": {
        "bg": "#000000",
        "font": "manrope",
        "size": 14,
        "color": "#55605f",
        "bgMode": "none",
        "weight": 500,
        "maxWidth": 300,
        "lineHeight": 1.55
      },
      "logo_style": {
        "x": 50,
        "y": 50,
        "size": 96,
        "zoom": 1,
        "shape": "round",
        "shadow": "soft",
        "fallback": "#1f2a2e",
        "initials": "two",
        "treatment": "template",
        "shadowSize": 1,
        "borderColor": "#f5f2ec",
        "borderWidth": 4,
        "backgroundMode": "auto"
      },
      "button_style": {
        "gap": 10,
        "width": 100,
        "finish": "solid",
        "height": 56,
        "layout": "center",
        "preset": "corporate",
        "radius": 10,
        "shadow": "none",
        "iconSize": 28,
        "oneColor": "#1f2a2e",
        "textSize": 14,
        "colorMode": "one",
        "textColor": "#ffffff",
        "collection": "corporate",
        "fontWeight": 700,
        "headerCard": false,
        "templateId": "rubro:profesional",
        "contentAlign": "left",
        "quickSocials": [
          {
            "url": "estudiorivas",
            "type": "linkedin"
          },
          {
            "url": "estudiorivas",
            "type": "instagram"
          }
        ],
        "showBranding": true,
        "iconAppearance": "minimal",
        "colorModeManual": true,
        "contentAlignMode": "manual",
        "quickSocialsFilled": true
      }
    },
    "actions": [
      {
        "type": "calendar",
        "title": "Agendá una consulta",
        "subtitle": "Presencial u online",
        "url": "https://calendly.com/estudiorivas"
      },
      {
        "type": "whatsapp",
        "title": "Escribime por WhatsApp",
        "subtitle": "Respondo en el día",
        "url": "5493511234567",
        "message": "Hola! Quiero hacer una consulta."
      },
      {
        "type": "url",
        "title": "Áreas de práctica",
        "subtitle": "Familia, sucesiones y laboral",
        "url": "https://estudiorivas.com.ar/areas",
        "icon": "briefcase"
      },
      {
        "type": "email",
        "title": "Enviar un email",
        "subtitle": "consultas@estudiorivas.com.ar",
        "url": "consultas@estudiorivas.com.ar"
      },
      {
        "type": "maps",
        "title": "Ubicación del estudio",
        "subtitle": "Bv. San Juan 456, piso 3",
        "url": "https://maps.google.com/?q=Bv+San+Juan+456"
      }
    ]
  },
  {
    "id": "belleza",
    "name": "Belleza y estética",
    "note": "Uñas, pestañas, cejas, spa y peluquería",
    "landing": {
      "business_name": "Lumière Estudio",
      "description": "Uñas, pestañas y cejas con turnos sin espera. Un ratito para vos.",
      "primary_color": "#c98a8f",
      "background_type": "gradient",
      "background_color": "#fbf1ef",
      "background_gradient_to": "#f2dedb",
      "font_pair": "elegant",
      "button_font": "manrope",
      "cover_image_url": "/templates/belleza-portada.jpg",
      "cover_style": {
        "x": 50,
        "y": 40,
        "fade": 55,
        "mode": "fade",
        "size": "medium",
        "zoom": 1,
        "enabled": true,
        "overlay": 0,
        "overlayColor": "#fbf1ef",
        "stableSizing": true
      },
      "title_style": {
        "bg": "#000000",
        "font": "elegant",
        "size": 38,
        "align": "center",
        "color": "#4a2f33",
        "bgMode": "none",
        "italic": true,
        "weight": 700,
        "eyebrow": "Nails · Lashes · Brows",
        "headline": "Lumière Estudio",
        "eyebrowSize": 11,
        "eyebrowColor": "#b0727a",
        "eyebrowWeight": 700,
        "eyebrowTransform": "uppercase",
        "eyebrowLetterSpacing": 0.2
      },
      "subtitle_style": {
        "bg": "#000000",
        "font": "manrope",
        "size": 14,
        "color": "#7a5a5e",
        "bgMode": "none",
        "weight": 500,
        "maxWidth": 290,
        "lineHeight": 1.55
      },
      "logo_style": {
        "x": 50,
        "y": 50,
        "size": 96,
        "zoom": 1,
        "shape": "round",
        "shadow": "soft",
        "fallback": "#ffffff",
        "initials": "one",
        "treatment": "template",
        "shadowSize": 1,
        "borderColor": "#e8c3c5",
        "borderWidth": 3,
        "backgroundMode": "auto"
      },
      "button_style": {
        "gap": 10,
        "width": 100,
        "finish": "solid",
        "height": 56,
        "layout": "center",
        "preset": "pastel",
        "radius": 30,
        "shadow": "soft",
        "iconSize": 28,
        "oneColor": "#f6dcdc",
        "textSize": 14,
        "colorMode": "one",
        "textColor": "#4a2f33",
        "collection": "pastel",
        "fontWeight": 700,
        "headerCard": false,
        "templateId": "rubro:belleza",
        "contentAlign": "center",
        "quickSocials": [
          {
            "url": "lumiere.estudio",
            "type": "instagram"
          },
          {
            "url": "@lumiere.estudio",
            "type": "tiktok"
          }
        ],
        "showBranding": true,
        "iconAppearance": "minimal",
        "colorModeManual": true,
        "contentAlignMode": "manual",
        "quickSocialsFilled": true
      }
    },
    "actions": [
      {
        "type": "whatsapp",
        "title": "Reservá tu turno",
        "subtitle": "Lunes a sábado de 10 a 20",
        "url": "5493511234567",
        "message": "Hola! Quiero reservar un turno.",
        "icon": "calendar"
      },
      {
        "type": "instagram",
        "title": "Mirá nuestros trabajos",
        "subtitle": "@lumiere.estudio",
        "url": "lumiere.estudio"
      },
      {
        "type": "url",
        "title": "Servicios y precios",
        "subtitle": "Semipermanente, lifting y más",
        "url": "https://lumiere.com.ar/precios",
        "icon": "tag"
      },
      {
        "type": "maps",
        "title": "Cómo llegar",
        "subtitle": "Nueva Córdoba",
        "url": "https://maps.google.com/?q=Nueva+Cordoba"
      }
    ]
  },
  {
    "id": "barberia",
    "name": "Barbería y tattoo",
    "note": "Barberías, estudios de tattoo y estilo urbano",
    "landing": {
      "business_name": "Navaja Club",
      "description": "Cortes clásicos, fade y barba con toalla caliente. Sin apuro.",
      "primary_color": "#c8a36a",
      "background_type": "gradient",
      "background_color": "#121010",
      "background_gradient_to": "#0b0a09",
      "font_pair": "bebas",
      "button_font": "manrope",
      "cover_image_url": "/templates/barberia-portada.jpg",
      "cover_style": {
        "x": 50,
        "y": 40,
        "fade": 60,
        "mode": "fade",
        "size": "large",
        "zoom": 1,
        "enabled": true,
        "overlay": 0.25,
        "overlayColor": "#0b0a09",
        "stableSizing": true
      },
      "title_style": {
        "bg": "#000000",
        "font": "bebas",
        "size": 48,
        "align": "center",
        "color": "#f3e7d3",
        "bgMode": "none",
        "weight": 400,
        "eyebrow": "Barbería · Desde 2018",
        "headline": "Navaja Club",
        "transform": "uppercase",
        "eyebrowSize": 11,
        "eyebrowColor": "#c8a36a",
        "eyebrowWeight": 700,
        "eyebrowTransform": "uppercase",
        "eyebrowLetterSpacing": 0.25
      },
      "subtitle_style": {
        "bg": "#000000",
        "font": "manrope",
        "size": 14,
        "color": "#b5aa98",
        "bgMode": "none",
        "weight": 500,
        "maxWidth": 290,
        "lineHeight": 1.5
      },
      "logo_style": {
        "x": 50,
        "y": 50,
        "size": 92,
        "zoom": 1,
        "shape": "round",
        "shadow": "soft",
        "fallback": "#c8a36a",
        "initials": "two",
        "treatment": "template",
        "shadowSize": 1,
        "borderColor": "#121010",
        "borderWidth": 3,
        "backgroundMode": "auto"
      },
      "button_style": {
        "gap": 10,
        "width": 100,
        "finish": "solid",
        "height": 56,
        "layout": "center",
        "preset": "luxury",
        "radius": 4,
        "shadow": "none",
        "iconSize": 28,
        "oneColor": "#c8a36a",
        "textSize": 14,
        "colorMode": "one",
        "collection": "luxury",
        "fontWeight": 700,
        "headerCard": false,
        "templateId": "rubro:barberia",
        "contentAlign": "left",
        "quickSocials": [
          {
            "url": "navajaclub",
            "type": "instagram"
          },
          {
            "url": "5493511234567",
            "type": "whatsapp"
          }
        ],
        "showBranding": true,
        "iconAppearance": "minimal",
        "colorModeManual": true,
        "contentAlignMode": "manual",
        "quickSocialsFilled": true
      }
    },
    "actions": [
      {
        "type": "whatsapp",
        "title": "Reservá tu corte",
        "subtitle": "Turnos de martes a sábado",
        "url": "5493511234567",
        "message": "Hola! Quiero reservar un turno.",
        "icon": "scissors"
      },
      {
        "type": "url",
        "title": "Servicios y precios",
        "subtitle": "Corte, barba y combos",
        "url": "https://navajaclub.com.ar/precios",
        "icon": "tag"
      },
      {
        "type": "instagram",
        "title": "Nuestros cortes",
        "subtitle": "Mirá los últimos trabajos",
        "url": "navajaclub"
      },
      {
        "type": "maps",
        "title": "Cómo llegar",
        "subtitle": "Barrio Güemes",
        "url": "https://maps.google.com/?q=Barrio+Guemes"
      }
    ]
  },
  {
    "id": "oficios",
    "name": "Comercio y oficios",
    "note": "Cerrajerías, talleres y servicios a domicilio",
    "landing": {
      "business_name": "Llave Maestra",
      "description": "Aperturas, cambio de cerraduras y copias de llaves. Vamos a domicilio en toda la ciudad.",
      "primary_color": "#ffcc00",
      "background_type": "gradient",
      "background_color": "#141414",
      "background_gradient_to": "#0d0d0d",
      "font_pair": "anton",
      "button_font": "manrope",
      "cover_image_url": "/templates/oficios-portada.svg",
      "cover_style": {
        "x": 50,
        "y": 30,
        "fade": 45,
        "mode": "fade",
        "size": "medium",
        "zoom": 1,
        "enabled": true,
        "overlay": 0,
        "overlayColor": "#141414",
        "stableSizing": true
      },
      "title_style": {
        "bg": "#000000",
        "font": "anton",
        "size": 46,
        "align": "center",
        "color": "#ffffff",
        "bgMode": "none",
        "weight": 400,
        "eyebrow": "Cerrajería · Urgencias 24 h",
        "headline": "Llave Maestra",
        "transform": "uppercase",
        "eyebrowSize": 11,
        "eyebrowColor": "#ffcc00",
        "eyebrowWeight": 800,
        "letterSpacing": 0,
        "eyebrowTransform": "uppercase",
        "eyebrowLetterSpacing": 0.16
      },
      "subtitle_style": {
        "bg": "#000000",
        "font": "manrope",
        "size": 14,
        "color": "#bdbdbd",
        "bgMode": "none",
        "weight": 500,
        "maxWidth": 300,
        "lineHeight": 1.5
      },
      "logo_style": {
        "x": 50,
        "y": 50,
        "size": 92,
        "zoom": 1,
        "shape": "square",
        "shadow": "hard",
        "fallback": "#ffcc00",
        "initials": "two",
        "treatment": "template",
        "shadowSize": 1,
        "borderColor": "#111111",
        "borderWidth": 3,
        "shadowColor": "#ffcc00",
        "backgroundMode": "auto"
      },
      "button_style": {
        "gap": 10,
        "width": 100,
        "finish": "solid",
        "height": 58,
        "layout": "center",
        "preset": "brutalism",
        "radius": 6,
        "shadow": "none",
        "iconSize": 28,
        "oneColor": "#ffcc00",
        "textSize": 15,
        "colorMode": "one",
        "textColor": "#111111",
        "collection": "corporate",
        "fontWeight": 800,
        "headerCard": false,
        "templateId": "rubro:oficios",
        "contentAlign": "left",
        "quickSocials": [
          {
            "url": "llavemaestra",
            "type": "instagram"
          },
          {
            "url": "llavemaestra",
            "type": "facebook"
          }
        ],
        "showBranding": true,
        "iconAppearance": "minimal",
        "colorModeManual": true,
        "contentAlignMode": "manual",
        "quickSocialsFilled": true
      }
    },
    "actions": [
      {
        "type": "phone",
        "title": "Llamar ahora",
        "subtitle": "Urgencias las 24 horas",
        "url": "3511234567"
      },
      {
        "type": "whatsapp",
        "title": "Pedí un presupuesto",
        "subtitle": "Mandanos una foto de la cerradura",
        "url": "5493511234567",
        "message": "Hola! Necesito un presupuesto."
      },
      {
        "type": "url",
        "title": "Servicios y precios",
        "subtitle": "Aperturas, cerraduras y copias",
        "url": "https://llavemaestra.com.ar/servicios",
        "icon": "tool"
      },
      {
        "type": "review",
        "title": "Dejanos tu reseña",
        "subtitle": "Nos ayuda muchísimo",
        "url": "https://g.page/r/llavemaestra/review"
      },
      {
        "type": "maps",
        "title": "Cómo llegar al local",
        "subtitle": "Av. Colón 1234 · Lun a Sáb 9 a 19",
        "url": "https://maps.google.com/?q=Av+Colon+1234"
      }
    ]
  }
];
