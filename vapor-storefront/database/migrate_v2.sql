-- v2 migration: vapor_score, genre, min_specs (+ Eric's image_url and is_admin)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vapor_score INTEGER DEFAULT 70;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS genre VARCHAR(50) DEFAULT 'Action';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_specs JSONB;

UPDATE public.products SET vapor_score = 91, genre = 'Roguelike',
  min_specs = '{"ram_gb": 4, "gpu_vram_gb": 2, "cpu_ghz": 2.0}'
  WHERE name = 'Dungeon Crawler';

UPDATE public.products SET vapor_score = 78, genre = 'Adventure',
  min_specs = '{"ram_gb": 8, "gpu_vram_gb": 4, "cpu_ghz": 2.5}'
  WHERE name = 'Space Adventure';

UPDATE public.products SET vapor_score = 45, genre = 'DLC',
  min_specs = '{"ram_gb": 2, "gpu_vram_gb": 1, "cpu_ghz": 1.5}'
  WHERE name = 'Soundtrack Pack';

UPDATE public.products SET vapor_score = 94, genre = 'Action',
  min_specs = '{"ram_gb": 16, "gpu_vram_gb": 6, "cpu_ghz": 3.0}'
  WHERE name LIKE '%Twilight Handball%';

UPDATE public.products SET vapor_score = 97, genre = 'Open World',
  min_specs = '{"ram_gb": 16, "gpu_vram_gb": 8, "cpu_ghz": 3.2}'
  WHERE name LIKE '%Breath of the Subway%';

UPDATE public.products SET vapor_score = 52, genre = 'Adventure',
  min_specs = '{"ram_gb": 8, "gpu_vram_gb": 4, "cpu_ghz": 2.5}'
  WHERE name LIKE '%Chopped Cheeze%';
