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

async function fetchRecordingsByWork(workId) {
    // Fetch recordings tied to a work, including artist credits for display.
    const url = `https://musicbrainz.org/ws/2/recording?work=${encodeURIComponent(
        workId
    )}&inc=artist-credits&fmt=json&limit=100`;
    const data = await fetchJson(url);
    if (!data) return [];
    return Array.isArray(data.recordings) ? data.recordings : [];
}

function pickEarliestDate(dates) {
    const candidates = dates.filter(Boolean);
    if (candidates.length === 0) return "";
    candidates.sort((a, b) => a.localeCompare(b));
    return candidates[0];
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

    const recordings = await fetchRecordingsByWork(bestWork.id);
    const earliestDate = pickEarliestDate(
        recordings.map((recording) => recording["first-release-date"] || "")
    );

    return {
        artists: workArtists,
        title: bestWork.title,
        date: earliestDate,
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

export async function findRecordingByArtistAndTitle(title, artist) {
    // Attempt to find a recording that matches both artist and title.
    const queryTitle = normalizeTrackTitle(title);
    const queryArtist = normalize(artist).replace(/"/g, "");
    if (!queryTitle || !queryArtist) return null;

    const mbQuery = `recording:"${queryTitle}" AND artist:"${queryArtist}"`;
    const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(
        mbQuery
    )}&fmt=json&limit=25`;

    const data = await fetchJson(url);
    if (!data) return null;

    const recordings = Array.isArray(data.recordings) ? data.recordings : [];
    const normalizedArtist = normalize(artist);

    const candidates = recordings
        .filter((recording) => normalizeTrackTitle(recording.title) === queryTitle)
        .map((recording) => {
            const credits = Array.isArray(recording["artist-credit"])
                ? recording["artist-credit"]
                : [];
            const creditNames = credits
                .map((credit) => credit.name || credit.artist?.name || "")
                .filter(Boolean);
            const matchesArtist = creditNames.some(
                (name) => normalize(name) === normalizedArtist
            );
            if (!matchesArtist) return null;
            return {
                id: recording.id,
                title: recording.title,
                date: recording["first-release-date"] || "",
                artists: creditNames.length > 0 ? creditNames : [artist],
                artistCredit: credits,
            };
        })
        .filter(Boolean);

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.date.localeCompare(b.date));
    const earliest = candidates[0];
    const creditName = getArtistCreditName(earliest.artistCredit);

    return {
        artists: creditName ? [creditName] : earliest.artists,
        date: earliest.date,
        title: earliest.title,
        source: "recording-artist",
    };
}

export async function fetchOtherArtistsByWork(
    workId,
    excludedNormalized,
    excludeLiveRemix
) {
    // List other artist credits for recordings tied to the same work.
    const recordings = await fetchRecordingsByWork(workId);
    const versionsByArtist = new Map();

    recordings.forEach((recording) => {
        if (excludeLiveRemix && isLiveOrRemix(recording)) return;
        const credits = Array.isArray(recording["artist-credit"])
            ? recording["artist-credit"]
            : [];
        const creditNames = credits
            .map((credit) => credit.name || credit.artist?.name || "")
            .filter(Boolean);
        const shouldExclude = creditNames.some((name) =>
            excludedNormalized.has(normalize(name))
        );
        if (shouldExclude) return;

        const artistName = getArtistCreditName(credits) || creditNames[0] || "";
        const normalized = normalize(artistName);
        if (!artistName || excludedNormalized.has(normalized)) return;

        const candidate = {
            id: recording.id,
            artist: artistName,
            title: recording.title || "",
            date: recording["first-release-date"] || "",
        };

        const existing = versionsByArtist.get(normalized);
        if (!existing) {
            versionsByArtist.set(normalized, candidate);
            return;
        }

        if (!existing.date && candidate.date) {
            versionsByArtist.set(normalized, candidate);
            return;
        }

        if (candidate.date && candidate.date.localeCompare(existing.date) < 0) {
            versionsByArtist.set(normalized, candidate);
        }
    });

    return Array.from(versionsByArtist.values()).sort((a, b) =>
        a.artist.localeCompare(b.artist)
    );
}
