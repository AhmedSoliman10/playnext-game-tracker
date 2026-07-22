import type { GameDetails } from "@/lib/games/types";
import { slugify } from "@/lib/utils";

const steamAppIdsByTitle: Record<string, string> = {
  "The Witcher 3": "292030",
  "Red Dead Redemption 2": "1174180",
  Hades: "1145360",
  Celeste: "504230",
  "Elden Ring": "1245620",
  "Baldur's Gate 3": "1086940",
  "Stardew Valley": "413150",
  "Hollow Knight": "367520",
  "Disco Elysium": "632470",
  "God of War": "1593500",
  "Persona 5 Royal": "1687950",
  "Mass Effect": "1328670",
  "Portal 2": "620",
  "Outer Wilds": "753640",
  "Counter-Strike 2": "730",
  "Rocket League": "252950",
  "Civilization VI": "289070",
  "XCOM 2": "268500",
  "Slay the Spire": "646570",
  "Dead Cells": "588650",
  "Resident Evil 4": "2050650",
  "Forza Horizon 5": "1551360",
  "Final Fantasy VII": "1462040",
  "Apex Legends": "1172470",
  Tunic: "553420",
  "Spider-Man": "1817070",
};

const customArtworkByTitle: Record<
  string,
  { cover: string; background: string }
> = {
  "Breath of the Wild": {
    cover:
      "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg",
    background:
      "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg",
  },
  Minecraft: {
    cover:
      "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/About-Minecraft_Featured-Image-0_570x321.jpg",
    background:
      "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/About-Minecraft_Featured-Image-0_570x321.jpg",
  },
  Fortnite: {
    cover:
      "https://image.api.playstation.com/vulcan/ap/rnd/202607/1420/1183293e02fd8324f72b20eab7632e1632a41528e9ac5c86.png",
    background:
      "https://image.api.playstation.com/vulcan/ap/rnd/202607/1420/1183293e02fd8324f72b20eab7632e1632a41528e9ac5c86.png",
  },
  "Animal Crossing": {
    cover:
      "https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg",
    background:
      "https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg",
  },
  "Gran Turismo 7": {
    cover:
      "https://upload.wikimedia.org/wikipedia/en/1/14/Gran_Turismo_7_cover_art.jpg",
    background:
      "https://upload.wikimedia.org/wikipedia/en/1/14/Gran_Turismo_7_cover_art.jpg",
  },
  "Fire Emblem": {
    cover:
      "https://upload.wikimedia.org/wikipedia/en/1/16/Fire_Emblem_Three_Houses.jpg",
    background:
      "https://upload.wikimedia.org/wikipedia/en/1/16/Fire_Emblem_Three_Houses.jpg",
  },
};

function getArtwork(title: string) {
  const appId = steamAppIdsByTitle[title];
  if (appId) {
    return {
      cover: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
      background: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
    };
  }

  return customArtworkByTitle[title];
}

function cover(title: string, accent: string) {
  return (
    getArtwork(title)?.cover ??
    `https://placehold.co/600x820/${accent}/F8FAFC/png?text=${encodeURIComponent(title)}`
  );
}

function backdrop(title: string, accent: string) {
  return (
    getArtwork(title)?.background ??
    `https://placehold.co/1280x720/${accent}/F8FAFC/png?text=${encodeURIComponent(`${title} preview`)}`
  );
}

function makeGame(
  game: Omit<GameDetails, "id" | "provider" | "providerGameId" | "slug"> & {
    slug?: string;
  },
): GameDetails {
  const slug = game.slug ?? slugify(game.title);
  return {
    ...game,
    id: slug,
    provider: "seed",
    providerGameId: slug,
    slug,
  };
}

export const seedGames: GameDetails[] = [
  makeGame({
    title: "The Witcher 3: Wild Hunt",
    description:
      "A sweeping fantasy RPG about contracts, consequences, and a monster hunter searching through a war-torn world.",
    coverImageUrl: cover("The Witcher 3", "1f2937"),
    backgroundImageUrl: backdrop("The Witcher 3", "172554"),
    releaseDate: "2015-05-19",
    genres: ["RPG", "Open World", "Adventure"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    externalRating: 9.2,
    estimatedPlaytime: 55,
    screenshots: [backdrop("Velen", "064e3b"), backdrop("Skellige", "0f172a")],
    metadata: { mood: "expansive", pace: "methodical" },
  }),
  makeGame({
    title: "Red Dead Redemption 2",
    description:
      "A character-driven western journey with slow-burn drama, open country, and systems that reward patience.",
    coverImageUrl: cover("Red Dead Redemption 2", "7f1d1d"),
    backgroundImageUrl: backdrop("Red Dead Redemption 2", "451a03"),
    releaseDate: "2018-10-26",
    genres: ["Adventure", "Open World", "Action"],
    platforms: ["PC", "PlayStation", "Xbox"],
    developer: "Rockstar Studios",
    publisher: "Rockstar Games",
    externalRating: 9.4,
    estimatedPlaytime: 50,
    screenshots: [
      backdrop("Frontier camp", "713f12"),
      backdrop("Snow trail", "1e293b"),
    ],
    metadata: { mood: "cinematic", pace: "slow" },
  }),
  makeGame({
    title: "Hades",
    description:
      "A fast roguelike action game where each escape attempt builds sharper skills and warmer family drama.",
    coverImageUrl: cover("Hades", "7c2d12"),
    backgroundImageUrl: backdrop("Hades", "581c87"),
    releaseDate: "2020-09-17",
    genres: ["Roguelike", "Action", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Supergiant Games",
    publisher: "Supergiant Games",
    externalRating: 9.1,
    estimatedPlaytime: 22,
    screenshots: [
      backdrop("House of Hades", "4c0519"),
      backdrop("Asphodel", "991b1b"),
    ],
    metadata: { mood: "energetic", pace: "fast" },
  }),
  makeGame({
    title: "Celeste",
    description:
      "A precise mountain-climbing platformer that turns difficult jumps into a story about persistence.",
    coverImageUrl: cover("Celeste", "1e3a8a"),
    backgroundImageUrl: backdrop("Celeste", "831843"),
    releaseDate: "2018-01-25",
    genres: ["Platformer", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Maddy Makes Games",
    publisher: "Maddy Makes Games",
    externalRating: 8.9,
    estimatedPlaytime: 8,
    screenshots: [
      backdrop("Summit climb", "075985"),
      backdrop("Mirror temple", "581c87"),
    ],
    metadata: { mood: "heartfelt", pace: "precise" },
  }),
  makeGame({
    title: "Elden Ring",
    description:
      "A dark fantasy action RPG built around discovery, difficult fights, and strange corners of a broken kingdom.",
    coverImageUrl: cover("Elden Ring", "3f3f46"),
    backgroundImageUrl: backdrop("Elden Ring", "365314"),
    releaseDate: "2022-02-25",
    genres: ["Action RPG", "Open World"],
    platforms: ["PC", "PlayStation", "Xbox"],
    developer: "FromSoftware",
    publisher: "Bandai Namco",
    externalRating: 9.5,
    estimatedPlaytime: 60,
    screenshots: [
      backdrop("Limgrave", "14532d"),
      backdrop("Legacy dungeon", "1f2937"),
    ],
    metadata: { mood: "mysterious", pace: "challenging" },
  }),
  makeGame({
    title: "Baldur's Gate 3",
    description:
      "A party-based RPG where dice rolls, dialogue, and bold experiments can reshape an entire campaign.",
    coverImageUrl: cover("Baldur's Gate 3", "4c1d95"),
    backgroundImageUrl: backdrop("Baldur's Gate 3", "312e81"),
    releaseDate: "2023-08-03",
    genres: ["RPG", "Strategy", "Adventure"],
    platforms: ["PC", "PlayStation", "Xbox"],
    developer: "Larian Studios",
    publisher: "Larian Studios",
    externalRating: 9.6,
    estimatedPlaytime: 75,
    screenshots: [
      backdrop("Camp conversation", "581c87"),
      backdrop("Tactical battle", "3730a3"),
    ],
    metadata: { mood: "reactive", pace: "deliberate" },
  }),
  makeGame({
    title: "Stardew Valley",
    description:
      "A cozy farming life sim about rebuilding a homestead, making friends, and finding a daily rhythm.",
    coverImageUrl: cover("Stardew Valley", "166534"),
    backgroundImageUrl: backdrop("Stardew Valley", "14532d"),
    releaseDate: "2016-02-26",
    genres: ["Simulation", "RPG", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"],
    developer: "ConcernedApe",
    publisher: "ConcernedApe",
    externalRating: 9.0,
    estimatedPlaytime: 50,
    screenshots: [
      backdrop("Spring farm", "15803d"),
      backdrop("Town festival", "854d0e"),
    ],
    metadata: { mood: "cozy", pace: "relaxed" },
  }),
  makeGame({
    title: "Hollow Knight",
    description:
      "A hand-drawn metroidvania filled with quiet ruins, demanding bosses, and secrets that reward curiosity.",
    coverImageUrl: cover("Hollow Knight", "0f172a"),
    backgroundImageUrl: backdrop("Hollow Knight", "111827"),
    releaseDate: "2017-02-24",
    genres: ["Metroidvania", "Action", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Team Cherry",
    publisher: "Team Cherry",
    externalRating: 9.0,
    estimatedPlaytime: 27,
    screenshots: [
      backdrop("Forgotten Crossroads", "1e293b"),
      backdrop("Greenpath", "064e3b"),
    ],
    metadata: { mood: "lonely", pace: "exploratory" },
  }),
  makeGame({
    title: "Disco Elysium",
    description:
      "A detective RPG about identity, politics, and internal voices arguing through every decision.",
    coverImageUrl: cover("Disco Elysium", "7f1d1d"),
    backgroundImageUrl: backdrop("Disco Elysium", "1f2937"),
    releaseDate: "2019-10-15",
    genres: ["RPG", "Narrative", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "ZA/UM",
    publisher: "ZA/UM",
    externalRating: 9.1,
    estimatedPlaytime: 25,
    screenshots: [
      backdrop("Whirling-in-Rags", "713f12"),
      backdrop("Revachol streets", "334155"),
    ],
    metadata: { mood: "literary", pace: "slow" },
  }),
  makeGame({
    title: "God of War",
    description:
      "A mythic action adventure that pairs weighty combat with a focused father-and-son journey.",
    coverImageUrl: cover("God of War", "1e40af"),
    backgroundImageUrl: backdrop("God of War", "0c4a6e"),
    releaseDate: "2018-04-20",
    genres: ["Action", "Adventure"],
    platforms: ["PC", "PlayStation"],
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    externalRating: 9.3,
    estimatedPlaytime: 21,
    screenshots: [
      backdrop("Lake of Nine", "164e63"),
      backdrop("Forest fight", "1e293b"),
    ],
    metadata: { mood: "mythic", pace: "focused" },
  }),
  makeGame({
    title: "The Legend of Zelda: Breath of the Wild",
    description:
      "An open-air adventure that turns physics, terrain, and curiosity into the main quest.",
    coverImageUrl: cover("Breath of the Wild", "065f46"),
    backgroundImageUrl: backdrop("Breath of the Wild", "166534"),
    releaseDate: "2017-03-03",
    genres: ["Adventure", "Open World", "Action"],
    platforms: ["Nintendo Switch"],
    developer: "Nintendo EPD",
    publisher: "Nintendo",
    externalRating: 9.5,
    estimatedPlaytime: 50,
    screenshots: [
      backdrop("Great Plateau", "14532d"),
      backdrop("Hyrule sunset", "92400e"),
    ],
    metadata: { mood: "curious", pace: "open" },
  }),
  makeGame({
    title: "Persona 5 Royal",
    description:
      "A stylish JRPG about school days, supernatural heists, and bonds that power turn-based battles.",
    coverImageUrl: cover("Persona 5 Royal", "991b1b"),
    backgroundImageUrl: backdrop("Persona 5 Royal", "450a0a"),
    releaseDate: "2019-10-31",
    genres: ["JRPG", "RPG", "Social Sim"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "P-Studio",
    publisher: "Atlus",
    externalRating: 9.2,
    estimatedPlaytime: 100,
    screenshots: [
      backdrop("Tokyo night", "7f1d1d"),
      backdrop("Palace", "1f2937"),
    ],
    metadata: { mood: "stylish", pace: "longform" },
  }),
  makeGame({
    title: "Mass Effect Legendary Edition",
    description:
      "A remastered sci-fi trilogy about crew loyalty, galaxy-scale choices, and third-person combat.",
    coverImageUrl: cover("Mass Effect", "1e3a8a"),
    backgroundImageUrl: backdrop("Mass Effect", "0f172a"),
    releaseDate: "2021-05-14",
    genres: ["RPG", "Sci-Fi", "Action"],
    platforms: ["PC", "PlayStation", "Xbox"],
    developer: "BioWare",
    publisher: "Electronic Arts",
    externalRating: 8.8,
    estimatedPlaytime: 95,
    screenshots: [
      backdrop("Normandy", "1d4ed8"),
      backdrop("Citadel", "312e81"),
    ],
    metadata: { mood: "heroic", pace: "cinematic" },
  }),
  makeGame({
    title: "Portal 2",
    description:
      "A clever first-person puzzle comedy about momentum, portals, and suspiciously confident machinery.",
    coverImageUrl: cover("Portal 2", "0e7490"),
    backgroundImageUrl: backdrop("Portal 2", "155e75"),
    releaseDate: "2011-04-19",
    genres: ["Puzzle", "Comedy"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Valve",
    publisher: "Valve",
    externalRating: 9.4,
    estimatedPlaytime: 9,
    screenshots: [
      backdrop("Test chamber", "0369a1"),
      backdrop("Facility ruins", "1f2937"),
    ],
    metadata: { mood: "witty", pace: "compact" },
  }),
  makeGame({
    title: "Outer Wilds",
    description:
      "A time-loop mystery about exploring a tiny solar system and understanding how its pieces fit.",
    coverImageUrl: cover("Outer Wilds", "7c2d12"),
    backgroundImageUrl: backdrop("Outer Wilds", "0f172a"),
    releaseDate: "2019-05-28",
    genres: ["Adventure", "Puzzle", "Exploration"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Mobius Digital",
    publisher: "Annapurna Interactive",
    externalRating: 9.0,
    estimatedPlaytime: 16,
    screenshots: [
      backdrop("Timber Hearth", "92400e"),
      backdrop("Brittle Hollow", "1e293b"),
    ],
    metadata: { mood: "wonder", pace: "curious" },
  }),
  makeGame({
    title: "Minecraft",
    description:
      "A block-building survival sandbox where creative plans and improvised adventures share the same world.",
    coverImageUrl: cover("Minecraft", "15803d"),
    backgroundImageUrl: backdrop("Minecraft", "166534"),
    releaseDate: "2011-11-18",
    genres: ["Sandbox", "Survival", "Creative"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"],
    developer: "Mojang Studios",
    publisher: "Xbox Game Studios",
    externalRating: 8.7,
    estimatedPlaytime: 80,
    screenshots: [
      backdrop("Starter base", "3f6212"),
      backdrop("Cavern", "1f2937"),
    ],
    metadata: { mood: "creative", pace: "self-directed" },
  }),
  makeGame({
    title: "Fortnite",
    description:
      "A fast multiplayer action platform with building, rotating events, and competitive battle royale matches.",
    coverImageUrl: cover("Fortnite", "1d4ed8"),
    backgroundImageUrl: backdrop("Fortnite", "6d28d9"),
    releaseDate: "2017-07-21",
    genres: ["Shooter", "Battle Royale", "Multiplayer"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"],
    developer: "Epic Games",
    publisher: "Epic Games",
    externalRating: 8.0,
    estimatedPlaytime: 20,
    screenshots: [
      backdrop("Island drop", "2563eb"),
      backdrop("Final circle", "7e22ce"),
    ],
    metadata: { mood: "competitive", pace: "fast" },
  }),
  makeGame({
    title: "Counter-Strike 2",
    description:
      "A tactical team shooter where precision, utility, and calm decisions decide short high-stakes rounds.",
    coverImageUrl: cover("Counter-Strike 2", "334155"),
    backgroundImageUrl: backdrop("Counter-Strike 2", "111827"),
    releaseDate: "2023-09-27",
    genres: ["Shooter", "Competitive", "Multiplayer"],
    platforms: ["PC"],
    developer: "Valve",
    publisher: "Valve",
    externalRating: 8.2,
    estimatedPlaytime: 30,
    screenshots: [
      backdrop("Dust angle", "475569"),
      backdrop("Utility lineups", "0f172a"),
    ],
    metadata: { mood: "tense", pace: "fast" },
  }),
  makeGame({
    title: "Rocket League",
    description:
      "A physics-forward sports game where rocket cars turn soccer into aerial reads and last-second saves.",
    coverImageUrl: cover("Rocket League", "0e7490"),
    backgroundImageUrl: backdrop("Rocket League", "1d4ed8"),
    releaseDate: "2015-07-07",
    genres: ["Sports", "Competitive", "Multiplayer"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Psyonix",
    publisher: "Epic Games",
    externalRating: 8.5,
    estimatedPlaytime: 25,
    screenshots: [
      backdrop("Arena kickoff", "0369a1"),
      backdrop("Aerial shot", "1e40af"),
    ],
    metadata: { mood: "kinetic", pace: "fast" },
  }),
  makeGame({
    title: "Civilization VI",
    description:
      "A turn-based strategy game about expanding an empire through culture, science, diplomacy, and war.",
    coverImageUrl: cover("Civilization VI", "854d0e"),
    backgroundImageUrl: backdrop("Civilization VI", "713f12"),
    releaseDate: "2016-10-21",
    genres: ["Strategy", "4X", "Simulation"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"],
    developer: "Firaxis Games",
    publisher: "2K",
    externalRating: 8.7,
    estimatedPlaytime: 45,
    screenshots: [
      backdrop("World map", "92400e"),
      backdrop("City planning", "365314"),
    ],
    metadata: { mood: "strategic", pace: "turn-based" },
  }),
  makeGame({
    title: "XCOM 2",
    description:
      "A tactical strategy campaign where risky missions and wounded soldiers make every decision feel personal.",
    coverImageUrl: cover("XCOM 2", "155e75"),
    backgroundImageUrl: backdrop("XCOM 2", "0f172a"),
    releaseDate: "2016-02-05",
    genres: ["Strategy", "Tactics", "Sci-Fi"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Firaxis Games",
    publisher: "2K",
    externalRating: 8.8,
    estimatedPlaytime: 33,
    screenshots: [
      backdrop("Resistance base", "155e75"),
      backdrop("Tactical grid", "1e293b"),
    ],
    metadata: { mood: "tense", pace: "turn-based" },
  }),
  makeGame({
    title: "Slay the Spire",
    description:
      "A deck-building roguelike where small card choices compound into thrilling, fragile strategies.",
    coverImageUrl: cover("Slay the Spire", "7c2d12"),
    backgroundImageUrl: backdrop("Slay the Spire", "581c87"),
    releaseDate: "2019-01-23",
    genres: ["Card Game", "Roguelike", "Strategy", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"],
    developer: "Mega Crit",
    publisher: "Mega Crit",
    externalRating: 8.9,
    estimatedPlaytime: 20,
    screenshots: [
      backdrop("Act one", "9a3412"),
      backdrop("Deck screen", "4c1d95"),
    ],
    metadata: { mood: "clever", pace: "repeatable" },
  }),
  makeGame({
    title: "Dead Cells",
    description:
      "A stylish action roguelite with sharp movement, fast weapons, and routes that keep changing.",
    coverImageUrl: cover("Dead Cells", "be123c"),
    backgroundImageUrl: backdrop("Dead Cells", "881337"),
    releaseDate: "2018-08-07",
    genres: ["Roguelike", "Action", "Metroidvania", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"],
    developer: "Motion Twin",
    publisher: "Motion Twin",
    externalRating: 8.8,
    estimatedPlaytime: 18,
    screenshots: [
      backdrop("Prisoners' Quarters", "9f1239"),
      backdrop("Clock Tower", "0f172a"),
    ],
    metadata: { mood: "sharp", pace: "fast" },
  }),
  makeGame({
    title: "Resident Evil 4",
    description:
      "A tense action-horror rescue mission with careful resource pressure and memorable set pieces.",
    coverImageUrl: cover("Resident Evil 4", "450a0a"),
    backgroundImageUrl: backdrop("Resident Evil 4", "1f2937"),
    releaseDate: "2023-03-24",
    genres: ["Horror", "Action", "Adventure"],
    platforms: ["PC", "PlayStation", "Xbox"],
    developer: "Capcom",
    publisher: "Capcom",
    externalRating: 9.2,
    estimatedPlaytime: 16,
    screenshots: [backdrop("Village", "451a03"), backdrop("Castle", "111827")],
    metadata: { mood: "tense", pace: "focused" },
  }),
  makeGame({
    title: "Animal Crossing: New Horizons",
    description:
      "A gentle island life sim about decorating, collecting, and sharing tiny routines with neighbors.",
    coverImageUrl: cover("Animal Crossing", "0f766e"),
    backgroundImageUrl: backdrop("Animal Crossing", "115e59"),
    releaseDate: "2020-03-20",
    genres: ["Simulation", "Casual", "Creative"],
    platforms: ["Nintendo Switch"],
    developer: "Nintendo EPD",
    publisher: "Nintendo",
    externalRating: 8.5,
    estimatedPlaytime: 60,
    screenshots: [
      backdrop("Island morning", "047857"),
      backdrop("Home design", "0e7490"),
    ],
    metadata: { mood: "cozy", pace: "daily" },
  }),
  makeGame({
    title: "Forza Horizon 5",
    description:
      "An open-world racing festival with broad car collecting, generous events, and bright road-trip energy.",
    coverImageUrl: cover("Forza Horizon 5", "be123c"),
    backgroundImageUrl: backdrop("Forza Horizon 5", "7c2d12"),
    releaseDate: "2021-11-09",
    genres: ["Racing", "Open World", "Sports"],
    platforms: ["PC", "Xbox"],
    developer: "Playground Games",
    publisher: "Xbox Game Studios",
    externalRating: 9.0,
    estimatedPlaytime: 25,
    screenshots: [
      backdrop("Coastal race", "b45309"),
      backdrop("Festival stage", "be123c"),
    ],
    metadata: { mood: "sunny", pace: "flexible" },
  }),
  makeGame({
    title: "Gran Turismo 7",
    description:
      "A polished driving sim focused on car history, careful tuning, and clean racing lines.",
    coverImageUrl: cover("Gran Turismo 7", "1e40af"),
    backgroundImageUrl: backdrop("Gran Turismo 7", "0f172a"),
    releaseDate: "2022-03-04",
    genres: ["Racing", "Simulation", "Sports"],
    platforms: ["PlayStation"],
    developer: "Polyphony Digital",
    publisher: "Sony Interactive Entertainment",
    externalRating: 8.3,
    estimatedPlaytime: 28,
    screenshots: [
      backdrop("Track day", "1d4ed8"),
      backdrop("Garage", "334155"),
    ],
    metadata: { mood: "technical", pace: "measured" },
  }),
  makeGame({
    title: "Final Fantasy VII Remake",
    description:
      "A cinematic action RPG reimagining a classic city escape with character drama and flashy combat.",
    coverImageUrl: cover("Final Fantasy VII", "312e81"),
    backgroundImageUrl: backdrop("Final Fantasy VII", "1e1b4b"),
    releaseDate: "2020-04-10",
    genres: ["JRPG", "Action RPG", "Narrative"],
    platforms: ["PC", "PlayStation"],
    developer: "Square Enix",
    publisher: "Square Enix",
    externalRating: 8.7,
    estimatedPlaytime: 34,
    screenshots: [
      backdrop("Midgar sector", "312e81"),
      backdrop("Boss battle", "7f1d1d"),
    ],
    metadata: { mood: "dramatic", pace: "cinematic" },
  }),
  makeGame({
    title: "Apex Legends",
    description:
      "A squad battle royale with character abilities, fast movement, and team fights that reward communication.",
    coverImageUrl: cover("Apex Legends", "991b1b"),
    backgroundImageUrl: backdrop("Apex Legends", "7f1d1d"),
    releaseDate: "2019-02-04",
    genres: ["Shooter", "Battle Royale", "Competitive", "Multiplayer"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Respawn Entertainment",
    publisher: "Electronic Arts",
    externalRating: 8.4,
    estimatedPlaytime: 25,
    screenshots: [
      backdrop("Drop zone", "b91c1c"),
      backdrop("Squad fight", "1f2937"),
    ],
    metadata: { mood: "competitive", pace: "fast" },
  }),
  makeGame({
    title: "Fire Emblem: Three Houses",
    description:
      "A tactical RPG about teaching students, building bonds, and making campaign choices with consequences.",
    coverImageUrl: cover("Fire Emblem", "4c1d95"),
    backgroundImageUrl: backdrop("Fire Emblem", "312e81"),
    releaseDate: "2019-07-26",
    genres: ["Strategy", "Tactics", "JRPG"],
    platforms: ["Nintendo Switch"],
    developer: "Intelligent Systems",
    publisher: "Nintendo",
    externalRating: 8.8,
    estimatedPlaytime: 50,
    screenshots: [
      backdrop("Monastery", "4c1d95"),
      backdrop("Battlefield", "1e293b"),
    ],
    metadata: { mood: "characterful", pace: "turn-based" },
  }),
  makeGame({
    title: "Tunic",
    description:
      "A compact isometric adventure that hides knowledge in plain sight and trusts players to decode it.",
    coverImageUrl: cover("Tunic", "ca8a04"),
    backgroundImageUrl: backdrop("Tunic", "854d0e"),
    releaseDate: "2022-03-16",
    genres: ["Adventure", "Puzzle", "Indie"],
    platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
    developer: "Isometricorp Games",
    publisher: "Finji",
    externalRating: 8.6,
    estimatedPlaytime: 12,
    screenshots: [
      backdrop("Hidden path", "a16207"),
      backdrop("Manual page", "365314"),
    ],
    metadata: { mood: "secretive", pace: "compact" },
  }),
  makeGame({
    title: "Marvel's Spider-Man Remastered",
    description:
      "A superhero action adventure about fluid movement, city patrols, and personal stakes behind the mask.",
    coverImageUrl: cover("Spider-Man", "991b1b"),
    backgroundImageUrl: backdrop("Spider-Man", "1d4ed8"),
    releaseDate: "2022-08-12",
    genres: ["Action", "Adventure", "Open World"],
    platforms: ["PC", "PlayStation"],
    developer: "Insomniac Games",
    publisher: "Sony Interactive Entertainment",
    externalRating: 8.7,
    estimatedPlaytime: 17,
    screenshots: [
      backdrop("City swing", "1e40af"),
      backdrop("Rooftop fight", "991b1b"),
    ],
    metadata: { mood: "heroic", pace: "energetic" },
  }),
];

export const seedGenres = Array.from(
  new Set(seedGames.flatMap((game) => game.genres)),
).sort();

export const seedPlatforms = Array.from(
  new Set(seedGames.flatMap((game) => game.platforms)),
).sort();
