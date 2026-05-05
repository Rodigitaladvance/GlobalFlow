-- Hito 2: tabla de productos para GlobalFlow
CREATE TABLE IF NOT EXISTS public.products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  price       numeric     NOT NULL,
  country     text        NOT NULL
);

-- Habilitar Row Level Security (buena práctica desde el inicio)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (ajustar según necesidades)
CREATE POLICY "allow_select_all" ON public.products
  FOR SELECT USING (true);
