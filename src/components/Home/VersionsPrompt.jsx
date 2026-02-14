import { Pillbox } from "../Pillbox/Pillbox.jsx";

// Prompt to reveal or hide other versions.
export default function VersionsPrompt({ show, showVersions, onToggle }) {
    if (!show) return null;

    return (
        <div>
            <p className="versions-text">Er zijn nog meer artiesten met een versie van dit nummer, wil je die zien?</p>
            <Pillbox
                as="button"
                type="button"
                onClick={onToggle}
                size="small"
                width={167}
                className="versions-toggle-button"
            >
                {showVersions ? "Verberg versies" : "Meer versies zien"}
            </Pillbox>
        </div>
    );
}
