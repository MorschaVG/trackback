import SongCard from "../SongCard/SongCard";
import { Pillbox } from "../Pillbox/Pillbox.jsx";
import "./VerdictSection.css";

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
        <div className="verdict-section">
            <div className="verdict-card">
                {verdict === "original" ? (
                    <p className="verdict-card__text">Dit was het origineel</p>
                ) : (
                    <p className="verdict-card__text">
                        Dit was <span className="verdict-card__emphasis verdict-card__emphasis--underline">niet</span> het origineel
                    </p>
                )}
            </div>
            <div className="verdict-cards">
                <div className="verdict-cards__item">
                    <p className="verdict-cards__label">Jij zocht:</p>
                    <SongCard
                        artist={searchedSong.artist}
                        title={searchedSong.title}
                        year={searchedYear}
                    />
                </div>
                {shouldShowOriginal ? (
                    <div className="verdict-cards__item verdict-cards__item--original">
                        <p className="verdict-cards__label verdict-cards__label--original">Het origineel:</p>
                        <SongCard
                            artist={originalArtistText}
                            title={originalTitleText}
                            year={originalYear}
                            className="song-card--original"
                        />
                    </div>
                ) : null}
            </div>
            {canSaveFavorite ? (
                <div style={{ marginTop: 12 }}>
                    <p className="verdict-save-text">
                        Sla deze zoektocht op zodat je er later naar terug kan komen, je kan dan de versies hieronder ook weer zien!
                    </p>
                    <Pillbox
                        as="button"
                        type="button"
                        onClick={onSaveFavorite}
                        disabled={isSavingFavorite}
                        size="small"
                        width={167}
                        className="verdict-save-button"
                    >
                        {isSavingFavorite ? "Aan het opslaan..." : "Opslaan"}
                    </Pillbox>
                    {favoriteSaveMessage ? <p>{favoriteSaveMessage}</p> : null}
                </div>
            ) : null}
        </div>
    );
}
