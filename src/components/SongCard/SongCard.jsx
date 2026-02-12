import "./SongCard.css";

function formatYear(year) {
    const text = String(year || "").trim();
    const match = text.match(/\d{4}/);
    return match ? match[0] : "Year unknown";
}

export default function SongCard({ artist, title, year }) {
    const artistText = artist?.trim() ? artist : "Unknown artist";
    const titleText = title?.trim() ? title : "Unknown title";
    const yearText = formatYear(year);

    return (
        <div className="song-card">
            <p className="song-card__artist">{artistText}</p>
            <p className="song-card__title">{titleText}</p>
            <p className="song-card__year">{yearText}</p>
        </div>
    );
}
