//Assets for Dot-Hunter
console.log("Assets for Dot Hunter ready.");

LoadSprites = [
  { srcName: "Sprites/Items/Acorn.png", name: "Acorn" },
  { srcName: "Sprites/Items/Apple.png", name: "Apple" },
  { srcName: "Sprites/Items/Banana.png", name: "Banana" },
  { srcName: "Sprites/Items/Cake.png", name: "Cake" },
  { srcName: "Sprites/Items/Cheese.png", name: "Cheese" },
  { srcName: "Sprites/Items/Orange.png", name: "Orange" },
  { srcName: "Sprites/Items/Pear.png", name: "Pear" },
  { srcName: "Sprites/Items/Pineapple.png", name: "Pineapple" },
  { srcName: "Sprites/Items/Ring.png", name: "Ring" },
  { srcName: "Sprites/Items/Strawberry.png", name: "Strawberry" },
  { srcName: "Sprites/Items/Watermelon.png", name: "Watermelon" },
  { srcName: "Sprites/Items/WhiteDot.png", name: "Dot" },
  { srcName: "Sprites/Items/crownPink.png", name: "Crown" },
  { srcName: "Sprites/Items/skull_old.png", name: "Skull" },

  //key
  { srcName: "Sprites/Keys/GoldKey.png", name: "Key" },
];

LoadPacks = [
  { srcName: "/Packs/Hellrat.png", count: 8, name: "DotHunter" },
  { srcName: "/Packs/RedDragon.png", count: 3, name: "Dragon" },
  { srcName: "/Packs/Ghosty.png", count: 4, name: "Ghosty" },
  { srcName: "/Packs/ScaredGhosty.png", count: 4, name: "ScaredGhosty" },
  { srcName: "/Packs/Eyes.png", count: 2, name: "Eyes" },
  { srcName: "/Packs/ScaredUgly.png", count: 4, name: "ScaredUgly" },
  { srcName: "/Packs/Ugly.png", count: 4, name: "Ugly" },
  { srcName: "/Packs/Scary.png", count: 4, name: "Scary" },
  { srcName: "/Packs/ScaredScary.png", count: 4, name: "ScaredScary" },
  { srcName: "/Packs/Floaty.png", count: 12, name: "Floaty" },
  { srcName: "/Packs/ScaredFloaty.png", count: 2, name: "ScaredFloaty" },
];

LoadAudio = [
  { srcName: "death.mp3", name: "Death" },
  { srcName: "UseScroll.mp3", name: "Cheese" },
  { srcName: "Temple.mp3", name: "ClearLevel" },
  { srcName: "Evil laughter.mp3", name: "EvilLaughter" },
  { srcName: "Arise - LaughingSkull.mp3", name: "Title" },
  { srcName: "Waka.mp3", name: "WakaWaka" },
  { srcName: "fight.mp3", name: "Fight" },
  { srcName: "Power up.mp3", name: "Life" },
];

LoadFonts = [
  { srcName: "ArcadeClassic.ttf", name: "Arcade" },
  { srcName: "emulogic.ttf", name: "Emulogic" },
  { srcName: "Adore64.ttf", name: "Adore" },
  { srcName: "AnnieUseYourTelescope.ttf", name: "Annie" }
];

const GREENS = [
  "lightgreen",
  "greenyellow",
  "lawngreen",
  "lime",
  "limegreen",
  "green",
  "forestgreen",
  "darkgreen",
  "forestgreen",
  "green",
  "limegreen",
  "lime",
  "lawngreen",
  "chartreuse",
  "greenyellow",
  "springgreen"
];

//voids for compatiblility with old engine
var LoadTextures = [];
var LoadSequences = [];
var LoadSheets = [];
var LoadRotated = [];
var LoadExtWasm = [];
var ExtendSheetTag = [];
var LoadSheetSequences = [];
