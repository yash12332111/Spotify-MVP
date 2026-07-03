import { classifyMoment, generateReasonLine } from "./lib/groq";

async function test() {
  process.env.GROQ_API_KEY_PRIMARY = "";
  process.env.GROQ_API_KEY_SECONDARY = "";
  
  const ctx = {
    time_of_day: "11:00",
    day_of_week: "Sat",
    previous_session_type: "lean_back",
    gap_minutes: 30,
    device: "phone"
  };
  const result = await classifyMoment(ctx, "Haripriya");
  console.log("Moment Result:", result);

  const reason = await generateReasonLine({ title: "Sofia", artist: "Clairo" }, "Haripriya", "lean_back");
  console.log("Reason Line:", reason);
}

test();
