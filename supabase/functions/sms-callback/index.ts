import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const from = params.get("from") || "";
    const text = params.get("text") || "";
    const to = params.get("to") || "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert session for this phone
    const { data: session } = await supabase
      .from("sms_sessions")
      .upsert(
        { phone_number: from, last_activity_at: new Date().toISOString() },
        { onConflict: "phone_number" }
      )
      .select("id")
      .single();

    // Store inbound message
    await supabase.from("sms_messages").insert({
      phone_number: from,
      direction: "inbound",
      content: text,
      message_type: "chat",
      session_id: session?.id,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("SMS callback error:", e);
    return new Response(JSON.stringify({ error: "Failed to process SMS" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
