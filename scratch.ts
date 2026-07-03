const MOOD_WEIGHTS: Record<string, Record<string, number>> = {
  calm:        { romantic: 0.9, dreamy: 0.8, melancholic: 0.6, upbeat: 0.2, energetic: 0.0, joyful: 0.3 },
  mellow:      { romantic: 0.7, dreamy: 0.9, melancholic: 0.8, upbeat: 0.3, energetic: 0.0, joyful: 0.4 },
  romantic:    { romantic: 1.0, dreamy: 0.6, melancholic: 0.4, upbeat: 0.4, energetic: 0.1, joyful: 0.5 },
  melancholic: { romantic: 0.4, dreamy: 0.6, melancholic: 1.0, upbeat: 0.1, energetic: 0.0, joyful: 0.1 },
  energetic:   { romantic: 0.2, dreamy: 0.1, melancholic: 0.1, upbeat: 0.9, energetic: 1.0, joyful: 0.8 },
};

function overlapScore(
  track: { mood: string, energy: number },
  tasteVector: Record<string, number>
): number {
  const mood = track.mood ?? "dreamy";
  const energy = (track.energy ?? 5) / 10;

  let score = 0;
  let weight = 0;

  for (const [dim, dimWeight] of Object.entries(tasteVector)) {
    const moodMap = MOOD_WEIGHTS[dim];
    if (moodMap) {
      score += dimWeight * (moodMap[mood] ?? 0.3);
      weight += dimWeight;
    }
  }

  const energyAlign = tasteVector.energetic ?? 0.5;
  score += Math.abs(energyAlign - energy) < 0.3 ? 0.1 : 0;

  return weight > 0 ? score / weight : 0;
}

const DISCOVERY_TRACKS = [
  { title: "double take", mood: "dreamy", energy: 4 },
  { title: "Vanilla", mood: "joyful", energy: 5 },
  { title: "Glimpse of Us", mood: "melancholic", energy: 2 },
  { title: "Sanctuary", mood: "melancholic", energy: 3 },
  { title: "Before Us", mood: "romantic", energy: 3 },
  { title: "Tum Jaoge Toh", mood: "melancholic", energy: 3 },
  { title: "Golden Hour", mood: "joyful", energy: 6 },
  { title: "Dandelions", mood: "dreamy", energy: 4 },
  { title: "Death Bed", mood: "dreamy", energy: 2 },
  { title: "Let Her Go", mood: "melancholic", energy: 4 },
  { title: "Photograph", mood: "romantic", energy: 4 },
  { title: "Perfect", mood: "romantic", energy: 5 },
  { title: "Thinking Out Loud", mood: "romantic", energy: 5 },
  { title: "Heather", mood: "melancholic", energy: 3 },
  { title: "Astronomy", mood: "melancholic", energy: 5 },
  { title: "Lofi chill", mood: "dreamy", energy: 2 },
  { title: "Retrograde", mood: "melancholic", energy: 3 },
  { title: "Parachute", mood: "romantic", energy: 5 },
  { title: "Iris", mood: "melancholic", energy: 6 },
  { title: "Chasing Cars", mood: "melancholic", energy: 5 },
  { title: "All of Me", mood: "romantic", energy: 5 },
  { title: "Say You Won't Let Go", mood: "romantic", energy: 5 },
  { title: "Counting Stars", mood: "upbeat", energy: 7 },
  { title: "Demons", mood: "melancholic", energy: 6 },
  { title: "Radioactive", mood: "energetic", energy: 8 },
  { title: "Believer", mood: "energetic", energy: 8 },
  { title: "Shape of You", mood: "upbeat", energy: 7 },
  { title: "Señorita", mood: "romantic", energy: 6 },
  { title: "Treat You Better", mood: "upbeat", energy: 7 },
  { title: "Closer", mood: "upbeat", energy: 7 },
  { title: "Something Just Like This", mood: "upbeat", energy: 7 },
];

const PERSONAS = [
  { name: "Ishita", taste: { calm: 0.8, mellow: 0.6, romantic: 0.5, melancholic: 0.7, energetic: 0.1 } },
  { name: "Vaishnavi", taste: { calm: 0.2, mellow: 0.3, romantic: 0.3, melancholic: 0.4, energetic: 0.9 } },
  { name: "Haripriya", taste: { calm: 0.5, mellow: 0.7, romantic: 0.6, melancholic: 0.6, energetic: 0.4 } },
];

for (const p of PERSONAS) {
  const scored = DISCOVERY_TRACKS.map(t => ({
    title: t.title,
    score: overlapScore(t, p.taste)
  })).sort((a, b) => b.score - a.score);
  console.log(`\n=== ${p.name} ===`);
  console.log(scored.slice(0, 5));
}
