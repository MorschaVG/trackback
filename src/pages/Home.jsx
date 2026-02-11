import { useEffect } from "react";
import { getRelease, searchReleases } from "../services/discogsService.js";

export default function Home() {
    useEffect(() => {
        function normalize(text) {
            return (text || "")
                .toLowerCase()
                .replace(/\s+/g, " ")
                .replace(/[\u2019']/g, "'")
                .trim();
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
            const normalizedTrack = normalize(trackTitle);
            const writers = new Set();

            const track = Array.isArray(release.tracklist)
                ? release.tracklist.find((t) => normalize(t?.title).includes(normalizedTrack))
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
            try {
                const token = import.meta.env.VITE_DISCOGS_TOKEN;
                const query = "Hurt";
                const chosenArtist = "Johnny Cash";
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

                const comparisonCandidates = results
                    .filter((r) => !normalize(r.title).includes(normalize(chosenArtist)))
                    .slice(0, 5);

                const comparisonReleases = await Promise.all(
                    comparisonCandidates.map((r) => getRelease(r.id, token))
                );

                let earliestMatch = null;
                for (const release of comparisonReleases) {
                    const info = extractTrackWriters(release, query);
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
            } catch (error) {
                console.error("Discogs error: ", error);
            }
        }
        testDiscogs();
    }, []);


    return <h1>Home</h1>;
}
