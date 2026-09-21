-- Portada (cover photo) feature: a photo above the logo/title that fades into the page
-- background, ending right before the button list starts.
alter table landings add column if not exists cover_image_url text;
alter table landings add column if not exists cover_style jsonb;
