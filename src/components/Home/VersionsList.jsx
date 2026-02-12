import SongCard from "../SongCard/SongCard";

// List of other artists plus toggle for live/remix inclusion.
export default function VersionsList({
    show,
    otherVersions,
    excludeLiveOrRemix,
    onToggleExclude,
    isRunning,
    isLoadingVersions,
}) {
    if (!show || otherVersions.length === 0) return null;

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
            <ul className="versions-list">
                {otherVersions.map((version) => (
                    <li key={version.id || `${version.artist}-${version.title}`}>
                        <SongCard
                            artist={version.artist}
                            title={version.title}
                            year={version.date}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
