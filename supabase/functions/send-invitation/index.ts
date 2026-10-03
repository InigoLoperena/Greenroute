import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "");
    if (!url || !anonKey || !serviceKey || !resendKey || !appUrl) {
      return json({ error: "Server configuration error" }, 500);
    }

    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const { email, companyId } = await req.json();
    if (typeof email !== "string" || !email.includes("@") || typeof companyId !== "string") {
      return json({ error: "Valid email and companyId are required" }, 400);
    }
    const normalizedEmail = email.trim().toLowerCase();

    const admin = createClient(url, serviceKey);
    const { data: membership, error: membershipError } = await admin
      .from("company_members")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (membershipError || membership?.role !== "admin") return json({ error: "Forbidden" }, 403);

    const { data: company, error: companyError } = await admin
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .single();
    if (companyError || !company) return json({ error: "Company not found" }, 404);

    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    const inviterName = inviterProfile?.full_name || inviterProfile?.email || "Un administrador";

    const { data: existingUser } = await admin
      .from("profiles")
      .select("user_id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingUser?.user_id) {
      await admin.from("company_members").upsert(
        { company_id: companyId, user_id: existingUser.user_id, role: "member" },
        { onConflict: "company_id,user_id" },
      );
      await admin.from("company_invitations")
        .update({ accepted: true })
        .eq("company_id", companyId)
        .ilike("email", normalizedEmail)
        .eq("accepted", false);
    } else {
      const { data: pending } = await admin
        .from("company_invitations")
        .select("id")
        .eq("company_id", companyId)
        .ilike("email", normalizedEmail)
        .eq("accepted", false)
        .limit(1)
        .maybeSingle();

      if (!pending) {
        const { error: invitationError } = await admin.from("company_invitations").insert({
          company_id: companyId,
          email: normalizedEmail,
          invited_by: authData.user.id,
        });
        if (invitationError) throw invitationError;
      }
    }

    const safeCompany = escapeHtml(company.name);
    const safeInviter = escapeHtml(inviterName);
    const safeEmail = escapeHtml(normalizedEmail);
    const invitationUrl = `${appUrl}/auth?mode=register&invitation=true&company=${encodeURIComponent(company.name)}&invite_email=${encodeURIComponent(normalizedEmail)}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Greenroute <noreply@greenroute.digital>",
        to: [normalizedEmail],
        subject: `Te han invitado a ${company.name} en Greenroute`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h1 style="color:#16a34a;font-size:24px;">Greenroute</h1>
            <p><strong>${safeInviter}</strong> te ha invitado a unirte al equipo <strong>${safeCompany}</strong>.</p>
            <p>Accede con este email: <strong>${safeEmail}</strong>.</p>
            <a href="${invitationUrl}" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Crear cuenta / Acceder</a>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Resend failed", await response.text());
      return json({ error: "Invitation was saved but the email could not be sent" }, 502);
    }

    return json({ success: true, existingUserAdded: Boolean(existingUser?.user_id) });
  } catch (error) {
    console.error("send-invitation error", error);
    return json({ error: "Unexpected server error" }, 500);
  }
});
