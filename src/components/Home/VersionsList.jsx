export default function VersionsList({
    show,
    otherArtists,
    excludeLiveOrRemix,
    onToggleExclude,
    isRunning,
    isLoadingVersions,
}) {
    if (!show || otherArtists.length === 0) return null;

    return (
        <div>
            <h3>Other versions</h3>
            <button
                type="button"
                onClick={onToggleExclude}
                disabled={isRunning || isLoadingVersions}
                className="home-button"
            >
                {excludeLiveOrRemix ? "Include live/remix" : "Exclude live/remix"}
            </button>
            <ul>
                {otherArtists.map((artist) => (
                    <li key={artist}>{artist}</li>
                ))}
            </ul>
        </div>
    );
}
