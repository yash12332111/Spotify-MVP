import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const PROD_URL = "https://spotify-mvp-chi.vercel.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runTest(iteration: number, personaId: string) {
  console.log(`\n--- RUN ${iteration} ---`);
  const sessionId = randomUUID();
  console.log(`Session ID: ${sessionId}`);
  
  const start = Date.now();
  const pickRes = await fetch(`${PROD_URL}/api/pick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona_id: personaId, session_id: sessionId })
  });
  
  const ms = Date.now() - start;
  console.log(`Status: ${pickRes.status} (Took ${ms}ms)`);
  console.log("Response Body:");
  console.log(await pickRes.text());
}

async function main() {
  const { data: vaishnavi } = await supabase
    .from("personas")
    .select("id")
    .eq("name", "Vaishnavi")
    .single();

  for (let i = 1; i <= 3; i++) {
    await runTest(i, vaishnavi.id);
    if (i < 3) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
main();
