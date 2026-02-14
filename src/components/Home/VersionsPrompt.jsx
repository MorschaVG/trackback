import { Pillbox } from "../Pillbox/Pillbox.jsx";

// Prompt to reveal or hide other versions.
export default function VersionsPrompt({ show, showVersions, onToggle, buttonRef }) {
    if (!show) return null;

    return (
        <div>
            <p className="versions-text">Er zijn nog meer artiesten met een versie van dit nummer. Wil je die zien?</p>
            <Pillbox
                as="button"
                type="button"
                onClick={onToggle}
                size="small"
                width={167}
                className="versions-toggle-button"
                ref={buttonRef}
            >
                {showVersions ? "Verberg versies" : "Meer versies zien"}
            </Pillbox>
        </div>
    );
}
