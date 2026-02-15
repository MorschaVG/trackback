import SongCard from "../SongCard/SongCard";
import { Pillbox } from "../Pillbox/Pillbox.jsx";

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
            <Pillbox
                as="button"
                type="button"
                onClick={onToggleExclude}
                disabled={isRunning || isLoadingVersions}
                size="small"
                width={167}
                className="versions-button"
            >
                {excludeLiveOrRemix ? "Toon live/remixes" : "Zonder live/remixes"}
            </Pillbox>
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
