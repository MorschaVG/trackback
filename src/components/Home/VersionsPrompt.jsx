// Prompt to reveal or hide other versions.
export default function VersionsPrompt({ show, showVersions, onToggle }) {
    if (!show) return null;

    return (
        <div>
            <p>Other artists have versions of this work. Show them?</p>
            <button type="button" onClick={onToggle} className="home-button">
                {showVersions ? "Hide versions" : "Show versions"}
            </button>
        </div>
    );
}
