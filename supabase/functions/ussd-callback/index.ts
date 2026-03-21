import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize phone: 0780549226 -> +250780549226, already +250... stays
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return "+" + digits;
  if (digits.startsWith("0")) return "+250" + digits.slice(1);
  return "+" + digits;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const sessionId = params.get("sessionId") || "";
    const rawPhone = params.get("phoneNumber") || "";
    const text = params.get("text") || "";

    const phoneNumber = normalizePhone(rawPhone);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by phone — try both normalized and raw formats
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .or(`phone.eq.${phoneNumber},phone.eq.${rawPhone}`)
      .maybeSingle();

    const userId = profile?.user_id ?? null;

    // Upsert session
    await supabase.from("sms_sessions").upsert(
      {
        phone_number: phoneNumber,
        session_data: { ussd_session: sessionId },
        last_activity_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {}),
      },
      { onConflict: "phone_number" }
    );

    const textParts = text.split("*");
    const level = textParts.length;
    let response = "";

    if (text === "") {
      response = `CON Welcome to MamaSalama 🤱
1. Check Vaccination Schedule
2. My Reminders
3. Emergency Contacts
4. Chat with Health Worker
5. Change Language (Hindura ururimi)`;

    } else if (textParts[0] === "1") {
      if (!userId) {
        response = "END Your phone is not linked to an account yet. Sign up on MamaSalama and add your phone number.";
      } else {
        const { data: vaccinations } = await supabase
          .from("vaccinations")
          .select("name, age_in_weeks")
          .eq("user_id", userId)
          .eq("is_completed", false)
          .order("age_in_weeks")
          .limit(5);

        if (vaccinations && vaccinations.length > 0) {
          const list = vaccinations.map((v, i) => `${i + 1}. ${v.name} (Week ${v.age_in_weeks})`).join("\n");
          response = `END Upcoming Vaccinations:\n${list}\n\nVisit your nearest health facility.`;
        } else {
          response = "END All vaccinations are up to date! Great job! 🎉";
        }
      }

    } else if (textParts[0] === "2") {
      if (!userId) {
        response = "END Your phone is not linked to an account yet. Sign up on MamaSalama and add your phone number.";
      } else {
        const { data: reminders } = await supabase
          .from("reminders")
          .select("title, due_date")
          .eq("user_id", userId)
          .eq("is_completed", false)
          .order("due_date")
          .limit(5);

        if (reminders && reminders.length > 0) {
          const list = reminders.map((r, i) => `${i + 1}. ${r.title} - ${r.due_date}`).join("\n");
          response = `END Your Reminders:\n${list}`;
        } else {
          response = "END No upcoming reminders. You're all caught up!";
        }
      }

    } else if (textParts[0] === "3") {
      response = `END Emergency Contacts:
🚑 Ambulance: 912
🏥 Health Hotline: 114
👩‍⚕️ MamaSalama: +250 788 000 000

For emergencies, call immediately!`;

    } else if (textParts[0] === "4") {
      if (level === 1) {
        response = "CON Type your message to the health worker:\n(Enter 0 to go back)";
      } else {
        const message = textParts.slice(1).join(" ");
        if (message === "0") {
          response = `CON Welcome to MamaSalama 🤱
1. Check Vaccination Schedule
2. My Reminders
3. Emergency Contacts
4. Chat with Health Worker
5. Change Language`;
        } else {
          const { data: session } = await supabase
            .from("sms_sessions")
            .select("id")
            .eq("phone_number", phoneNumber)
            .single();

          await supabase.from("sms_messages").insert({
            phone_number: phoneNumber,
            direction: "inbound",
            content: message,
            message_type: "chat",
            session_id: session?.id,
          });

          response = "END Your message has been sent to a health worker. They will reply via SMS.";
        }
      }

    } else if (textParts[0] === "5") {
      if (level === 1) {
        response = `CON Choose Language / Hitamo ururimi:
1. English
2. Kinyarwanda`;
      } else if (textParts[1] === "1") {
        response = "END Language set to English. ✅";
      } else if (textParts[1] === "2") {
        response = "END Ururimi rwahinduwe mu Kinyarwanda. ✅";
      }
    } else {
      response = "END Invalid option. Dial again to try.";
    }

    return new Response(response, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (e) {
    console.error("USSD error:", e);
    return new Response("END An error occurred. Please try again.", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
