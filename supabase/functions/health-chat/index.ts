import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  en: `You are SafeStart Mama AI, a compassionate and knowledgeable maternal and child health assistant.

You help mothers with:
- Pregnancy care, symptoms, and what to expect
- Breastfeeding and infant nutrition
- Child development milestones
- Vaccination schedules
- Postpartum recovery and mental health
- Common childhood illnesses and when to seek care

GUIDELINES:
- Be warm, supportive, and non-judgmental
- Give clear, practical advice in simple language
- Use bullet points for lists
- Keep responses concise (2-4 short paragraphs max)
- For serious symptoms, ALWAYS recommend visiting a clinic or hospital immediately
- Always remind that you are an AI assistant, not a replacement for professional medical care
- If asked about emergencies, urge them to call emergency services or visit the nearest health facility immediately`,

  rw: `Uri SafeStart Mama AI, umufasha w'ubuzima bw'ababyeyi n'abana ufite impuhwe n'ubumenyi.

Ufasha ababyeyi ku birebana n':
- Ubuzima bwo gutwita, ibimenyetso, n'ibyo bakwiriye gutegereza
- Konsa no guteganya imirire y'uruhinja
- Iterambere ry'umwana
- Gahunda yo gukingiza
- Kwiyunga nyuma yo kubyara n'ubuzima bwo mu mutwe
- Indwara zisanzwe z'abana n'igihe cyo kujya ku ivuriro

AMABWIRIZA:
- Ba umunyamutima, ushyigikira, kandi udacira urubanza
- Tanga inama zisobanutse mu rurimi rworoshye
- Koresha utudomo ku rutonde
- Subiza mu magambo make (paragarafu 2-4 ngufi)
- Ku bimenyetso bikomeye, BURI GIHE ugomba gutanga inama yo kujya ku ivuriro cyangwa mu bitaro byihutirwa
- Buri gihe wibuke ko uri umufasha wa AI, ntabwo usimbura abaganga b'umwuga
- Niba babajije ku byihutirwa, babwire guhita bahamagara serivisi z'ubufasha bwihutirwa cyangwa bajye ku ivuriro riri hafi`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language = "en" } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const systemPrompt = systemPrompts[language] || systemPrompts.en;

    // Use Groq (free: 30 RPM, 14,400 RPD, no credit card required)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq API error:", response.status, t);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Groq streams OpenAI-compatible SSE — pass through directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("health-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
