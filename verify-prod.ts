import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const PROD_URL = "https://spotify-mvp-chi.vercel.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("--- 1. VAISHNAVI SILENCE STATE ---");
  
  // 1. Get Vaishnavi's persona ID
  const { data: vaishnavi, error: pErr } = await supabase
    .from("personas")
    .select("id")
    .eq("name", "Vaishnavi")
    .single();

  if (pErr || !vaishnavi) {
    console.error("Failed to fetch Vaishnavi", pErr);
    return;
  }
  
  const personaId = vaishnavi.id;
  const sessionId = randomUUID();
  console.log(`Using Session ID: ${sessionId} for Persona: ${personaId}`);

  // Hit prod pick API
  const pickRes = await fetch(`${PROD_URL}/api/pick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona_id: personaId, session_id: sessionId })
  });

  const text = await pickRes.text();
  console.log("Prod /api/pick response status:", pickRes.status);
  console.log("Raw Response Body:", text);

  try {
    console.log("Parsed JSON:", JSON.parse(text));
  } catch(e) {
    console.error("Failed to parse JSON");
  }


  console.log("\n--- 2. IGNORE SIGNAL PERSISTENCE ---");
  
  // Get a track_id
  const { data: track, error: tErr } = await supabase
    .from("tracks")
    .select("id")
    .limit(1)
    .single();
    
  if (tErr || !track) {
    console.error("Failed to fetch track", tErr);
    return;
  }
  
  const trackId = track.id;
  
  // Hit prod signal API
  const signalRes = await fetch(`${PROD_URL}/api/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      persona_id: personaId,
      track_id: trackId,
      action: "ignore"
    })
  });
  
  const sText = await signalRes.text();
  console.log("Prod /api/signal response status:", signalRes.status);
  console.log("Raw Response Body:", sText);
  try {
    console.log("Parsed JSON:", JSON.parse(sText));
  } catch(e) {
    console.error("Failed to parse JSON");
  }
  
  // Wait a sec for DB (though it is synchronous in the API)
  await new Promise(r => setTimeout(r, 1000));
  
  // Query Supabase
  const { data: signalRows, error: sErr } = await supabase
    .from("session_signals")
    .select("*")
    .eq("session_id", sessionId)
    .eq("track_id", trackId)
    .eq("action", "ignore");
    
  if (sErr) {
    console.error("Failed to fetch signals", sErr);
  } else {
    console.log(`Found ${signalRows?.length} ignore signals in DB:`);
    console.log(JSON.stringify(signalRows, null, 2));
  }
}

main().catch(console.error);
