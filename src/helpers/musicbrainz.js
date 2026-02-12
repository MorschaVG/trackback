/*
MusicBrainz helper utilities for search and normalization.
Terms:
        -WORK: A 'work' in MusicBrainz context means an original composition or intellectual artistic creation
        -RELEASE: A release in MusicBrainz context means a unique product containing at least one audio medium
         (disc, cassette, vinyl)
        -RECORDING: A recording represents a distinct audio performance that can be linked to one or more tracks
          on releases; each track is associated with exactly one recording, and the recording reflects the specific
          mixed audio before final mastering.
*/

const MB_HEADERS = {
    // Required by MusicBrainz for responsible API usage.
    "User-Agent": "Trackback/0.1 (contact@example.com)",
};

export function normalize(text) {
    // Normalize input for consistent comparisons.
    return (text || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[\u2019']/g, "'")
        .trim();
}

export function normalizeTrackTitle(title) {
    // Strip common extras to improve matching across releases.
    return normalize(title)
        .replace(/\s+\(.*\)$/g, "")
        .replace(/\s*(feat\.|featuring|ft\.|with)\s+.+$/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function getArtistCreditName(artistCredit) {
    // Stitch together credit fragments with join phrases ('featuring', '&') intact.
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
    // Prefer composer/lyricist credits for the work author.
    const rels = Array.isArray(work?.relations) ? work.relations : [];
    const writers = rels
        .filter((rel) => rel.type === "composer" || rel.type === "lyricist")
        .map((rel) => rel.artist?.name)
        .filter(Boolean);
    return Array.from(new Set(writers));
}

function isLiveOrRemix(recording) {
    // Exclude live/remix versions.
    const title = recording?.title || "";
    const disambiguation = recording?.disambiguation || "";
    const text = `${title} ${disambiguation}`.toLowerCase();
    return text.includes("live") || text.includes("remix");
}

async function fetchJson(url) {
    // Fetch wrapper with MB headers.
    const response = await fetch(url, { headers: MB_HEADERS });
    if (!response.ok) return null;
    return response.json();
}

async function fetchWorkById(id) {
    // Fetch work data with artist relationships.
    const url = `https://musicbrainz.org/ws/2/work/${id}?inc=artist-rels&fmt=json`;
    return fetchJson(url);
}

export async function findBestWorkByTitle(title) {
    // Search for the most relevant work by normalized title.
    const queryTitle = normalizeTrackTitle(title);
    const mbQuery = `work:"${queryTitle}"`;
    const url = `https://musicbrainz.org/ws/2/work/?query=${encodeURIComponent(
        mbQuery
    )}&fmt=json&limit=5`;

    const data = await fetchJson(url);
    if (!data) return null;

    const works = Array.isArray(data.works) ? data.works : [];

    const bestWork = works
        .filter((work) => normalizeTrackTitle(work.title) === queryTitle)
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    return bestWork?.id ? bestWork : null;
}

export async function findOriginalByWork(bestWork) {
    // Resolve original artist credits from a matched work.
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

export async function findOriginalRecording(title) {
    // Fallback path: earliest recording with a matching title.
    const queryTitle = normalizeTrackTitle(title);
    const mbQuery = `recording:"${queryTitle}"`;
    const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(
        mbQuery
    )}&fmt=json&limit=25`;

    const data = await fetchJson(url);
    if (!data) return null;

    const recordings = Array.isArray(data.recordings) ? data.recordings : [];

    const candidates = recordings
        .filter((recording) => normalizeTrackTitle(recording.title) === queryTitle)
        .map((recording) => ({
            id: recording.id,
            title: recording.title,
            firstReleaseDate: recording["first-release-date"] || "",
            artistCredit: recording["artist-credit"] || [],
        }))
        .filter((recording) => recording.firstReleaseDate);

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

export async function fetchOtherArtistsByWork(
    workId,
    excludedNormalized,
    excludeLiveRemix
) {
    // List other artist credits for recordings tied to the same work.
    const url = `https://musicbrainz.org/ws/2/recording?work=${encodeURIComponent(
        workId
    )}&inc=artist-credits&fmt=json&limit=100`;
    const data = await fetchJson(url);
    if (!data) return [];

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
