import "./index.css";
import { Composition } from "remotion";
import { z } from "zod";
import { MyComposition } from "./Composition";
import { ProductScene, calculateProductMetadata } from "./ProductScene";

const productSceneSchema = z.object({
  country: z.enum(["ES", "CA", "US", "AU", "UK"]),
});

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
        schema={productSceneSchema}
        defaultProps={{ country: "AU" as const }}
      />
    </>
  );
};
