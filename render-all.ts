/**
 * render-all.ts
 * Obtiene todos los países de Supabase y genera un .mp4 por cada uno.
 * Uso: npm run render-all
 */

import path from "path";
import { config as loadEnv } from "dotenv";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import type { Configuration } from "webpack";

loadEnv(); // Carga las variables de .env

// ─── Configuración ────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COMPOSITION_ID = "ProductScene";
const ENTRY_POINT = path.resolve("./src/index.ts");
const OUT_DIR = path.resolve("./out");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkEnv(): void {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env"
    );
  }
}

import type { Product } from "./src/lib/supabase";

async function getAllProducts(): Promise<Product[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=*&order=country.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Supabase error al obtener productos: HTTP ${res.status}`);
  }

  return res.json();
}

function bar(progress: number, width = 28): string {
  const filled = Math.round(progress * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  checkEnv();

  // 1. Obtener todos los productos desde Supabase (Node.js, sin browser)
  console.log("\n📦  Consultando productos en Supabase…");
  const products = await getAllProducts();
  console.log(`    Encontrados: ${products.map((p) => p.country).join(", ")}\n`);

  // 2. Crear el bundle de Remotion (una sola vez para todos los renders)
  console.log("🔧  Bundling del proyecto Remotion…");
  const bundleUrl = await bundle({
    entryPoint: ENTRY_POINT,
    // Tailwind + fix webpack/Node.js 24: xxhash64 y md4 usan WASM (roto en
    // Node 22+). sha256 usa crypto nativo de Node.js sin WebAssembly.
    webpackOverride: (config: Configuration): Configuration => {
      const withTailwind = enableTailwind(config);
      return {
        ...withTailwind,
        output: {
          ...withTailwind.output,
          hashFunction: "sha256",
        },
      };
    },
  });
  console.log("    Bundle listo.\n");

  // 3. Renderizar un .mp4 por producto
  const results: Array<{ country: string; output: string; ok: boolean }> = [];

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    const { country } = product;
    const label = `[${index + 1}/${products.length}] ${country}`;
    const outputPath = path.join(OUT_DIR, `${country}.mp4`);

    console.log(`🎬  ${label} → ${outputPath}`);

    try {
      // Pasamos el producto completo como inputProps → calculateMetadata
      // lo detecta y hace cortocircuito sin fetch (browser no necesita red)
      const inputProps = { country, product };

      const composition = await selectComposition({
        serveUrl: bundleUrl,
        id: COMPOSITION_ID,
        inputProps,
      });

      await renderMedia({
        composition,
        serveUrl: bundleUrl,
        codec: "h264",
        outputLocation: outputPath,
        inputProps,
        onProgress: ({ progress }) => {
          const pct = Math.round(progress * 100);
          process.stdout.write(
            `\r    ${bar(progress)} ${String(pct).padStart(3)}%`
          );
        },
      });

      process.stdout.write("\n");
      results.push({ country, output: outputPath, ok: true });
      console.log(`    ✅ Guardado: ${outputPath}\n`);
    } catch (err) {
      process.stdout.write("\n");
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ country, output: outputPath, ok: false });
      console.error(`    ❌ Error en ${country}: ${msg}\n`);
    }
  }

  // 4. Resumen final
  console.log("─".repeat(52));
  console.log("  Resumen del renderizado:");
  for (const r of results) {
    const icon = r.ok ? "✅" : "❌";
    console.log(`  ${icon}  ${r.country.padEnd(4)} → ${r.output}`);
  }
  console.log("─".repeat(52) + "\n");

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n💥 Error fatal:", err);
  process.exit(1);
});
