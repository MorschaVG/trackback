import "./SongCard.css";

function formatYear(year) {
    const text = String(year || "").trim();
    const match = text.match(/\d{4}/);
    return match ? match[0] : "Jaar onbekend.";
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
    className = "",
}) {
    const artistText = artist?.trim() ? artist : "Unknown artist";
    const titleText = title?.trim() ? title : "Unknown title";
    const yearText = formatYear(year);
    const verdictText =
        typeof verdict === "string"
            ? verdict.trim().replace(/_/g, " ").toLowerCase()
            : "";
    const timestampText = typeof timestamp === "string" ? timestamp.trim() : "";
    const resolvedSelectLabel =
        selectLabel || `Search for ${titleText} by ${artistText} again`;

    const content = (
        <div className="song-card__body">
            <p className="song-card__artist">{artistText}</p>
            <p className="song-card__title">{titleText}</p>
            <p className="song-card__year">{yearText}</p>
        </div>
    );

    return (
        <div className={["song-card", className].filter(Boolean).join(" ")}>
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
            <div className="song-card__footer">
                {verdictText ? (
                    <p className="song-card__meta">
                        {verdictText === "original" ? (
                            "Dit was het origineel"
                        ) : verdictText === "not original" ? (
                            <>
                                Dit was{" "}
                                <span className="song-card__meta-emphasis">niet</span>{" "}
                                het origineel
                            </>
                        ) : (
                            `Verdict: ${verdictText}`
                        )}
                    </p>
                ) : null}
                {timestampText ? <p className="song-card__meta">{timestampText}</p> : null}
                {actions ? <div className="song-card__actions">{actions}</div> : null}
            </div>
        </div>
    );
}
