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

        async function testDiscogs() {
            try {
                const token = import.meta.env.VITE_DISCOGS_TOKEN;
                const query = "Hallelujah";
                const results = await searchReleases(query, token, { perPage: 20, page: 1 });
                const mapped = results.map((r) => ({
                    id: r.id,
                    title: r.title,
                    year: r.year,
                    masterId: r.master_id ?? null,
                }));
                console.table(mapped);

                const lcCandidate = results.find((r) =>
                    normalize(r.title).includes("leonard cohen")
                );
                const jbCandidate = results.find((r) =>
                    normalize(r.title).includes("jeff buckley")
                );

                if (!lcCandidate || !jbCandidate) {
                    console.warn("Missing Leonard Cohen or Jeff Buckley candidate in first page");
                    return;
                }

                const [lcRelease, jbRelease] = await Promise.all([
                    getRelease(lcCandidate.id, token),
                    getRelease(jbCandidate.id, token),
                ]);

                const lcInfo = extractTrackWriters(lcRelease, query);
                const jbInfo = extractTrackWriters(jbRelease, query);

                const lcWriters = Array.from(lcInfo.writers);
                const jbWriters = Array.from(jbInfo.writers);

                console.log("Leonard Cohen release", {
                    id: lcRelease.id,
                    title: lcRelease.title,
                    year: lcRelease.year ?? null,
                    matchedTrack: lcInfo.trackTitle,
                    writers: lcWriters,
                });
                console.log("Jeff Buckley release", {
                    id: jbRelease.id,
                    title: jbRelease.title,
                    year: jbRelease.year ?? null,
                    matchedTrack: jbInfo.trackTitle,
                    writers: jbWriters,
                });

                const jbHasCohenWriter = jbWriters.some((w) => w.includes("leonard cohen"));
                const lcYear = lcRelease.year ?? null;
                const jbYear = jbRelease.year ?? null;

                let verdict = "unknown";
                if (jbHasCohenWriter && lcYear && jbYear) {
                    verdict = lcYear <= jbYear ? "not original" : "unknown";
                } else if (jbHasCohenWriter && lcYear && !jbYear) {
                    verdict = "not original";
                }

                console.log("Verdict for Jeff Buckley version:", verdict);
            } catch (error) {
                console.error("Discogs error: ", error);
            }
        }
        testDiscogs();
    }, []);


    return <h1>Home</h1>;
}
