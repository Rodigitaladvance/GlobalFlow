export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  country: string;
  currency_code: string;
};

export async function fetchProduct(country: string): Promise<Product> {
  // En Remotion Studio (browser) se usan las vars REMOTION_ (bundleadas por webpack).
  // En el CLI de Remotion (Node.js) se usan las vars sin prefijo.
  const url =
    process.env.REMOTION_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.REMOTION_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing REMOTION_SUPABASE_URL / REMOTION_SUPABASE_ANON_KEY in .env"
    );
  }

  const res = await fetch(
    `${url}/rest/v1/products?country=eq.${country}&select=*&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

  const data: Product[] = await res.json();
  if (!data[0]) throw new Error(`No product found for country: ${country}`);

  return data[0];
}
