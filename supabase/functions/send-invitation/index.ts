import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { email, companyName, invitedBy } = await req.json();
    if (!email || !companyName) throw new Error("Missing email or companyName");

    const siteUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "").replace("https://", "") || "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Greenroute <noreply@greenroute.digital>",
        to: [email],
        subject: `Te han invitado a ${companyName} en Greenroute`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h1 style="color:#16a34a;font-size:24px;">🔄 Greenroute</h1>
            <p style="font-size:16px;color:#333;">¡Hola!</p>
            <p style="font-size:16px;color:#333;"><strong>${invitedBy || "Un administrador"}</strong> te ha invitado a unirte al equipo <strong>${companyName}</strong> en Greenroute.</p>
            <p style="font-size:16px;color:#333;">Regístrate con este mismo email (<strong>${email}</strong>) para unirte automáticamente al equipo.</p>
            <a href="https://map-my-route-pal.lovable.app/auth?mode=register&invitation=true&company=${encodeURIComponent(companyName)}&invite_email=${encodeURIComponent(email)}" 
               style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
              Crear cuenta
            </a>
            <p style="font-size:13px;color:#999;margin-top:24px;">Gestión inteligente de recogida de residuos</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("send-invitation error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
