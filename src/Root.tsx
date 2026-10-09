import { Composition } from "remotion";
import "./fonts";
import "./index.css";
import { SneakoPromo, type SneakoPromoProps } from "./SneakoPromo";
import { promoConfig } from "./config";

const durationInFrames = promoConfig.durationInSeconds * promoConfig.fps;

const portraitProps: SneakoPromoProps = { layout: "portrait" };
const landscapeProps: SneakoPromoProps = { layout: "landscape" };

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={promoConfig.compositions.portrait.id}
        component={SneakoPromo}
        durationInFrames={durationInFrames}
        fps={promoConfig.fps}
        width={promoConfig.compositions.portrait.width}
        height={promoConfig.compositions.portrait.height}
        defaultProps={portraitProps}
      />
      <Composition
        id={promoConfig.compositions.landscape.id}
        component={SneakoPromo}
        durationInFrames={durationInFrames}
        fps={promoConfig.fps}
        width={promoConfig.compositions.landscape.width}
        height={promoConfig.compositions.landscape.height}
        defaultProps={landscapeProps}
      />
    </>
  );
};
