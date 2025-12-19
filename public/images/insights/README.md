# Insights placeholder images (Pexels-based)

We currently use remote Pexels images as category-aware placeholders to avoid committing binary thumbnail assets while the Insights CMS is still mock/hybrid.

## Precedence

1. If a post has `coverImage` (or `imageUrl`), that is used.
2. Else use the category placeholder below.
3. Else use the default placeholder.

## License

Pexels License (free to use; attribution not required). See:
https://www.pexels.com/license/

## Category placeholders

### technology
- Pexels page: https://www.pexels.com/photo/blueprints-and-a-laptop-8470810/
- CDN: https://images.pexels.com/photos/8470810/pexels-photo-8470810.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

### market-analysis
- Pexels page: https://www.pexels.com/photo/construction-cranes-over-skyscrapers-19915446/
- CDN: https://images.pexels.com/photos/19915446/pexels-photo-19915446.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

### sustainability
- Pexels page: https://www.pexels.com/photo/a-roof-with-solar-panels-on-it-27863809/
- CDN: https://images.pexels.com/photos/27863809/pexels-photo-27863809.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

### cost-management
- Pexels page: https://www.pexels.com/photo/black-calculator-on-blueprints-5915147/
- CDN: https://images.pexels.com/photos/5915147/pexels-photo-5915147.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

### safety
- Pexels page: https://www.pexels.com/photo/safety-helmet-hard-hat-close-up-photo-10739750/
- CDN: https://images.pexels.com/photos/10739750/pexels-photo-10739750.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

### data
- Pexels page: https://www.pexels.com/photo/server-racks-on-data-center-4508751/
- CDN: https://images.pexels.com/photos/4508751/pexels-photo-4508751.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

### general
- Pexels page: https://www.pexels.com/photo/aerial-photo-of-heavy-equipments-1188532/
- CDN: https://images.pexels.com/photos/1188532/pexels-photo-1188532.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

### default
- Pexels page: https://www.pexels.com/photo/construction-crane-over-buildings-at-sunset-20847810/
- CDN: https://images.pexels.com/photos/20847810/pexels-photo-20847810.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop

## NOTE

When the headless CMS is integrated, map its image field to `coverImage` (or `imageUrl`) so posts can supply their own cover thumbnails and bypass these placeholders.
