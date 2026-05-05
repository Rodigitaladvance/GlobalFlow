import {
  AbsoluteFill,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useState } from "react";
import { loadFont } from "@remotion/google-fonts/Inter";
import { fetchProduct, type Product } from "./lib/supabase";

// ─── Font ─────────────────────────────────────────────────────────────────────

const { fontFamily, waitUntilDone } = loadFont();

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputProps = { country: string };
export type ProductSceneProps = InputProps & { product?: Product };

// ─── Country themes ───────────────────────────────────────────────────────────

const THEMES: Record<
  string,
  {
    bg1: string;
    bg2: string;
    glow: string;
    accent: string;
    flag: string;
    locale: string;
    priceLabel: string;
  }
> = {
  ES: {
    bg1: "#0d0205",
    bg2: "#1c0808",
    glow: "#B45309",
    accent: "#F59E0B",
    flag: "🇪🇸",
    locale: "es-ES",
    priceLabel: "Precio",
  },
  CA: {
    bg1: "#0d0303",
    bg2: "#1c0505",
    glow: "#B91C1C",
    accent: "#F87171",
    flag: "🇨🇦",
    locale: "en-CA",
    priceLabel: "Price",
  },
  US: {
    bg1: "#010510",
    bg2: "#03091c",
    glow: "#1D4ED8",
    accent: "#60A5FA",
    flag: "🇺🇸",
    locale: "en-US",
    priceLabel: "Price",
  },
  AU: {
    bg1: "#010810",
    bg2: "#020e1c",
    glow: "#0369A1",
    accent: "#38BDF8",
    flag: "🇦🇺",
    locale: "en-AU",
    priceLabel: "Price",
  },
  UK: {
    bg1: "#020210",
    bg2: "#04041c",
    glow: "#6D28D9",
    accent: "#A78BFA",
    flag: "🇬🇧",
    locale: "en-GB",
    priceLabel: "Price",
  },
};

const DEFAULT_THEME = THEMES.US;

// ─── calculateMetadata — server-side, fetches from Supabase ──────────────────

export const calculateProductMetadata: CalculateMetadataFunction<ProductSceneProps> = async ({
  props,
}: {
  props: ProductSceneProps;
}) => {
  // Si el producto ya viene en inputProps (render CLI), no hacemos fetch
  if (props.product) {
    return { props };
  }
  // En Remotion Studio el browser hace el fetch con las vars REMOTION_*
  const product = await fetchProduct(props.country);
  return { props: { ...props, product } };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductScene: React.FC<ProductSceneProps> = ({ product }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wait for Inter font before rendering
  const [fontHandle] = useState(() => delayRender("Loading Inter font"));
  waitUntilDone().then(() => continueRender(fontHandle));

  if (!product) return <AbsoluteFill style={{ background: "#05050f" }} />;

  const theme = THEMES[product.country] ?? DEFAULT_THEME;

  // ── Background ──────────────────────────────────────────────────────────────
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  // Slow-moving radial glow (breathing effect over 180 frames)
  const glowX = interpolate(frame, [0, 180], [22, 58]);
  const glowY = interpolate(frame, [0, 180], [72, 28]);

  // ── Flag — slides in from right ─────────────────────────────────────────────
  const flagP = spring({ fps, frame: frame - 12, config: { stiffness: 32, damping: 24 } });
  const flagX = interpolate(flagP, [0, 1], [80, 0]);
  const flagOpacity = interpolate(frame, [12, 32], [0, 1], { extrapolateRight: "clamp" });

  // ── Accent line — grows from left ───────────────────────────────────────────
  const lineP = spring({ fps, frame: frame - 28, config: { stiffness: 42, damping: 22 } });
  const lineWidth = interpolate(lineP, [0, 1], [0, 360]);
  const lineOpacity = interpolate(frame, [28, 45], [0, 1], { extrapolateRight: "clamp" });

  // ── Product name — smooth slide from left ───────────────────────────────────
  const nameP = spring({ fps, frame: frame - 42, config: { stiffness: 36, damping: 24 } });
  const nameX = interpolate(nameP, [0, 1], [-110, 0]);
  const nameOpacity = interpolate(frame, [42, 62], [0, 1], { extrapolateRight: "clamp" });

  // ── Description — smooth slide from left (staggered) ────────────────────────
  const descP = spring({ fps, frame: frame - 62, config: { stiffness: 36, damping: 24 } });
  const descX = interpolate(descP, [0, 1], [-80, 0]);
  const descOpacity = interpolate(frame, [62, 82], [0, 1], { extrapolateRight: "clamp" });

  // ── Price badge — slides up from bottom ─────────────────────────────────────
  const priceP = spring({ fps, frame: frame - 85, config: { stiffness: 36, damping: 24 } });
  const priceY = interpolate(priceP, [0, 1], [75, 0]);
  const priceOpacity = interpolate(frame, [85, 108], [0, 1], { extrapolateRight: "clamp" });

  // ── Shimmer sweep across price card (frames 120–150) ────────────────────────
  const shimmerX = interpolate(frame, [120, 150], [-260, 440], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const formattedPrice = new Intl.NumberFormat(theme.locale, {
    style: "currency",
    currency: product.currency_code,
    maximumFractionDigits: 2,
  }).format(product.price);

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(ellipse 55% 60% at ${glowX}% ${glowY}%, ${theme.glow}28 0%, transparent 65%),
          linear-gradient(140deg, ${theme.bg1} 0%, ${theme.bg2} 100%)
        `,
        opacity: bgOpacity,
        fontFamily,
        overflow: "hidden",
      }}
    >
      {/* ── Top right: Flag + Country code ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 54,
          right: 68,
          display: "flex",
          alignItems: "center",
          gap: 14,
          transform: `translateX(${flagX}px)`,
          opacity: flagOpacity,
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.30)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            fontFamily,
          }}
        >
          {product.country}
        </span>
        <span style={{ fontSize: 42, lineHeight: 1 }}>{theme.flag}</span>
      </div>

      {/* ── Center left: Name + Description ────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 92,
          right: 200,
          transform: "translateY(-52%)",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            borderRadius: 1,
            marginBottom: 30,
            opacity: lineOpacity,
            background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accent}00 100%)`,
          }}
        />

        {/* Product name */}
        <h1
          style={{
            transform: `translateX(${nameX}px)`,
            opacity: nameOpacity,
            color: "#f5f5f5",
            fontSize: 62,
            fontWeight: 800,
            margin: "0 0 20px",
            lineHeight: 1.06,
            letterSpacing: "-1.8px",
            fontFamily,
          }}
        >
          {product.name}
        </h1>

        {/* Description */}
        <p
          style={{
            transform: `translateX(${descX}px)`,
            opacity: descOpacity,
            color: "rgba(255,255,255,0.44)",
            fontSize: 20,
            margin: 0,
            lineHeight: 1.68,
            fontWeight: 400,
            maxWidth: 580,
            fontFamily,
          }}
        >
          {product.description}
        </p>
      </div>

      {/* ── Bottom left: Price card ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 92,
          transform: `translateY(${priceY}px)`,
          opacity: priceOpacity,
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            padding: "24px 48px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: `
              0 24px 64px rgba(0,0,0,0.55),
              0 0 0 1px ${theme.accent}14,
              inset 0 1px 0 rgba(255,255,255,0.07)
            `,
          }}
        >
          {/* Shimmer band */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 90,
              left: shimmerX,
              background: `linear-gradient(
                90deg,
                transparent 0%,
                ${theme.accent}28 35%,
                ${theme.accent}55 50%,
                ${theme.accent}28 65%,
                transparent 100%
              )`,
              pointerEvents: "none",
            }}
          />

          {/* Price label */}
          <div
            style={{
              color: "rgba(255,255,255,0.28)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: "uppercase",
              marginBottom: 10,
              fontFamily,
            }}
          >
            {theme.priceLabel}
          </div>

          {/* Price value */}
          <div
            style={{
              color: theme.accent,
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1,
              fontFamily,
            }}
          >
            {formattedPrice}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
