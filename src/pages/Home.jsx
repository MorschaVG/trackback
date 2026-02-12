import { useState } from "react";
import SearchForm from "../components/Home/SearchForm";
import VerdictSection from "../components/Home/VerdictSection";
import VersionsPrompt from "../components/Home/VersionsPrompt";
import VersionsList from "../components/Home/VersionsList";
import "./Home.css";
import {
    normalize,
    findBestWorkByTitle,
    findOriginalByWork,
    findOriginalRecording,
    fetchOtherArtistsByWork,
} from "../helpers/musicbrainz";

export default function Home() {
    // Form input and request state.
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

    async function checkOriginal() {
        // Guard against empty input or concurrent searches.
        if (!songTitle.trim() || !artistName.trim() || isRunning) return;
        setIsRunning(true);
        // Reset UI for a fresh lookup.
        setVerdict("");
        setOriginalInfo(null);
        setOtherArtists([]);
        setShowVersions(false);
        setShowVersionsPrompt(false);
        try {
            const trimmedTitle = songTitle.trim();
            const bestWork = await findBestWorkByTitle(trimmedTitle);
            // Prefer work credits, fall back to earliest recording.
            const original =
                (bestWork ? await findOriginalByWork(bestWork) : null) ||
                (await findOriginalRecording(trimmedTitle));
            if (!original) {
                setVerdict("unknown");
                return;
            }

            setOriginalInfo(original);
            const chosenNormalized = normalize(artistName);
            const originalArtists = original.artists || [];
            // Compare normalized artist names for the verdict.
            const matchesOriginal = originalArtists.some(
                (artist) => normalize(artist) === chosenNormalized
            );
            const nextVerdict = matchesOriginal ? "original" : "not original";

            setVerdict(nextVerdict);

            if (bestWork?.id) {
                // When a work exists, load other versions.
                setIsLoadingVersions(true);
                const excluded = new Set([normalize(artistName)]);
                if (nextVerdict === "not original") {
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
        // Refresh list when toggling live/remix exclusion.
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
            <SearchForm
                songTitle={songTitle}
                artistName={artistName}
                onSongTitleChange={(event) => setSongTitle(event.target.value)}
                onArtistNameChange={(event) => setArtistName(event.target.value)}
                onSearch={checkOriginal}
                isRunning={isRunning}
            />
            <VerdictSection verdict={verdict} originalInfo={originalInfo} />
            <VersionsPrompt
                show={showVersionsPrompt}
                showVersions={showVersions}
                onToggle={() => setShowVersions((value) => !value)}
            />
            {isLoadingVersions ? <p>Checking for other versions...</p> : null}
            <VersionsList
                show={showVersions}
                otherArtists={otherArtists}
                excludeLiveOrRemix={excludeLiveOrRemix}
                onToggleExclude={() => {
                    setExcludeLiveOrRemix((value) => {
                        const nextValue = !value;
                        refreshOtherArtists(nextValue);
                        return nextValue;
                    });
                }}
                isRunning={isRunning}
                isLoadingVersions={isLoadingVersions}
            />
        </div>
    );
}
