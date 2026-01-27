import {useEffect} from "react";
import {searchReleases} from "../services/discogsService.js";

export default function Home() {
    useEffect(() => {
        async function testDiscogs() {
            try {
                const results = await searchReleases("Hallelujah");
                console.log(results);
            } catch (error) {
                console.error("Discogs error: ", error);
            }
        }
     testDiscogs()
    }, []);


    return <h1>Home</h1>;
}
