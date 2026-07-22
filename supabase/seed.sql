with seeded_games (
  slug,
  title,
  description,
  cover_image_url,
  background_image_url,
  release_date,
  developer,
  publisher,
  external_rating,
  estimated_playtime,
  genres,
  platforms,
  screenshots
) as (
  values
    ('the-witcher-3-wild-hunt', 'The Witcher 3: Wild Hunt', 'A fantasy RPG about contracts, consequences, and a monster hunter searching through a war-torn world.', 'https://placehold.co/600x820/1f2937/F8FAFC/png?text=The%20Witcher%203', 'https://placehold.co/1280x720/172554/F8FAFC/png?text=The%20Witcher%203%20preview', '2015-05-19'::date, 'CD Projekt Red', 'CD Projekt', 9.2, 55, array['RPG','Open World','Adventure'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/064e3b/F8FAFC/png?text=Velen','https://placehold.co/1280x720/0f172a/F8FAFC/png?text=Skellige']),
    ('red-dead-redemption-2', 'Red Dead Redemption 2', 'A character-driven western journey with slow-burn drama, open country, and patient systems.', 'https://placehold.co/600x820/7f1d1d/F8FAFC/png?text=Red%20Dead%20Redemption%202', 'https://placehold.co/1280x720/451a03/F8FAFC/png?text=Red%20Dead%20Redemption%202%20preview', '2018-10-26'::date, 'Rockstar Studios', 'Rockstar Games', 9.4, 50, array['Adventure','Open World','Action'], array['PC','PlayStation','Xbox'], array['https://placehold.co/1280x720/713f12/F8FAFC/png?text=Frontier%20camp','https://placehold.co/1280x720/1e293b/F8FAFC/png?text=Snow%20trail']),
    ('hades', 'Hades', 'A fast roguelike action game where every escape attempt builds sharper skills and warmer drama.', 'https://placehold.co/600x820/7c2d12/F8FAFC/png?text=Hades', 'https://placehold.co/1280x720/581c87/F8FAFC/png?text=Hades%20preview', '2020-09-17'::date, 'Supergiant Games', 'Supergiant Games', 9.1, 22, array['Roguelike','Action','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/4c0519/F8FAFC/png?text=House%20of%20Hades','https://placehold.co/1280x720/991b1b/F8FAFC/png?text=Asphodel']),
    ('celeste', 'Celeste', 'A precise mountain-climbing platformer that turns difficult jumps into a story about persistence.', 'https://placehold.co/600x820/1e3a8a/F8FAFC/png?text=Celeste', 'https://placehold.co/1280x720/831843/F8FAFC/png?text=Celeste%20preview', '2018-01-25'::date, 'Maddy Makes Games', 'Maddy Makes Games', 8.9, 8, array['Platformer','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/075985/F8FAFC/png?text=Summit%20climb']),
    ('elden-ring', 'Elden Ring', 'A dark fantasy action RPG built around discovery, difficult fights, and strange ruins.', 'https://placehold.co/600x820/3f3f46/F8FAFC/png?text=Elden%20Ring', 'https://placehold.co/1280x720/365314/F8FAFC/png?text=Elden%20Ring%20preview', '2022-02-25'::date, 'FromSoftware', 'Bandai Namco', 9.5, 60, array['Action RPG','Open World'], array['PC','PlayStation','Xbox'], array['https://placehold.co/1280x720/14532d/F8FAFC/png?text=Limgrave']),
    ('baldurs-gate-3', 'Baldur''s Gate 3', 'A party-based RPG where dice rolls, dialogue, and experiments reshape the campaign.', 'https://placehold.co/600x820/4c1d95/F8FAFC/png?text=Baldur%27s%20Gate%203', 'https://placehold.co/1280x720/312e81/F8FAFC/png?text=Baldur%27s%20Gate%203%20preview', '2023-08-03'::date, 'Larian Studios', 'Larian Studios', 9.6, 75, array['RPG','Strategy','Adventure'], array['PC','PlayStation','Xbox'], array['https://placehold.co/1280x720/581c87/F8FAFC/png?text=Camp']),
    ('stardew-valley', 'Stardew Valley', 'A cozy farming life sim about rebuilding a homestead and finding a daily rhythm.', 'https://placehold.co/600x820/166534/F8FAFC/png?text=Stardew%20Valley', 'https://placehold.co/1280x720/14532d/F8FAFC/png?text=Stardew%20Valley%20preview', '2016-02-26'::date, 'ConcernedApe', 'ConcernedApe', 9.0, 50, array['Simulation','RPG','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch','Mobile'], array['https://placehold.co/1280x720/15803d/F8FAFC/png?text=Spring%20farm']),
    ('hollow-knight', 'Hollow Knight', 'A hand-drawn metroidvania filled with quiet ruins, demanding bosses, and secrets.', 'https://placehold.co/600x820/0f172a/F8FAFC/png?text=Hollow%20Knight', 'https://placehold.co/1280x720/111827/F8FAFC/png?text=Hollow%20Knight%20preview', '2017-02-24'::date, 'Team Cherry', 'Team Cherry', 9.0, 27, array['Metroidvania','Action','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/1e293b/F8FAFC/png?text=Crossroads']),
    ('disco-elysium', 'Disco Elysium', 'A detective RPG about identity, politics, and internal voices arguing through choices.', 'https://placehold.co/600x820/7f1d1d/F8FAFC/png?text=Disco%20Elysium', 'https://placehold.co/1280x720/1f2937/F8FAFC/png?text=Disco%20Elysium%20preview', '2019-10-15'::date, 'ZA/UM', 'ZA/UM', 9.1, 25, array['RPG','Narrative','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/713f12/F8FAFC/png?text=Revachol']),
    ('god-of-war', 'God of War', 'A mythic action adventure pairing weighty combat with a focused family journey.', 'https://placehold.co/600x820/1e40af/F8FAFC/png?text=God%20of%20War', 'https://placehold.co/1280x720/0c4a6e/F8FAFC/png?text=God%20of%20War%20preview', '2018-04-20'::date, 'Santa Monica Studio', 'Sony Interactive Entertainment', 9.3, 21, array['Action','Adventure'], array['PC','PlayStation'], array['https://placehold.co/1280x720/164e63/F8FAFC/png?text=Lake']),
    ('the-legend-of-zelda-breath-of-the-wild', 'The Legend of Zelda: Breath of the Wild', 'An open-air adventure where physics, terrain, and curiosity drive the journey.', 'https://placehold.co/600x820/065f46/F8FAFC/png?text=Breath%20of%20the%20Wild', 'https://placehold.co/1280x720/166534/F8FAFC/png?text=Breath%20of%20the%20Wild%20preview', '2017-03-03'::date, 'Nintendo EPD', 'Nintendo', 9.5, 50, array['Adventure','Open World','Action'], array['Nintendo Switch'], array['https://placehold.co/1280x720/14532d/F8FAFC/png?text=Hyrule']),
    ('persona-5-royal', 'Persona 5 Royal', 'A stylish JRPG about school days, supernatural heists, and bonds powering battles.', 'https://placehold.co/600x820/991b1b/F8FAFC/png?text=Persona%205%20Royal', 'https://placehold.co/1280x720/450a0a/F8FAFC/png?text=Persona%205%20Royal%20preview', '2019-10-31'::date, 'P-Studio', 'Atlus', 9.2, 100, array['JRPG','RPG','Social Sim'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/7f1d1d/F8FAFC/png?text=Tokyo']),
    ('mass-effect-legendary-edition', 'Mass Effect Legendary Edition', 'A remastered sci-fi trilogy about crew loyalty, galaxy-scale choices, and combat.', 'https://placehold.co/600x820/1e3a8a/F8FAFC/png?text=Mass%20Effect', 'https://placehold.co/1280x720/0f172a/F8FAFC/png?text=Mass%20Effect%20preview', '2021-05-14'::date, 'BioWare', 'Electronic Arts', 8.8, 95, array['RPG','Sci-Fi','Action'], array['PC','PlayStation','Xbox'], array['https://placehold.co/1280x720/1d4ed8/F8FAFC/png?text=Normandy']),
    ('portal-2', 'Portal 2', 'A clever first-person puzzle comedy about momentum, portals, and confident machinery.', 'https://placehold.co/600x820/0e7490/F8FAFC/png?text=Portal%202', 'https://placehold.co/1280x720/155e75/F8FAFC/png?text=Portal%202%20preview', '2011-04-19'::date, 'Valve', 'Valve', 9.4, 9, array['Puzzle','Comedy'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/0369a1/F8FAFC/png?text=Test%20chamber']),
    ('outer-wilds', 'Outer Wilds', 'A time-loop mystery about exploring a tiny solar system and connecting its clues.', 'https://placehold.co/600x820/7c2d12/F8FAFC/png?text=Outer%20Wilds', 'https://placehold.co/1280x720/0f172a/F8FAFC/png?text=Outer%20Wilds%20preview', '2019-05-28'::date, 'Mobius Digital', 'Annapurna Interactive', 9.0, 16, array['Adventure','Puzzle','Exploration'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/92400e/F8FAFC/png?text=Timber%20Hearth']),
    ('minecraft', 'Minecraft', 'A block-building survival sandbox where creative plans and improvised adventures share a world.', 'https://placehold.co/600x820/15803d/F8FAFC/png?text=Minecraft', 'https://placehold.co/1280x720/166534/F8FAFC/png?text=Minecraft%20preview', '2011-11-18'::date, 'Mojang Studios', 'Xbox Game Studios', 8.7, 80, array['Sandbox','Survival','Creative'], array['PC','PlayStation','Xbox','Nintendo Switch','Mobile'], array['https://placehold.co/1280x720/3f6212/F8FAFC/png?text=Starter%20base']),
    ('fortnite', 'Fortnite', 'A fast multiplayer action platform with building, events, and battle royale matches.', 'https://placehold.co/600x820/1d4ed8/F8FAFC/png?text=Fortnite', 'https://placehold.co/1280x720/6d28d9/F8FAFC/png?text=Fortnite%20preview', '2017-07-21'::date, 'Epic Games', 'Epic Games', 8.0, 20, array['Shooter','Battle Royale','Multiplayer'], array['PC','PlayStation','Xbox','Nintendo Switch','Mobile'], array['https://placehold.co/1280x720/2563eb/F8FAFC/png?text=Island']),
    ('counter-strike-2', 'Counter-Strike 2', 'A tactical team shooter where precision, utility, and calm decisions decide rounds.', 'https://placehold.co/600x820/334155/F8FAFC/png?text=Counter-Strike%202', 'https://placehold.co/1280x720/111827/F8FAFC/png?text=Counter-Strike%202%20preview', '2023-09-27'::date, 'Valve', 'Valve', 8.2, 30, array['Shooter','Competitive','Multiplayer'], array['PC'], array['https://placehold.co/1280x720/475569/F8FAFC/png?text=Dust']),
    ('rocket-league', 'Rocket League', 'A physics-forward sports game where rocket cars turn soccer into aerial reads.', 'https://placehold.co/600x820/0e7490/F8FAFC/png?text=Rocket%20League', 'https://placehold.co/1280x720/1d4ed8/F8FAFC/png?text=Rocket%20League%20preview', '2015-07-07'::date, 'Psyonix', 'Epic Games', 8.5, 25, array['Sports','Competitive','Multiplayer'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/0369a1/F8FAFC/png?text=Arena']),
    ('civilization-vi', 'Civilization VI', 'A turn-based strategy game about expanding through culture, science, diplomacy, and war.', 'https://placehold.co/600x820/854d0e/F8FAFC/png?text=Civilization%20VI', 'https://placehold.co/1280x720/713f12/F8FAFC/png?text=Civilization%20VI%20preview', '2016-10-21'::date, 'Firaxis Games', '2K', 8.7, 45, array['Strategy','4X','Simulation'], array['PC','PlayStation','Xbox','Nintendo Switch','Mobile'], array['https://placehold.co/1280x720/92400e/F8FAFC/png?text=World%20map']),
    ('xcom-2', 'XCOM 2', 'A tactical strategy campaign where risky missions make every soldier decision matter.', 'https://placehold.co/600x820/155e75/F8FAFC/png?text=XCOM%202', 'https://placehold.co/1280x720/0f172a/F8FAFC/png?text=XCOM%202%20preview', '2016-02-05'::date, 'Firaxis Games', '2K', 8.8, 33, array['Strategy','Tactics','Sci-Fi'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/155e75/F8FAFC/png?text=Resistance']),
    ('slay-the-spire', 'Slay the Spire', 'A deck-building roguelike where small card choices become fragile strategies.', 'https://placehold.co/600x820/7c2d12/F8FAFC/png?text=Slay%20the%20Spire', 'https://placehold.co/1280x720/581c87/F8FAFC/png?text=Slay%20the%20Spire%20preview', '2019-01-23'::date, 'Mega Crit', 'Mega Crit', 8.9, 20, array['Card Game','Roguelike','Strategy','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch','Mobile'], array['https://placehold.co/1280x720/9a3412/F8FAFC/png?text=Act%20one']),
    ('dead-cells', 'Dead Cells', 'A stylish action roguelite with sharp movement, fast weapons, and changing routes.', 'https://placehold.co/600x820/be123c/F8FAFC/png?text=Dead%20Cells', 'https://placehold.co/1280x720/881337/F8FAFC/png?text=Dead%20Cells%20preview', '2018-08-07'::date, 'Motion Twin', 'Motion Twin', 8.8, 18, array['Roguelike','Action','Metroidvania','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch','Mobile'], array['https://placehold.co/1280x720/9f1239/F8FAFC/png?text=Prisoners']),
    ('resident-evil-4', 'Resident Evil 4', 'A tense action-horror rescue mission with resource pressure and memorable set pieces.', 'https://placehold.co/600x820/450a0a/F8FAFC/png?text=Resident%20Evil%204', 'https://placehold.co/1280x720/1f2937/F8FAFC/png?text=Resident%20Evil%204%20preview', '2023-03-24'::date, 'Capcom', 'Capcom', 9.2, 16, array['Horror','Action','Adventure'], array['PC','PlayStation','Xbox'], array['https://placehold.co/1280x720/451a03/F8FAFC/png?text=Village']),
    ('animal-crossing-new-horizons', 'Animal Crossing: New Horizons', 'A gentle island life sim about decorating, collecting, and tiny daily routines.', 'https://placehold.co/600x820/0f766e/F8FAFC/png?text=Animal%20Crossing', 'https://placehold.co/1280x720/115e59/F8FAFC/png?text=Animal%20Crossing%20preview', '2020-03-20'::date, 'Nintendo EPD', 'Nintendo', 8.5, 60, array['Simulation','Casual','Creative'], array['Nintendo Switch'], array['https://placehold.co/1280x720/047857/F8FAFC/png?text=Island']),
    ('forza-horizon-5', 'Forza Horizon 5', 'An open-world racing festival with broad car collecting and bright road-trip energy.', 'https://placehold.co/600x820/be123c/F8FAFC/png?text=Forza%20Horizon%205', 'https://placehold.co/1280x720/7c2d12/F8FAFC/png?text=Forza%20Horizon%205%20preview', '2021-11-09'::date, 'Playground Games', 'Xbox Game Studios', 9.0, 25, array['Racing','Open World','Sports'], array['PC','Xbox'], array['https://placehold.co/1280x720/b45309/F8FAFC/png?text=Coastal%20race']),
    ('gran-turismo-7', 'Gran Turismo 7', 'A polished driving sim focused on car history, careful tuning, and clean racing lines.', 'https://placehold.co/600x820/1e40af/F8FAFC/png?text=Gran%20Turismo%207', 'https://placehold.co/1280x720/0f172a/F8FAFC/png?text=Gran%20Turismo%207%20preview', '2022-03-04'::date, 'Polyphony Digital', 'Sony Interactive Entertainment', 8.3, 28, array['Racing','Simulation','Sports'], array['PlayStation'], array['https://placehold.co/1280x720/1d4ed8/F8FAFC/png?text=Track%20day']),
    ('final-fantasy-vii-remake', 'Final Fantasy VII Remake', 'A cinematic action RPG reimagining a classic city escape with flashy combat.', 'https://placehold.co/600x820/312e81/F8FAFC/png?text=Final%20Fantasy%20VII', 'https://placehold.co/1280x720/1e1b4b/F8FAFC/png?text=Final%20Fantasy%20VII%20preview', '2020-04-10'::date, 'Square Enix', 'Square Enix', 8.7, 34, array['JRPG','Action RPG','Narrative'], array['PC','PlayStation'], array['https://placehold.co/1280x720/312e81/F8FAFC/png?text=Midgar']),
    ('apex-legends', 'Apex Legends', 'A squad battle royale with character abilities, fast movement, and team fights.', 'https://placehold.co/600x820/991b1b/F8FAFC/png?text=Apex%20Legends', 'https://placehold.co/1280x720/7f1d1d/F8FAFC/png?text=Apex%20Legends%20preview', '2019-02-04'::date, 'Respawn Entertainment', 'Electronic Arts', 8.4, 25, array['Shooter','Battle Royale','Competitive','Multiplayer'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/b91c1c/F8FAFC/png?text=Drop%20zone']),
    ('fire-emblem-three-houses', 'Fire Emblem: Three Houses', 'A tactical RPG about teaching students, building bonds, and consequential campaigns.', 'https://placehold.co/600x820/4c1d95/F8FAFC/png?text=Fire%20Emblem', 'https://placehold.co/1280x720/312e81/F8FAFC/png?text=Fire%20Emblem%20preview', '2019-07-26'::date, 'Intelligent Systems', 'Nintendo', 8.8, 50, array['Strategy','Tactics','JRPG'], array['Nintendo Switch'], array['https://placehold.co/1280x720/4c1d95/F8FAFC/png?text=Monastery']),
    ('tunic', 'Tunic', 'A compact isometric adventure that hides knowledge in plain sight and trusts players.', 'https://placehold.co/600x820/ca8a04/F8FAFC/png?text=Tunic', 'https://placehold.co/1280x720/854d0e/F8FAFC/png?text=Tunic%20preview', '2022-03-16'::date, 'Isometricorp Games', 'Finji', 8.6, 12, array['Adventure','Puzzle','Indie'], array['PC','PlayStation','Xbox','Nintendo Switch'], array['https://placehold.co/1280x720/a16207/F8FAFC/png?text=Hidden%20path']),
    ('marvels-spider-man-remastered', 'Marvel''s Spider-Man Remastered', 'A superhero action adventure about fluid movement, city patrols, and personal stakes.', 'https://placehold.co/600x820/991b1b/F8FAFC/png?text=Spider-Man', 'https://placehold.co/1280x720/1d4ed8/F8FAFC/png?text=Spider-Man%20preview', '2022-08-12'::date, 'Insomniac Games', 'Sony Interactive Entertainment', 8.7, 17, array['Action','Adventure','Open World'], array['PC','PlayStation'], array['https://placehold.co/1280x720/1e40af/F8FAFC/png?text=City%20swing'])
)
insert into public.games (
  provider,
  provider_game_id,
  slug,
  title,
  description,
  cover_image_url,
  background_image_url,
  release_date,
  developer,
  publisher,
  external_rating,
  estimated_playtime,
  metadata
)
select
  'seed',
  slug,
  slug,
  title,
  description,
  cover_image_url,
  background_image_url,
  release_date,
  developer,
  publisher,
  external_rating,
  estimated_playtime,
  jsonb_build_object(
    'genres', genres,
    'platforms', platforms,
    'screenshots', screenshots
  )
from seeded_games
on conflict (provider, provider_game_id) do update set
  title = excluded.title,
  description = excluded.description,
  cover_image_url = excluded.cover_image_url,
  background_image_url = excluded.background_image_url,
  release_date = excluded.release_date,
  developer = excluded.developer,
  publisher = excluded.publisher,
  external_rating = excluded.external_rating,
  estimated_playtime = excluded.estimated_playtime,
  metadata = excluded.metadata;

with artwork(slug, cover_image_url, background_image_url) as (
  values
    ('the-witcher-3-wild-hunt', 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_hero.jpg'),
    ('red-dead-redemption-2', 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_hero.jpg'),
    ('hades', 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/library_hero.jpg'),
    ('celeste', 'https://cdn.akamai.steamstatic.com/steam/apps/504230/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/504230/library_hero.jpg'),
    ('elden-ring', 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_hero.jpg'),
    ('baldurs-gate-3', 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/library_hero.jpg'),
    ('stardew-valley', 'https://cdn.akamai.steamstatic.com/steam/apps/413150/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/413150/library_hero.jpg'),
    ('hollow-knight', 'https://cdn.akamai.steamstatic.com/steam/apps/367520/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/367520/library_hero.jpg'),
    ('disco-elysium', 'https://cdn.akamai.steamstatic.com/steam/apps/632470/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/632470/library_hero.jpg'),
    ('god-of-war', 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/library_hero.jpg'),
    ('the-legend-of-zelda-breath-of-the-wild', 'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg', 'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg'),
    ('persona-5-royal', 'https://cdn.akamai.steamstatic.com/steam/apps/1687950/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1687950/library_hero.jpg'),
    ('mass-effect-legendary-edition', 'https://cdn.akamai.steamstatic.com/steam/apps/1328670/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1328670/library_hero.jpg'),
    ('portal-2', 'https://cdn.akamai.steamstatic.com/steam/apps/620/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/620/library_hero.jpg'),
    ('outer-wilds', 'https://cdn.akamai.steamstatic.com/steam/apps/753640/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/753640/library_hero.jpg'),
    ('minecraft', 'https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/About-Minecraft_Featured-Image-0_570x321.jpg', 'https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/About-Minecraft_Featured-Image-0_570x321.jpg'),
    ('fortnite', 'https://image.api.playstation.com/vulcan/ap/rnd/202607/1420/1183293e02fd8324f72b20eab7632e1632a41528e9ac5c86.png', 'https://image.api.playstation.com/vulcan/ap/rnd/202607/1420/1183293e02fd8324f72b20eab7632e1632a41528e9ac5c86.png'),
    ('counter-strike-2', 'https://cdn.akamai.steamstatic.com/steam/apps/730/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/730/library_hero.jpg'),
    ('rocket-league', 'https://cdn.akamai.steamstatic.com/steam/apps/252950/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/252950/library_hero.jpg'),
    ('civilization-vi', 'https://cdn.akamai.steamstatic.com/steam/apps/289070/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/289070/library_hero.jpg'),
    ('xcom-2', 'https://cdn.akamai.steamstatic.com/steam/apps/268500/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/268500/library_hero.jpg'),
    ('slay-the-spire', 'https://cdn.akamai.steamstatic.com/steam/apps/646570/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/646570/library_hero.jpg'),
    ('dead-cells', 'https://cdn.akamai.steamstatic.com/steam/apps/588650/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/588650/library_hero.jpg'),
    ('resident-evil-4', 'https://cdn.akamai.steamstatic.com/steam/apps/2050650/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/2050650/library_hero.jpg'),
    ('animal-crossing-new-horizons', 'https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg', 'https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg'),
    ('forza-horizon-5', 'https://cdn.akamai.steamstatic.com/steam/apps/1551360/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1551360/library_hero.jpg'),
    ('gran-turismo-7', 'https://upload.wikimedia.org/wikipedia/en/1/14/Gran_Turismo_7_cover_art.jpg', 'https://upload.wikimedia.org/wikipedia/en/1/14/Gran_Turismo_7_cover_art.jpg'),
    ('final-fantasy-vii-remake', 'https://cdn.akamai.steamstatic.com/steam/apps/1462040/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1462040/library_hero.jpg'),
    ('apex-legends', 'https://cdn.akamai.steamstatic.com/steam/apps/1172470/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1172470/library_hero.jpg'),
    ('fire-emblem-three-houses', 'https://upload.wikimedia.org/wikipedia/en/1/16/Fire_Emblem_Three_Houses.jpg', 'https://upload.wikimedia.org/wikipedia/en/1/16/Fire_Emblem_Three_Houses.jpg'),
    ('tunic', 'https://cdn.akamai.steamstatic.com/steam/apps/553420/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/553420/library_hero.jpg'),
    ('marvels-spider-man-remastered', 'https://cdn.akamai.steamstatic.com/steam/apps/1817070/library_600x900_2x.jpg', 'https://cdn.akamai.steamstatic.com/steam/apps/1817070/library_hero.jpg')
)
update public.games
set
  cover_image_url = artwork.cover_image_url,
  background_image_url = artwork.background_image_url,
  metadata = jsonb_set(
    metadata,
    '{screenshots}',
    jsonb_build_array(artwork.background_image_url),
    true
  )
from artwork
where public.games.provider = 'seed'
  and public.games.slug = artwork.slug;

insert into public.genres (name, slug)
select distinct
  genre,
  trim(both '-' from regexp_replace(lower(genre), '[^a-z0-9]+', '-', 'g'))
from public.games
cross join lateral jsonb_array_elements_text(metadata -> 'genres') as genre
where provider = 'seed'
on conflict (slug) do nothing;

insert into public.platforms (name, slug)
select distinct
  platform,
  trim(both '-' from regexp_replace(lower(platform), '[^a-z0-9]+', '-', 'g'))
from public.games
cross join lateral jsonb_array_elements_text(metadata -> 'platforms') as platform
where provider = 'seed'
on conflict (slug) do nothing;

insert into public.game_genres (game_id, genre_id)
select games.id, genres.id
from public.games
cross join lateral jsonb_array_elements_text(games.metadata -> 'genres') as genre_name
join public.genres on genres.name = genre_name
where games.provider = 'seed'
on conflict (game_id, genre_id) do nothing;

insert into public.game_platforms (game_id, platform_id)
select games.id, platforms.id
from public.games
cross join lateral jsonb_array_elements_text(games.metadata -> 'platforms') as platform_name
join public.platforms on platforms.name = platform_name
where games.provider = 'seed'
on conflict (game_id, platform_id) do nothing;
