import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";

const antonLoaded = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const bebasLoaded = loadBebas("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const anton = antonLoaded.fontFamily;
export const bebas = bebasLoaded.fontFamily;
