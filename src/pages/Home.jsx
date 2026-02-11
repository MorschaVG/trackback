import { useState } from "react";
import { getRelease, searchReleases } from "../services/discogsService.js";

export default function Home() {
    const [songTitle, setSongTitle] = useState("");
    const [artistName, setArtistName] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [verdict, setVerdict] = useState("");

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

    function trackMatches(trackTitle, queryTitle) {
        const track = normalizeTrackTitle(trackTitle);
        const query = normalizeTrackTitle(queryTitle);
        return track === query || track.includes(query) || query.includes(track);
    }

    function isWriterRole(role) {
        const r = normalize(role);
        return (
            r.includes("written") ||
            r.includes("writer") ||
            r.includes("lyrics") ||
            r.includes("music by") ||
            r.includes("composed") ||
            r.includes("composer")
        );
    }

    function collectWriters(extraartists) {
        const writers = new Set();
        if (!Array.isArray(extraartists)) return writers;
        for (const artist of extraartists) {
            if (!artist?.role || !artist?.name) continue;
            if (isWriterRole(artist.role)) {
                writers.add(normalize(artist.name));
            }
        }
        return writers;
    }

    function extractTrackWriters(release, trackTitle) {
        const writers = new Set();

        const track = Array.isArray(release.tracklist)
            ? release.tracklist.find((t) => trackMatches(t?.title, trackTitle))
            : null;

        const trackWriters = collectWriters(track?.extraartists);
        for (const w of trackWriters) writers.add(w);

        const releaseWriters = collectWriters(release.extraartists);
        for (const w of releaseWriters) writers.add(w);

        return { writers, trackTitle: track?.title ?? null };
    }

    function hasSharedWriter(a, b) {
        for (const w of a) {
            if (b.has(w)) return true;
        }
        return false;
    }

    async function testDiscogs() {
        if (!songTitle.trim() || !artistName.trim() || isRunning) return;
        setIsRunning(true);
        setVerdict("");
        try {
            const token = import.meta.env.VITE_DISCOGS_TOKEN;
            const query = songTitle.trim();
            const chosenArtist = artistName.trim();
            const baseResults = await searchReleases(query, token, { perPage: 20, page: 1 });
            let results = baseResults;
            let mapped = results.map((r) => ({
                id: r.id,
                title: r.title,
                year: r.year,
                masterId: r.master_id ?? null,
            }));
            console.table(mapped);

            let chosenCandidate = results.find((r) =>
                normalize(r.title).includes(normalize(chosenArtist))
            );

            if (!chosenCandidate) {
                const fallbackQuery = `${query} ${chosenArtist}`;
                results = await searchReleases(fallbackQuery, token, {
                    perPage: 20,
                    page: 1,
                });
                mapped = results.map((r) => ({
                    id: r.id,
                    title: r.title,
                    year: r.year,
                    masterId: r.master_id ?? null,
                }));
                console.table(mapped);

                const fallbackCandidate = results.find((r) =>
                    normalize(r.title).includes(normalize(chosenArtist))
                );

                if (!fallbackCandidate) {
                    console.warn("Missing chosen artist candidate in first page");
                    return;
                }

                chosenCandidate = fallbackCandidate;
            }

            const chosenRelease = await getRelease(chosenCandidate.id, token);
            let chosenReleaseToCompare = chosenRelease;
            let chosenInfo = extractTrackWriters(chosenReleaseToCompare, query);
            let chosenWriters = chosenInfo.writers;
            let chosenYear = chosenReleaseToCompare.year ?? null;

            const chosenResults = results
                .filter((r) => normalize(r.title).includes(normalize(chosenArtist)))
                .filter((r) => r.year)
                .sort((a, b) => a.year - b.year);

            if (chosenResults.length > 0) {
                const oldestChosen = chosenResults[0];
                if (oldestChosen.id !== chosenReleaseToCompare.id) {
                    const oldestRelease = await getRelease(oldestChosen.id, token);
                    chosenReleaseToCompare = oldestRelease;
                    chosenInfo = extractTrackWriters(chosenReleaseToCompare, query);
                    chosenWriters = chosenInfo.writers;
                    chosenYear = chosenReleaseToCompare.year ?? null;
                }
            }

            console.log("Chosen release", {
                id: chosenReleaseToCompare.id,
                title: chosenReleaseToCompare.title,
                year: chosenYear,
                matchedTrack: chosenInfo.trackTitle,
                writers: Array.from(chosenWriters),
            });

            async function findEarliestMatch(currentResults) {
                const comparisonCandidates = currentResults
                    .filter((r) => !normalize(r.title).includes(normalize(chosenArtist)))
                    .slice(0, 10);

                const comparisonReleases = await Promise.all(
                    comparisonCandidates.map((r) => getRelease(r.id, token))
                );

                let earliestMatch = null;
                let releasesWithWriters = 0;
                for (const release of comparisonReleases) {
                    const info = extractTrackWriters(release, query);
                    if (info.writers.size > 0) releasesWithWriters += 1;
                    if (!hasSharedWriter(chosenWriters, info.writers)) continue;
                    const year = release.year ?? null;
                    if (year && (!earliestMatch || year < earliestMatch.year)) {
                        earliestMatch = {
                            id: release.id,
                            title: release.title,
                            year,
                            matchedTrack: info.trackTitle,
                        };
                    }
                }
                return { earliestMatch, releasesWithWriters };
            }

            const chosenHasWriters = chosenWriters.size > 0;
            console.log("Chosen release writers count", chosenWriters.size);

            let { earliestMatch, releasesWithWriters } = await findEarliestMatch(results);
            console.log("Comparison releases with writers", releasesWithWriters);

            if (!earliestMatch) {
                const page2Results = await searchReleases(query, token, { perPage: 20, page: 2 });
                if (page2Results.length > 0) {
                    results = results.concat(page2Results);
                    mapped = results.map((r) => ({
                        id: r.id,
                        title: r.title,
                        year: r.year,
                        masterId: r.master_id ?? null,
                    }));
                    console.table(mapped);
                    ({ earliestMatch, releasesWithWriters } = await findEarliestMatch(results));
                    console.log("Comparison releases with writers (page 2)", releasesWithWriters);
                }
            }

            if (earliestMatch) {
                console.log("Earliest matching release", earliestMatch);
            } else {
                console.log("No earlier matching release found in sampled candidates");
            }

            let verdict = "unknown";
            if (earliestMatch?.year && chosenYear) {
                verdict = earliestMatch.year < chosenYear ? "not original" : "unknown";
            } else if (earliestMatch?.year && !chosenYear) {
                verdict = "not original";
            }

            console.log(`Verdict for ${chosenArtist} version:`, verdict);
            setVerdict(verdict);
        } catch (error) {
            console.error("Discogs error: ", error);
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
            <button type="button" onClick={testDiscogs} disabled={isRunning}>
                {isRunning ? "Searching..." : "Search"}
            </button>
            {verdict ? <h2>Verdict: {verdict}</h2> : null}
        </div>
    );
}
