insert into public.lil_robb_products (
  id, title, species, description, price, inventory, light, watering, soil,
  growing_conditions, difficulty, humidity, mature_size, pet_safety, care_notes,
  image_url, art_variant, is_published
) values
('swiss-cheese-plant', 'Swiss Cheese Plant', 'Monstera deliciosa', 'A classic tropical houseplant with bold split foliage and a climbing habit.', 29.0, 8, 'Bright indirect light', 'Water when the top 2 inches of soil feel dry', 'Chunky well draining aroid mix', 'Warm indoor conditions with room to climb', 'Moderate', 'Moderate to high humidity', '6 to 10 ft indoors', 'Toxic if chewed by cats or dogs', 'Use a moss pole or support as stems lengthen', null, 0, true),
('golden-pothos', 'Golden Pothos', 'Epipremnum aureum', 'An adaptable trailing plant with green and gold leaves that suits shelves and hanging planters.', 16.0, 15, 'Low to bright indirect light', 'Water when the top 1 to 2 inches of soil feel dry', 'Loose well draining houseplant mix', 'Average indoor temperatures away from cold drafts', 'Easy', 'Average home humidity', '6 to 10 ft trailing indoors', 'Toxic if chewed by cats or dogs', 'Trim vines to encourage fuller growth', null, 1, true),
('snake-plant', 'Snake Plant', 'Dracaena trifasciata', 'Upright sword shaped leaves make this a durable choice for compact rooms and busy schedules.', 22.0, 10, 'Low to bright indirect light', 'Let the soil dry almost completely before watering', 'Fast draining succulent or cactus style mix', 'Normal indoor temperatures with dry periods between watering', 'Easy', 'Low to average humidity', '2 to 4 ft indoors', 'Toxic if chewed by cats or dogs', 'Avoid leaving water in the pot or crown', null, 2, true),
('zz-plant', 'ZZ Plant', 'Zamioculcas zamiifolia', 'Glossy stems and thick leaflets give this slow growing plant a polished look with little fuss.', 24.0, 9, 'Low to bright indirect light', 'Let most of the soil dry before watering', 'Well draining potting mix with added perlite', 'Stable indoor temperatures and infrequent watering', 'Easy', 'Average home humidity', '2 to 4 ft indoors', 'Toxic if chewed by cats or dogs', 'Use a pot with drainage and do not keep the roots wet', null, 3, true),
('heartleaf-philodendron', 'Heartleaf Philodendron', 'Philodendron hederaceum', 'A soft trailing philodendron with heart shaped leaves that grows well on shelves or supports.', 18.0, 12, 'Medium to bright indirect light', 'Water when the top 1 to 2 inches of soil feel dry', 'Airy well draining houseplant mix', 'Warm conditions with protection from harsh direct sun', 'Easy', 'Moderate humidity', '4 to 8 ft trailing indoors', 'Toxic if chewed by cats or dogs', 'Pinch growing tips to encourage branching', null, 4, true),
('spider-plant', 'Spider Plant', 'Chlorophytum comosum', 'Arching striped foliage and easy propagation make this a friendly starter plant.', 14.0, 14, 'Medium to bright indirect light', 'Water when the top inch of soil feels dry', 'General houseplant mix with good drainage', 'Average indoor temperatures with gentle airflow', 'Easy', 'Average home humidity', '1 to 2 ft with longer runners', 'Generally considered non toxic to cats and dogs', 'Trim brown tips and remove spent plantlets as needed', null, 0, true),
('peace-lily', 'Peace Lily', 'Spathiphyllum', 'Deep green leaves and white blooms bring a lush tropical look to medium light rooms.', 20.0, 7, 'Medium to bright indirect light', 'Water when the top inch begins to dry', 'Moisture retentive mix with good drainage', 'Warm rooms with steady moisture and no harsh sun', 'Moderate', 'Moderate to high humidity', '1 to 3 ft indoors', 'Toxic or irritating if chewed by cats or dogs', 'Remove spent blooms and avoid letting the root ball stay waterlogged', null, 1, true),
('rubber-plant', 'Rubber Plant', 'Ficus elastica', 'Thick glossy leaves and an upright habit make this ficus a strong statement plant.', 28.0, 6, 'Bright indirect light', 'Water when the top 2 inches of soil feel dry', 'Rich well draining potting mix', 'Stable warm conditions away from cold drafts', 'Moderate', 'Moderate humidity', '6 to 10 ft indoors', 'Toxic or irritating if chewed by cats or dogs', 'Wipe leaves occasionally and rotate the pot for even growth', null, 2, true),
('fiddle-leaf-fig', 'Fiddle-Leaf Fig', 'Ficus lyrata', 'Large violin shaped leaves give this ficus the scale and structure of a statement floor plant.', 34.0, 4, 'Bright indirect light', 'Water when the top 2 inches of soil feel dry', 'Rich fast draining potting mix', 'Bright stable conditions with minimal sudden changes', 'Advanced', 'Moderate humidity', '6 to 10 ft indoors', 'Toxic or irritating if chewed by cats or dogs', 'Keep light and watering routines consistent and avoid frequent moves', null, 3, true),
('chinese-money-plant', 'Chinese Money Plant', 'Pilea peperomioides', 'Round coin shaped leaves on slender stems give this compact plant a playful clean silhouette.', 19.0, 11, 'Bright indirect light', 'Water when the top inch of soil feels dry', 'Light well draining houseplant mix', 'Bright rooms with regular rotation for even growth', 'Easy', 'Average home humidity', '8 to 18 in indoors', 'Generally considered non toxic to cats and dogs', 'Rotate weekly and separate offsets when they are established', null, 4, true)
on conflict (id) do update set
  title = excluded.title,
  species = excluded.species,
  description = excluded.description,
  price = excluded.price,
  inventory = excluded.inventory,
  light = excluded.light,
  watering = excluded.watering,
  soil = excluded.soil,
  growing_conditions = excluded.growing_conditions,
  difficulty = excluded.difficulty,
  humidity = excluded.humidity,
  mature_size = excluded.mature_size,
  pet_safety = excluded.pet_safety,
  care_notes = excluded.care_notes,
  art_variant = excluded.art_variant,
  updated_at = now();

insert into public.lil_robb_store_settings (
  id, coming_soon, announcement, standard_shipping, free_shipping_threshold, local_pickup_enabled
) values (
  true,
  true,
  'Online ordering is not open yet. Browse the launch collection and build a cart now.',
  10,
  75,
  true
)
on conflict (id) do update set
  coming_soon = excluded.coming_soon,
  announcement = excluded.announcement,
  standard_shipping = excluded.standard_shipping,
  free_shipping_threshold = excluded.free_shipping_threshold,
  local_pickup_enabled = excluded.local_pickup_enabled,
  updated_at = now();
