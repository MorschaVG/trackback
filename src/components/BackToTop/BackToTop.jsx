import { useEffect, useState } from "react";
import { Pillbox } from "../Pillbox/Pillbox.jsx";
import "./BackToTop.css";

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function handleScroll() {
            setVisible(window.scrollY > 400);
        }
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <Pillbox
            as="button"
            type="button"
            size="small"
            width={140}
            className="back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
            Naar boven
        </Pillbox>
    );
}
