import logoPrimary from "../../assets/logo-primary-color.png";
import "./BrandHeader.css";

function buildClassName(...values) {
    return values.filter(Boolean).join(" ");
}

export default function BrandHeader({ className = "" }) {
    return (
        <header className={buildClassName("brand-header", className)}>
            <img
                src={logoPrimary}
                alt="TrackBack logo"
                className="brand-header__logo"
            />
            <h1 className="brand-header__title">TrackBack</h1>
        </header>
    );
}
