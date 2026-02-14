import "./About.css";
import BrandHeader from "../components/BrandHeader/BrandHeader.jsx";

export default function About() {
    return (
        <section>
            <BrandHeader />
            <p>TrackBack is een web-applicatie gebouwd <a className="about-link" href="https://github.com/MorschaVG" target="_blank" rel="noreferrer">Morscha von Grumbkow</a> als eindopdracht van zijn Bootcamp Web Developer aan <a className="about-link" href="https://www.novi.nl/" target="_blank" rel="noreferrer">NOVI Hogeschool</a>.<br />
            Voor deze applicatie is gebruik gemaakt van Vite-React.
            </p>
        </section>
    );
}
