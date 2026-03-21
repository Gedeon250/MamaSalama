import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const AT_API_KEY = Deno.env.get("AT_API_KEY");
    const AT_USERNAME = Deno.env.get("AT_USERNAME");
    if (!AT_API_KEY || !AT_USERNAME) throw new Error("AT credentials not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Get due reminders with linked phone numbers
    const { data: reminders } = await supabase
      .from("reminders")
      .select("title, description, due_date, user_id")
      .eq("due_date", today)
      .eq("is_completed", false);

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No reminders due today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(reminders.map((r) => r.user_id))];

    // Get profiles with phone numbers
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, phone, name")
      .in("user_id", userIds)
      .not("phone", "is", null);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No users with phone numbers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneMap = new Map(profiles.map((p) => [p.user_id, { phone: p.phone!, name: p.name }]));
    let sentCount = 0;

    for (const reminder of reminders) {
      const userInfo = phoneMap.get(reminder.user_id);
      if (!userInfo) continue;

      const smsMessage = `SafeStart Mama Reminder 🤱\nHi ${userInfo.name}, you have: ${reminder.title}${reminder.description ? ` - ${reminder.description}` : ""}\nDue: ${reminder.due_date}`;

      const baseUrl = AT_USERNAME === "sandbox"
        ? "https://api.sandbox.africastalking.com"
        : "https://api.africastalking.com";

      try {
        const atResponse = await fetch(`${baseUrl}/version1/messaging`, {
          method: "POST",
          headers: {
            apiKey: AT_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams({
            username: AT_USERNAME,
            to: userInfo.phone,
            message: smsMessage,
          }),
        });

        if (atResponse.ok) {
          // Log the SMS
          const { data: session } = await supabase
            .from("sms_sessions")
            .upsert(
              { phone_number: userInfo.phone, user_id: reminder.user_id, last_activity_at: new Date().toISOString() },
              { onConflict: "phone_number" }
            )
            .select("id")
            .single();

          await supabase.from("sms_messages").insert({
            phone_number: userInfo.phone,
            direction: "outbound",
            content: smsMessage,
            message_type: "reminder",
            session_id: session?.id,
          });

          sentCount++;
        } else {
          const errText = await atResponse.text();
          console.error(`Failed to send to ${userInfo.phone}:`, errText);
        }
      } catch (err) {
        console.error(`Error sending to ${userInfo.phone}:`, err);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, total: reminders.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("SMS reminder error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
