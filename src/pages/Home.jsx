import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchForm from "../components/Home/SearchForm";
import VerdictSection from "../components/Home/VerdictSection";
import VersionsPrompt from "../components/Home/VersionsPrompt";
import VersionsList from "../components/Home/VersionsList";
import "./Home.css";
import { useAuth } from "../context/AuthContext.jsx";
import {
    normalize,
    findBestWorkByTitle,
    findOriginalByWork,
    findOriginalRecording,
    findRecordingByArtistAndTitle,
    fetchOtherArtistsByWork,
    findArtistRecordingDateByWork,
} from "../helpers/musicbrainz";
import { createFavorite, createHistoryEntry } from "../services/noviApiService.js";

function toYearNumber(value) {
    if (value === null || value === undefined || value === "") return undefined;
    if (typeof value === "number") return value;
    const text = String(value);
    const match = text.match(/\d{4}/);
    return match ? Number(match[0]) : undefined;
}

export default function Home() {
    const { isAuthenticated, token, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const processedReplayRef = useRef(null);
    // Form input and request state.
    const [songTitle, setSongTitle] = useState("");
    const [artistName, setArtistName] = useState("");
    const [searchedSong, setSearchedSong] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [verdict, setVerdict] = useState("");
    const [originalInfo, setOriginalInfo] = useState(null);
    const [otherVersions, setOtherVersions] = useState([]);
    const [showVersionsPrompt, setShowVersionsPrompt] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [excludeLiveOrRemix, setExcludeLiveOrRemix] = useState(false);
    const [lastSearchSnapshot, setLastSearchSnapshot] = useState(null);
    const [isSavingFavorite, setIsSavingFavorite] = useState(false);
    const [favoriteSaveMessage, setFavoriteSaveMessage] = useState("");

    const storeHistory = useCallback(async (snapshot) => {
        if (!isAuthenticated || !token || !user?.userId) return;
        try {
            await createHistoryEntry(
                {
                    userId: user.userId,
                    title: snapshot.title,
                    artist: snapshot.artist,
                    year: snapshot.year,
                    verdict: snapshot.verdict,
                },
                token
            );
        } catch (error) {
            console.error("Failed to store history:", error);
        }
    }, [isAuthenticated, token, user?.userId]);

    async function saveCurrentAsFavorite() {
        if (!lastSearchSnapshot || !isAuthenticated || !token || !user?.userId) return;
        setIsSavingFavorite(true);
        setFavoriteSaveMessage("");
        try {
            await createFavorite(
                {
                    userId: user.userId,
                    title: lastSearchSnapshot.title,
                    artist: lastSearchSnapshot.artist,
                    year: lastSearchSnapshot.year,
                    verdict: lastSearchSnapshot.verdict,
                },
                token
            );
            setFavoriteSaveMessage("Saved to favorites.");
        } catch {
            setFavoriteSaveMessage("Could not save favorite.");
        } finally {
            setIsSavingFavorite(false);
        }
    }

    const runSearchByArtistAndTitle = useCallback(async (inputSongTitle, inputArtistName) => {
        const trimmedTitle = inputSongTitle.trim();
        const trimmedArtist = inputArtistName.trim();
        // Guard against empty input or concurrent searches.
        if (!trimmedTitle || !trimmedArtist || isRunning) return;
        setIsRunning(true);
        // Reset UI for a fresh lookup.
        setVerdict("");
        setOriginalInfo(null);
        setOtherVersions([]);
        setShowVersions(false);
        setShowVersionsPrompt(false);
        setFavoriteSaveMessage("");
        let searchedYearRaw = "";
        setSearchedSong({
            artist: trimmedArtist,
            title: trimmedTitle,
            year: "",
        });
        try {
            const [bestWork, artistRecording] = await Promise.all([
                findBestWorkByTitle(trimmedTitle),
                findRecordingByArtistAndTitle(trimmedTitle, trimmedArtist),
            ]);
            searchedYearRaw = artistRecording?.date || "";
            if (!searchedYearRaw && bestWork?.id) {
                searchedYearRaw = await findArtistRecordingDateByWork(
                    bestWork.id,
                    trimmedArtist
                );
            }
            if (searchedYearRaw) {
                setSearchedSong({
                    artist: trimmedArtist,
                    title: trimmedTitle,
                    year: searchedYearRaw,
                });
            }
            // Prefer work credits, fall back to earliest recording.
            const original =
                (bestWork ? await findOriginalByWork(bestWork) : null) ||
                (await findOriginalRecording(trimmedTitle));
            if (!original) {
                setVerdict("unknown");
                const unknownSnapshot = {
                    title: trimmedTitle,
                    artist: trimmedArtist,
                    year: toYearNumber(searchedYearRaw),
                    verdict: "unknown",
                };
                setLastSearchSnapshot(unknownSnapshot);
                await storeHistory(unknownSnapshot);
                return;
            }

            setOriginalInfo(original);
            const chosenNormalized = normalize(trimmedArtist);
            const originalArtists = original.artists || [];
            // Compare normalized artist names for the verdict.
            const matchesOriginal = originalArtists.some(
                (artist) => normalize(artist) === chosenNormalized
            );
            const nextVerdict = matchesOriginal ? "original" : "not original";

            setVerdict(nextVerdict);
            const resolvedYear = matchesOriginal
                ? toYearNumber(original.date || searchedYearRaw)
                : toYearNumber(searchedYearRaw);
            const snapshot = {
                title: trimmedTitle,
                artist: trimmedArtist,
                year: resolvedYear,
                verdict: nextVerdict,
            };
            setLastSearchSnapshot(snapshot);
            await storeHistory(snapshot);

            if (bestWork?.id) {
                // When a work exists, load other versions.
                setIsLoadingVersions(true);
                const excluded = new Set([normalize(trimmedArtist)]);
                if (nextVerdict === "not original") {
                    originalArtists.forEach((artist) => excluded.add(normalize(artist)));
                }
                const artists = await fetchOtherArtistsByWork(
                    bestWork.id,
                    excluded,
                    excludeLiveOrRemix
                );
                setOtherVersions(artists);
                setShowVersionsPrompt(artists.length > 0);
            }
        } catch (error) {
            console.error("MusicBrainz error:", error);
        } finally {
            setIsLoadingVersions(false);
            setIsRunning(false);
        }
    }, [excludeLiveOrRemix, isRunning, storeHistory]);

    function checkOriginal() {
        void runSearchByArtistAndTitle(songTitle, artistName);
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
        setOtherVersions(artists);
        setShowVersionsPrompt(artists.length > 0);
        setIsLoadingVersions(false);
    }

    useEffect(() => {
        const replaySearch = location.state?.replaySearch;
        if (!replaySearch) return;

        const replayTitle = String(replaySearch.title || "").trim();
        const replayArtist = String(replaySearch.artist || "").trim();
        const replayId = String(
            replaySearch.requestId || `${replayArtist}::${replayTitle}`
        );

        if (!replayTitle || !replayArtist) return;
        if (processedReplayRef.current === replayId) return;
        processedReplayRef.current = replayId;

        setSongTitle(replayTitle);
        setArtistName(replayArtist);
        void runSearchByArtistAndTitle(replayTitle, replayArtist);

        navigate("/", { replace: true, state: null });
    }, [location.state, navigate, runSearchByArtistAndTitle]);

    return (
        <div>
            <h1>Home</h1>
            {isAuthenticated ? (
                <SearchForm
                    songTitle={songTitle}
                    artistName={artistName}
                    onSongTitleChange={(event) => setSongTitle(event.target.value)}
                    onArtistNameChange={(event) => setArtistName(event.target.value)}
                    onSearch={checkOriginal}
                    isRunning={isRunning}
                />
            ) : (
                <p>Log in om te zoeken naar songs.</p>
            )}
            <VerdictSection
                verdict={verdict}
                originalInfo={originalInfo}
                searchedSong={searchedSong}
                canSaveFavorite={Boolean(isAuthenticated && lastSearchSnapshot)}
                onSaveFavorite={saveCurrentAsFavorite}
                isSavingFavorite={isSavingFavorite}
                favoriteSaveMessage={favoriteSaveMessage}
            />
            <VersionsPrompt
                show={showVersionsPrompt}
                showVersions={showVersions}
                onToggle={() => setShowVersions((value) => !value)}
            />
            {isLoadingVersions ? <p>Checking for other versions...</p> : null}
            <VersionsList
                show={showVersions}
                otherVersions={otherVersions}
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
