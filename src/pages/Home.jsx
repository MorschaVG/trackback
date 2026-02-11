import { useState } from "react";

export default function Home() {
    const [songTitle, setSongTitle] = useState("");
    const [artistName, setArtistName] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [verdict, setVerdict] = useState("");
    const [originalInfo, setOriginalInfo] = useState(null);

    function normalize(text) {
        return (text || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/[\u2019']/g, "'")
            .trim();
    }

    function normalizeTrackTitle(title) {
        return normalize(title)
            .replace(/\s+\(.*\)$/g, "")
            .replace(/\s*(feat\.|featuring|ft\.|with)\s+.+$/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getArtistCreditName(artistCredit) {
        if (!Array.isArray(artistCredit)) return "";
        return artistCredit
            .map((credit) => credit.name || credit.artist?.name || "")
            .join("")
            .trim();
    }

    function extractWorkArtists(work) {
        const rels = Array.isArray(work?.relations) ? work.relations : [];
        const writers = rels
            .filter((rel) => rel.type === "composer" || rel.type === "lyricist")
            .map((rel) => rel.artist?.name)
            .filter(Boolean);
        return Array.from(new Set(writers));
    }

    async function fetchWorkById(id) {
        const url = `https://musicbrainz.org/ws/2/work/${id}?inc=artist-rels&fmt=json`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Trackback/0.1 (contact@example.com)",
            },
        });
        if (!response.ok) return null;
        return response.json();
    }

    async function findOriginalByWork(title) {
        const queryTitle = normalizeTrackTitle(title);
        const mbQuery = `work:"${queryTitle}"`;
        const url = `https://musicbrainz.org/ws/2/work/?query=${encodeURIComponent(
            mbQuery
        )}&fmt=json&limit=5`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Trackback/0.1 (contact@example.com)",
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const works = Array.isArray(data.works) ? data.works : [];

        const bestWork = works
            .filter((w) => normalizeTrackTitle(w.title) === queryTitle)
            .sort((a, b) => (b.score || 0) - (a.score || 0))[0];

        if (!bestWork?.id) return null;

        const fullWork = await fetchWorkById(bestWork.id);
        const workArtists = extractWorkArtists(fullWork);
        if (workArtists.length === 0) return null;

        return {
            artists: workArtists,
            title: bestWork.title,
            source: "work",
        };
    }

    async function findOriginalRecording(title) {
        const queryTitle = normalizeTrackTitle(title);
        const mbQuery = `recording:"${queryTitle}"`;
        const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(
            mbQuery
        )}&fmt=json&limit=25`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Trackback/0.1 (contact@example.com)",
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const recordings = Array.isArray(data.recordings) ? data.recordings : [];

        const candidates = recordings
            .filter((r) => normalizeTrackTitle(r.title) === queryTitle)
            .map((r) => ({
                id: r.id,
                title: r.title,
                firstReleaseDate: r["first-release-date"] || "",
                artistCredit: r["artist-credit"] || [],
            }))
            .filter((r) => r.firstReleaseDate);

        if (candidates.length === 0) return null;

        candidates.sort((a, b) => a.firstReleaseDate.localeCompare(b.firstReleaseDate));
        const earliest = candidates[0];
        const earliestArtist = getArtistCreditName(earliest.artistCredit) || "Unknown";

        return {
            artists: earliestArtist ? [earliestArtist] : [],
            date: earliest.firstReleaseDate,
            title: earliest.title,
            source: "recording",
        };
    }

    async function checkOriginal() {
        if (!songTitle.trim() || !artistName.trim() || isRunning) return;
        setIsRunning(true);
        setVerdict("");
        setOriginalInfo(null);
        try {
            const original =
                (await findOriginalByWork(songTitle.trim())) ||
                (await findOriginalRecording(songTitle.trim()));
            if (!original) {
                setVerdict("unknown");
                return;
            }

            setOriginalInfo(original);
            const chosenNormalized = normalize(artistName);
            const originalArtists = original.artists || [];
            const matchesOriginal = originalArtists.some(
                (artist) => normalize(artist) === chosenNormalized
            );
            const verdict = matchesOriginal ? "original" : "not original";

            setVerdict(verdict);
        } catch (error) {
            console.error("MusicBrainz error:", error);
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <div>
            <h1>Home</h1>
            <label htmlFor="song-title-input">Song title</label>
            <input
                id="song-title-input"
                type="text"
                value={songTitle}
                onChange={(event) => setSongTitle(event.target.value)}
                placeholder="Enter a song title"
            />
            <label htmlFor="artist-name-input">Artist name</label>
            <input
                id="artist-name-input"
                type="text"
                value={artistName}
                onChange={(event) => setArtistName(event.target.value)}
                placeholder="Enter an artist name"
            />
            <button type="button" onClick={checkOriginal} disabled={isRunning}>
                {isRunning ? "Searching..." : "Search"}
            </button>
            {verdict ? <h2>Verdict: {verdict}</h2> : null}
            {originalInfo ? (
                <p>
                    Original (MusicBrainz {originalInfo.source}):{" "}
                    {originalInfo.artists?.join(" & ") || "Unknown"} - {originalInfo.title}
                    {originalInfo.date ? ` - ${originalInfo.date}` : ""}
                </p>
            ) : null}
        </div>
    );
}
