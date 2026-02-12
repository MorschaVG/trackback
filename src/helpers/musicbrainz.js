const MB_HEADERS = {
    "User-Agent": "Trackback/0.1 (contact@example.com)",
};

export function normalize(text) {
    return (text || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[\u2019']/g, "'")
        .trim();
}

export function normalizeTrackTitle(title) {
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

async function fetchJson(url) {
    const response = await fetch(url, { headers: MB_HEADERS });
    if (!response.ok) return null;
    return response.json();
}

async function fetchWorkById(id) {
    const url = `https://musicbrainz.org/ws/2/work/${id}?inc=artist-rels&fmt=json`;
    return fetchJson(url);
}

export async function findBestWorkByTitle(title) {
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
