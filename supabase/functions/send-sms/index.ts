import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin/moderator role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "moderator"]);

    if (!roles?.length) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, message, messageType = "chat" } = await req.json();

    const AT_API_KEY = Deno.env.get("AT_API_KEY");
    const AT_USERNAME = Deno.env.get("AT_USERNAME");

    if (!AT_API_KEY || !AT_USERNAME) {
      throw new Error("Africa's Talking credentials not configured");
    }

    console.log("Sending SMS to:", to, "username:", AT_USERNAME);

    const baseUrl = AT_USERNAME.toLowerCase() === "sandbox"
      ? "https://api.sandbox.africastalking.com"
      : "https://api.africastalking.com";

    const atResponse = await fetch(`${baseUrl}/version1/messaging`, {
      method: "POST",
      headers: {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to: to,
        message: message,
      }),
    });

    const atText = await atResponse.text();
    console.log("AT response status:", atResponse.status, "body:", atText);

    if (!atResponse.ok) {
      return new Response(JSON.stringify({ error: `SMS API error (${atResponse.status}): ${atText}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let atResult;
    try { atResult = JSON.parse(atText); } catch { atResult = { raw: atText }; }

    // Log outbound message
    const { data: session } = await supabaseAdmin
      .from("sms_sessions")
      .upsert(
        { phone_number: to, last_activity_at: new Date().toISOString() },
        { onConflict: "phone_number" }
      )
      .select("id")
      .single();

    await supabaseAdmin.from("sms_messages").insert({
      phone_number: to,
      direction: "outbound",
      content: message,
      message_type: messageType,
      session_id: session?.id,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, result: atResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Send SMS error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
