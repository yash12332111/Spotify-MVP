// app/api/itunes-preview/route.ts
// ─────────────────────────────────────────────────────────────
// iTunes preview URL resolver.
// Called by the player when a hardcoded URL returns a non-2xx
// status (URLs expire from the iTunes CDN periodically).
//
// GET /api/itunes-preview?title=Kasoor&artist=Prateek+Kuhad
// → { previewUrl: "https://audio-ssl.itunes.apple.com/...", artworkUrl: "..." }
//
// This proxies the iTunes Search API so the client never has to
// worry about CDN expiry — just call this route on playback failure.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const title  = req.nextUrl.searchParams.get("title")?.trim();
  const artist = req.nextUrl.searchParams.get("artist")?.trim();

  if (!title || !artist) {
    return NextResponse.json(
      { error: "title and artist query params are required" },
      { status: 400 }
    );
  }

  const term = encodeURIComponent(`${title} ${artist}`);
  const itunesUrl = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5&country=IN`;

  try {
    const res = await fetch(itunesUrl, {
      signal: AbortSignal.timeout(7000),
      headers: { "User-Agent": "onesong-in/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `iTunes API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      resultCount: number;
      results: Array<{
        trackName: string;
        artistName: string;
        previewUrl?: string;
        artworkUrl100?: string;
      }>;
    };

    // Find the best match — prefer exact title+artist match
    const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normTitle  = normalise(title);
    const normArtist = normalise(artist);

    const withPreview = data.results.filter((r) => !!r.previewUrl);

    const exact = withPreview.find(
      (r) =>
        normalise(r.trackName).includes(normTitle) &&
        normalise(r.artistName).includes(normArtist)
    );

    const best = exact ?? withPreview[0];

    if (!best?.previewUrl) {
      return NextResponse.json(
        { error: "No playable preview found on iTunes for this track" },
        { status: 404 }
      );
    }

    // Upscale artwork: 100x100bb → 600x600bb
    const artworkUrl = best.artworkUrl100?.replace("100x100bb", "600x600bb") ?? "";

    return NextResponse.json({
      previewUrl: best.previewUrl,
      artworkUrl,
      trackName: best.trackName,
      artistName: best.artistName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
