import SongCard from "../SongCard/SongCard";

function formatArtists(artists) {
    if (Array.isArray(artists)) return artists.join(" & ");
    return artists || "";
}

// Displays the verdict and original attribution when applicable.
export default function VerdictSection({
    verdict,
    originalInfo,
    searchedSong,
    canSaveFavorite,
    onSaveFavorite,
    isSavingFavorite,
    favoriteSaveMessage,
}) {
    if (!verdict || !searchedSong) return null;

    const originalArtistText = formatArtists(originalInfo?.artists) || "Unknown";
    const originalTitleText = originalInfo?.title || "Unknown";
    const originalYear = originalInfo?.date || "";
    const shouldShowOriginal = verdict === "not original" && originalInfo;
    const searchedYear =
        verdict === "original" && originalInfo?.date ? originalInfo.date : searchedSong.year;

    return (
        <div>
            <h2>Verdict: {verdict}</h2>
            <p>Your search</p>
            <SongCard
                artist={searchedSong.artist}
                title={searchedSong.title}
                year={searchedYear}
            />
            {shouldShowOriginal ? (
                <>
                    <p>Original version</p>
                    <SongCard
                        artist={originalArtistText}
                        title={originalTitleText}
                        year={originalYear}
                    />
                </>
            ) : null}
            {canSaveFavorite ? (
                <div style={{ marginTop: 12 }}>
                    <button
                        type="button"
                        onClick={onSaveFavorite}
                        disabled={isSavingFavorite}
                        className="home-button"
                    >
                        {isSavingFavorite ? "Saving..." : "Save to favorites"}
                    </button>
                    {favoriteSaveMessage ? <p>{favoriteSaveMessage}</p> : null}
                </div>
            ) : null}
        </div>
    );
}
