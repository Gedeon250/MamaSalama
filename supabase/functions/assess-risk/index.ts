import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HIGH_RISK_KEYWORDS = [
  // English
  "bleeding", "blood", "severe pain", "unconscious", "convulsion", "seizure",
  "high fever", "can't breathe", "not breathing", "swollen", "blurred vision",
  "headache severe", "water broke", "premature", "miscarriage", "chest pain",
  "baby not moving", "fainted", "emergency", "accident",
  // Kinyarwanda
  "amaraso", "kubabara cyane", "guhumbya", "umuriro ukabije", "guhumeka",
  "kunanirwa guhumeka", "kubyimba", "kutabona neza", "umutwe ukabije",
  "amazi yavuyemo", "gukuramo inda", "igituza kibabaye", "umwana ntiyimuka",
  "guta ubwenge", "impanuka",
];

const MEDIUM_RISK_KEYWORDS = [
  "fever", "diarrhea", "vomiting", "not eating", "weak", "dizzy", "tired",
  "pain", "swelling", "rash", "cough", "infection",
  "umuriro", "impiswi", "kuruka", "kudashaka kurya", "gucika intege",
  "kuzungurirwa", "kunanirwa", "kubabara", "kubyimba", "uburwayi",
];

function detectRiskLevel(messages: { content: string }[]): { level: string; reason: string } {
  const allText = messages.map(m => m.content).join(" ").toLowerCase();

  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (allText.includes(keyword)) {
      return { level: "high", reason: `Detected: "${keyword}"` };
    }
  }

  let mediumCount = 0;
  for (const keyword of MEDIUM_RISK_KEYWORDS) {
    if (allText.includes(keyword)) mediumCount++;
  }
  if (mediumCount >= 2) {
    return { level: "medium", reason: `Multiple symptoms detected (${mediumCount})` };
  }
  if (mediumCount >= 1) {
    return { level: "low", reason: "Minor symptom detected" };
  }

  return { level: "none", reason: "" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, messages, user_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { level, reason } = detectRiskLevel(messages);

    // Update conversation with risk info
    const updates: Record<string, unknown> = {
      risk_level: level,
      updated_at: new Date().toISOString(),
    };

    if (level === "high" || level === "medium") {
      updates.ai_summary = `Risk: ${level}. ${reason}. Last message: "${messages[messages.length - 1]?.content?.substring(0, 200)}"`;

      if (level === "high") {
        updates.status = "escalated";
        updates.escalated_at = new Date().toISOString();

        // Get patient info for notification
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, location")
          .eq("user_id", user_id)
          .single();

        // Notify all admins/moderators
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "moderator"]);

        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            user_id: admin.user_id,
            title: "🚨 Emergency Case Alert",
            message: `Patient ${profile?.name || "Unknown"} (${profile?.location || "Unknown location"}) needs urgent attention. ${reason}`,
            type: "emergency",
            created_by: user_id,
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }
    }

    if (conversation_id) {
      await supabase
        .from("chat_conversations")
        .update(updates)
        .eq("id", conversation_id);
    }

    return new Response(JSON.stringify({ risk_level: level, reason, escalated: level === "high" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assess-risk error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
