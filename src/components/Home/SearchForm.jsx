import { Pillbox, PillboxInput } from "../Pillbox/Pillbox.jsx";
import "./SearchForm.css";

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
        <div className="search-form">
            <PillboxInput
                id="song-title-input"
                type="text"
                value={songTitle}
                onChange={onSongTitleChange}
                placeholder="Voer de titel van een nummer in..."
                size="medium"
                width={367}
                className="search-form__input"
            />
            <PillboxInput
                id="artist-name-input"
                type="text"
                value={artistName}
                onChange={onArtistNameChange}
                placeholder="Van welke artiest denk jij dat het origineel is?"
                size="medium"
                width={367}
                className="search-form__input"
            />
            <Pillbox
                as="button"
                type="button"
                onClick={onSearch}
                disabled={isRunning}
                size="small"
                width={167}
                className="search-form__submit"
            >
                {isRunning ? "Searching..." : "Search"}
            </Pillbox>
        </div>
    );
}
