import { useState } from "react";

export default function Home() {
    const [songTitle, setSongTitle] = useState("");
    const [artistName, setArtistName] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [verdict, setVerdict] = useState("");
    const [originalInfo, setOriginalInfo] = useState(null);
    const [otherArtists, setOtherArtists] = useState([]);
    const [showVersionsPrompt, setShowVersionsPrompt] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [excludeLiveOrRemix, setExcludeLiveOrRemix] = useState(false);

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
            .map((credit) => {
                const name = credit.name || credit.artist?.name || "";
                const join = credit.joinphrase || "";
                return `${name}${join}`;
            })
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

    function isLiveOrRemix(recording) {
        const title = recording?.title || "";
        const disambiguation = recording?.disambiguation || "";
        const text = `${title} ${disambiguation}`.toLowerCase();
        return text.includes("live") || text.includes("remix");
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

    async function findBestWorkByTitle(title) {
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

        return bestWork?.id ? bestWork : null;
    }

    async function findOriginalByWork(title) {
        const bestWork = await findBestWorkByTitle(title);
        if (!bestWork?.id) return null;

        const fullWork = await fetchWorkById(bestWork.id);
        const workArtists = extractWorkArtists(fullWork);
        if (workArtists.length === 0) return null;

        return {
            artists: workArtists,
            title: bestWork.title,
            source: "work",
            workId: bestWork.id,
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

    async function fetchOtherArtistsByWork(workId, excludedNormalized, excludeLiveRemix) {
        const url = `https://musicbrainz.org/ws/2/recording?work=${encodeURIComponent(
            workId
        )}&inc=artist-credits&fmt=json&limit=100`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Trackback/0.1 (contact@example.com)",
            },
        });
        if (!response.ok) return [];
        const data = await response.json();
        const recordings = Array.isArray(data.recordings) ? data.recordings : [];
        const artists = new Set();

        recordings.forEach((recording) => {
            if (excludeLiveRemix && isLiveOrRemix(recording)) return;
            const credits = Array.isArray(recording["artist-credit"])
                ? recording["artist-credit"]
                : [];
            credits.forEach((credit) => {
                const name = credit.name || credit.artist?.name || "";
                const normalized = normalize(name);
                if (!name || excludedNormalized.has(normalized)) return;
                artists.add(name);
            });
        });

        return Array.from(artists).sort((a, b) => a.localeCompare(b));
    }

    async function checkOriginal() {
        if (!songTitle.trim() || !artistName.trim() || isRunning) return;
        setIsRunning(true);
        setVerdict("");
        setOriginalInfo(null);
        setOtherArtists([]);
        setShowVersions(false);
        setShowVersionsPrompt(false);
        try {
            const bestWork = await findBestWorkByTitle(songTitle.trim());
            const original =
                (bestWork ? await findOriginalByWork(songTitle.trim()) : null) ||
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

            if (bestWork?.id) {
                setIsLoadingVersions(true);
                const excluded = new Set([normalize(artistName)]);
                if (verdict === "not original") {
                    originalArtists.forEach((artist) => excluded.add(normalize(artist)));
                }
                const artists = await fetchOtherArtistsByWork(
                    bestWork.id,
                    excluded,
                    excludeLiveOrRemix
                );
                setOtherArtists(artists);
                setShowVersionsPrompt(artists.length > 0);
            }
        } catch (error) {
            console.error("MusicBrainz error:", error);
        } finally {
            setIsLoadingVersions(false);
            setIsRunning(false);
        }
    }

    async function refreshOtherArtists(nextExcludeLiveOrRemix = excludeLiveOrRemix) {
        const bestWork = await findBestWorkByTitle(songTitle.trim());
        if (!bestWork?.id) return;
        setIsLoadingVersions(true);
        const excluded = new Set([normalize(artistName)]);
        if (verdict === "not original") {
            (originalInfo?.artists || []).forEach((artist) =>
                excluded.add(normalize(artist))
            );
        }
        const artists = await fetchOtherArtistsByWork(
            bestWork.id,
            excluded,
            nextExcludeLiveOrRemix
        );
        setOtherArtists(artists);
        setShowVersionsPrompt(artists.length > 0);
        setIsLoadingVersions(false);
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
            {originalInfo && verdict !== "original" ? (
                <p>
                    Original:{" "}
                    {originalInfo.artists?.join(" & ") || "Unknown"} - {originalInfo.title}
                    {originalInfo.date ? ` - ${originalInfo.date}` : ""}
                </p>
            ) : null}
            {showVersionsPrompt ? (
                <div>
                    <p>Other artists have versions of this work. Show them?</p>
                    <button type="button" onClick={() => setShowVersions((value) => !value)}>
                        {showVersions ? "Hide versions" : "Show versions"}
                    </button>
                </div>
            ) : null}
            {isLoadingVersions ? <p>Checking for other versions...</p> : null}
            {showVersions && otherArtists.length > 0 ? (
                <div>
                    <h3>Other versions</h3>
                    <button
                        type="button"
                        onClick={() => {
                            setExcludeLiveOrRemix((value) => {
                                const nextValue = !value;
                                refreshOtherArtists(nextValue);
                                return nextValue;
                            });
                        }}
                        disabled={isRunning || isLoadingVersions}
                    >
                        {excludeLiveOrRemix ? "Include live/remix" : "Exclude live/remix"}
                    </button>
                    <ul>
                        {otherArtists.map((artist) => (
                            <li key={artist}>{artist}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
