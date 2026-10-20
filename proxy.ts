import {createServerClient} from "@supabase/ssr";import {NextResponse,type NextRequest} from "next/server";
export async function proxy(req:NextRequest){let res=NextResponse.next({request:req});const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>req.cookies.getAll(),setAll(xs){xs.forEach(({name,value})=>req.cookies.set(name,value));res=NextResponse.next({request:req});xs.forEach(({name,value,options})=>res.cookies.set(name,value,options))}}});await s.auth.getClaims();return res}
// Solo el admin necesita refrescar la sesión. Antes corría en cada visita (páginas públicas de los
// clientes, imágenes de la home…) sin ninguna necesidad. Las páginas públicas no dependen de esto: lo
// único que miran de la sesión es si quien la ve es el dueño, para no contar esa visita.
export const config={matcher:["/admin/:path*","/mi/:path*","/activar"]};