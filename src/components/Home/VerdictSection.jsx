// Displays the verdict and original attribution when applicable.
export default function VerdictSection({ verdict, originalInfo }) {
    if (!verdict) return null;

    return (
        <div>
            <h2>Verdict: {verdict}</h2>
            {originalInfo && verdict !== "original" ? (
                <p>
                    Original: {originalInfo.artists?.join(" & ") || "Unknown"} -
                    {` ${originalInfo.title}`}
                    {originalInfo.date ? ` - ${originalInfo.date}` : ""}
                </p>
            ) : null}
        </div>
    );
}
