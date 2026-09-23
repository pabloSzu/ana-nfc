-- Esquema base del proyecto. Es lo que había que tener desde el principio y no estaba:
-- las tablas se habían creado a mano en el dashboard, así que el repo no podía reconstruir
-- la base desde cero y un proyecto nuevo arrancaba vacío.
--
-- NO es una migración y no va en supabase/migrations/ a propósito: las bases que ya existen
-- (dev y prod) ya tienen todo esto aplicado, y el historial de migraciones no lo incluye. Si
-- estuviera ahí, `db push` intentaría correrlo sobre ellas y fallaría.
--
-- Se usa UNA vez, sobre un proyecto de Supabase recién creado y vacío:
--
--   psql "<cadena del Session pooler del proyecto nuevo>" -v ON_ERROR_STOP=1 -f supabase/baseline/01-schema.sql
--
-- y después, desde el repo, las migraciones normales:  npm run db:dev:apply
--
-- Generado con pg_dump desde el proyecto de dev. Incluye las 4 tablas, sus índices, RLS
-- habilitada y las 18 políticas. NO incluye datos.

--
-- PostgreSQL database dump
--
\restrict RI6bkgo7AGGGV48hO4rvX3JPSH9bjWvXPf5P8yAFRDEUNno2n5ATdZrDs970R3J
-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--
CREATE SCHEMA public;
--
-- Name: actions; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    landing_id uuid NOT NULL,
    title text NOT NULL,
    type text DEFAULT 'whatsapp'::text,
    message text DEFAULT ''::text,
    url text DEFAULT ''::text,
    icon text DEFAULT '→'::text,
    enabled boolean DEFAULT true,
    "position" integer DEFAULT 0,
    background_color text DEFAULT ''::text,
    text_color text DEFAULT '#ffffff'::text,
    icon_color text DEFAULT ''::text,
    use_auto_color boolean DEFAULT true,
    source_field text,
    is_generated boolean DEFAULT false,
    subtitle text DEFAULT ''::text
);
--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    email text DEFAULT ''::text,
    phone text DEFAULT ''::text,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    primary_color text DEFAULT '#1f2937'::text,
    background_color text DEFAULT '#f7f5f0'::text
);
--
-- Name: landing_views; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.landing_views (
    id bigint NOT NULL,
    landing_id uuid NOT NULL,
    source text DEFAULT 'direct'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT landing_views_source_check CHECK ((source = ANY (ARRAY['nfc'::text, 'qr'::text, 'direct'::text])))
);
--
-- Name: landing_view_counts; Type: VIEW; Schema: public; Owner: -
--
CREATE VIEW public.landing_view_counts WITH (security_invoker='true') AS
 SELECT landing_id,
    count(*) AS total,
    count(*) FILTER (WHERE (created_at > (now() - '30 days'::interval))) AS last_30_days,
    max(created_at) AS last_view_at
   FROM public.landing_views
  GROUP BY landing_id;
--
-- Name: landing_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--
ALTER TABLE public.landing_views ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.landing_views_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
--
-- Name: landings; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.landings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    client_id uuid,
    business_name text NOT NULL,
    slug text NOT NULL,
    description text DEFAULT ''::text,
    logo_url text DEFAULT ''::text,
    whatsapp text DEFAULT ''::text,
    primary_color text DEFAULT '#111111'::text,
    template text DEFAULT 'professional'::text,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    background_color text DEFAULT '#f7f5f0'::text,
    business_type text DEFAULT 'custom'::text,
    redirect_url text,
    background_type text DEFAULT 'color'::text NOT NULL,
    background_gradient_to text,
    background_image_url text,
    text_color text,
    font_pair text DEFAULT 'modern'::text NOT NULL,
    text_panel boolean DEFAULT false NOT NULL,
    button_font text DEFAULT 'modern'::text NOT NULL,
    text_panel_color text,
    button_shape text DEFAULT 'rounded'::text,
    button_fill text DEFAULT 'solid'::text,
    button_style jsonb DEFAULT '{}'::jsonb,
    title_style jsonb DEFAULT '{}'::jsonb,
    subtitle_style jsonb DEFAULT '{}'::jsonb,
    logo_style jsonb DEFAULT '{}'::jsonb,
    background_style jsonb DEFAULT '{}'::jsonb,
    cover_image_url text,
    cover_style jsonb,
    qr_style jsonb
);
--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);
--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);
--
-- Name: landing_views landing_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.landing_views
    ADD CONSTRAINT landing_views_pkey PRIMARY KEY (id);
--
-- Name: landings landings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.landings
    ADD CONSTRAINT landings_pkey PRIMARY KEY (id);
--
-- Name: landings landings_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.landings
    ADD CONSTRAINT landings_slug_key UNIQUE (slug);
--
-- Name: landing_views_landing_created_idx; Type: INDEX; Schema: public; Owner: -
--
CREATE INDEX landing_views_landing_created_idx ON public.landing_views USING btree (landing_id, created_at DESC);
--
-- Name: actions actions_landing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_landing_id_fkey FOREIGN KEY (landing_id) REFERENCES public.landings(id) ON DELETE CASCADE;
--
-- Name: clients clients_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: landing_views landing_views_landing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.landing_views
    ADD CONSTRAINT landing_views_landing_id_fkey FOREIGN KEY (landing_id) REFERENCES public.landings(id) ON DELETE CASCADE;
--
-- Name: landings landings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.landings
    ADD CONSTRAINT landings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
--
-- Name: landings landings_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--
ALTER TABLE ONLY public.landings
    ADD CONSTRAINT landings_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- Name: actions Public can read enabled actions of published landings; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "Public can read enabled actions of published landings" ON public.actions FOR SELECT TO anon USING (((enabled = true) AND (EXISTS ( SELECT 1
   FROM public.landings
  WHERE ((landings.id = actions.landing_id) AND (landings.published = true))))));
--
-- Name: landings Public can read published landings; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "Public can read published landings" ON public.landings FOR SELECT TO anon USING ((published = true));
--
-- Name: actions action owner delete; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "action owner delete" ON public.actions FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.landings l
  WHERE ((l.id = actions.landing_id) AND (l.owner_id = auth.uid())))));
--
-- Name: actions action owner insert; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "action owner insert" ON public.actions FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.landings l
  WHERE ((l.id = actions.landing_id) AND (l.owner_id = auth.uid())))));
--
-- Name: actions action owner select; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "action owner select" ON public.actions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.landings l
  WHERE ((l.id = actions.landing_id) AND (l.owner_id = auth.uid())))));
--
-- Name: actions action owner update; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "action owner update" ON public.actions FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.landings l
  WHERE ((l.id = actions.landing_id) AND (l.owner_id = auth.uid())))));
--
-- Name: actions action public; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "action public" ON public.actions FOR SELECT TO authenticated, anon USING (((enabled = true) AND (EXISTS ( SELECT 1
   FROM public.landings l
  WHERE ((l.id = actions.landing_id) AND (l.published = true))))));
--
-- Name: actions; Type: ROW SECURITY; Schema: public; Owner: -
--
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
--
-- Name: clients client owner delete; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "client owner delete" ON public.clients FOR DELETE TO authenticated USING ((auth.uid() = owner_id));
--
-- Name: clients client owner insert; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "client owner insert" ON public.clients FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_id));
--
-- Name: clients client owner select; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "client owner select" ON public.clients FOR SELECT TO authenticated USING ((auth.uid() = owner_id));
--
-- Name: clients client owner update; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "client owner update" ON public.clients FOR UPDATE TO authenticated USING ((auth.uid() = owner_id));
--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
--
-- Name: landing_views el dueño lee las visitas de sus landings; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "el dueño lee las visitas de sus landings" ON public.landing_views FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.landings
  WHERE ((landings.id = landing_views.landing_id) AND (landings.owner_id = auth.uid())))));
--
-- Name: landings landing owner delete; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "landing owner delete" ON public.landings FOR DELETE TO authenticated USING ((auth.uid() = owner_id));
--
-- Name: landings landing owner insert; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "landing owner insert" ON public.landings FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_id));
--
-- Name: landings landing owner select; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "landing owner select" ON public.landings FOR SELECT TO authenticated USING ((auth.uid() = owner_id));
--
-- Name: landings landing owner update; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "landing owner update" ON public.landings FOR UPDATE TO authenticated USING ((auth.uid() = owner_id));
--
-- Name: landings landing public; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "landing public" ON public.landings FOR SELECT TO authenticated, anon USING ((published = true));
--
-- Name: landing_views; Type: ROW SECURITY; Schema: public; Owner: -
--
ALTER TABLE public.landing_views ENABLE ROW LEVEL SECURITY;
--
-- Name: landings; Type: ROW SECURITY; Schema: public; Owner: -
--
ALTER TABLE public.landings ENABLE ROW LEVEL SECURITY;
--
-- Name: landing_views registrar visita de una landing publicada; Type: POLICY; Schema: public; Owner: -
--
CREATE POLICY "registrar visita de una landing publicada" ON public.landing_views FOR INSERT TO authenticated, anon WITH CHECK ((EXISTS ( SELECT 1
   FROM public.landings
  WHERE ((landings.id = landing_views.landing_id) AND landings.published))));
--
-- PostgreSQL database dump complete
--
\unrestrict RI6bkgo7AGGGV48hO4rvX3JPSH9bjWvXPf5P8yAFRDEUNno2n5ATdZrDs970R3J
