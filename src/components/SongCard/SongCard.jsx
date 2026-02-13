import "./SongCard.css";

function formatYear(year) {
    const text = String(year || "").trim();
    const match = text.match(/\d{4}/);
    return match ? match[0] : "Year unknown";
}

export default function SongCard({
    artist,
    title,
    year,
    verdict,
    timestamp,
    actions,
    onSelect,
    selectLabel,
}) {
    const artistText = artist?.trim() ? artist : "Unknown artist";
    const titleText = title?.trim() ? title : "Unknown title";
    const yearText = formatYear(year);
    const verdictText = typeof verdict === "string" ? verdict.trim() : "";
    const timestampText = typeof timestamp === "string" ? timestamp.trim() : "";
    const resolvedSelectLabel =
        selectLabel || `Search for ${titleText} by ${artistText} again`;

    const content = (
        <>
            <p className="song-card__artist">{artistText}</p>
            <p className="song-card__title">{titleText}</p>
            <p className="song-card__year">{yearText}</p>
        </>
    );

    return (
        <div className="song-card">
            {onSelect ? (
                <button
                    type="button"
                    className="song-card__select"
                    onClick={onSelect}
                    aria-label={resolvedSelectLabel}
                >
                    {content}
                </button>
            ) : (
                content
            )}
            {verdictText ? <p className="song-card__meta">Verdict: {verdictText}</p> : null}
            {timestampText ? <p className="song-card__meta">Saved: {timestampText}</p> : null}
            {actions ? <div className="song-card__actions">{actions}</div> : null}
        </div>
    );
}
