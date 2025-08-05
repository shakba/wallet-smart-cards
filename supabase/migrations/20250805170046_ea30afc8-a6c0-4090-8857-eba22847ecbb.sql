-- Make email column nullable since it should be optional
ALTER TABLE public.passes ALTER COLUMN email DROP NOT NULL;