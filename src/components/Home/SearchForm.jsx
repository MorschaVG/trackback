// Form for entering song/artist and triggering a search.
export default function SearchForm({
    songTitle,
    artistName,
    onSongTitleChange,
    onArtistNameChange,
    onSearch,
    isRunning,
}) {
    return (
        <div>
            <label htmlFor="song-title-input">Song title</label>
            <input
                id="song-title-input"
                type="text"
                value={songTitle}
                onChange={onSongTitleChange}
                placeholder="Enter a song title"
            />
            <label htmlFor="artist-name-input">Artist name</label>
            <input
                id="artist-name-input"
                type="text"
                value={artistName}
                onChange={onArtistNameChange}
                placeholder="Enter an artist name"
            />
            <button
                type="button"
                onClick={onSearch}
                disabled={isRunning}
                className="home-button"
            >
                {isRunning ? "Searching..." : "Search"}
            </button>
        </div>
    );
}
