import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { ProductScene, calculateProductMetadata } from "./ProductScene";
import type { ProductSceneProps } from "./ProductScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />

      <Composition
        id="ProductScene"
        component={ProductScene}
        calculateMetadata={calculateProductMetadata}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ country: "ES" } as ProductSceneProps}
      />
    </>
  );
};
