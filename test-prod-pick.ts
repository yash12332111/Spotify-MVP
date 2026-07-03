import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const PROD_URL = "https://spotify-mvp-chi.vercel.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { data: vaishnavi } = await supabase
    .from("personas")
    .select("id")
    .eq("name", "Vaishnavi")
    .single();

  const pickRes = await fetch(`${PROD_URL}/api/pick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona_id: vaishnavi.id, session_id: randomUUID() })
  });

  console.log("Status:", pickRes.status);
  console.log(await pickRes.text());
}
main();
