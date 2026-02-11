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
                const query = "I Will Always Love You";
                const chosenArtist = "Whitney Houston";
                const results = await searchReleases(query, token, { perPage: 20, page: 1 });
                const mapped = results.map((r) => ({
                    id: r.id,
                    title: r.title,
                    year: r.year,
                    masterId: r.master_id ?? null,
                }));
                console.table(mapped);

                const chosenCandidate = results.find((r) =>
                    normalize(r.title).includes(normalize(chosenArtist))
                );

                if (!chosenCandidate) {
                    console.warn("Missing chosen artist candidate in first page");
                    return;
                }

                const chosenRelease = await getRelease(chosenCandidate.id, token);
                const chosenInfo = extractTrackWriters(chosenRelease, query);
                const chosenWriters = chosenInfo.writers;

                console.log("Chosen release", {
                    id: chosenRelease.id,
                    title: chosenRelease.title,
                    year: chosenRelease.year ?? null,
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
                const chosenYear = chosenRelease.year ?? null;
                if (earliestMatch?.year && chosenYear) {
                    verdict = earliestMatch.year < chosenYear ? "not original" : "unknown";
                } else if (earliestMatch?.year && !chosenYear) {
                    verdict = "not original";
                }

                console.log("Verdict for Whitney Houston version:", verdict);
            } catch (error) {
                console.error("Discogs error: ", error);
            }
        }
        testDiscogs();
    }, []);


    return <h1>Home</h1>;
}
