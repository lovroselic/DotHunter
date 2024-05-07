//console.clear();
/////////////////////////////////////////////////
/*

 to do:
    release

 known bugs: 

 */
////////////////////////////////////////////////////
var DEBUG = {};
var INI = {
  SIZEX: 21,
  SIZEY: 16,
  HERO_SPEED: 6,
  DRAGON_SPEED: 8,
  SCORE_DOT: 10,
  SCORE_CHEESE: 50,
  DP_trigger1: 45,
  DP_trigger2: 105,
  BONUS_TIME: 9,
  FLOATY_DISTANCE: 4
};
var PRG = {
  VERSION: "1.01",
  CSS: "color: #0F0",
  NAME: "DOT-HUNTER",
  YEAR: 2020,
  INIT: function () {
    console.log("%c****************************", PRG.CSS);
    console.log(
      `%c${PRG.NAME} ${PRG.VERSION} by Lovro Selic, (c) C00lSch00l ${PRG.YEAR} on ˘${navigator.userAgent}`,
      PRG.CSS
    );
    $("#title").html(PRG.NAME);
    $("#version").html(
      `${PRG.NAME} V${PRG.VERSION} <span style='font-size:14px'>&copy</span> C00lSch00l ${PRG.YEAR}`
    );
    $("input#toggleAbout").val("About " + PRG.NAME);
    $("#about fieldset legend").append(" " + PRG.NAME + " ");

    ENGINE.autostart = true;
    ENGINE.start = PRG.start;
    ENGINE.readyCall = GAME.setup;
    ENGINE.init();
  },
  setup: function () {
    $("#toggleHelp").click(function () {
      $("#help").toggle(400);
    });
    $("#toggleAbout").click(function () {
      $("#about").toggle(400);
    });
  },
  start: function () {
    console.log(`%c${PRG.NAME} started.`, PRG.CSS);
    $(ENGINE.topCanvas).off("mousemove", ENGINE.mouseOver);
    $(ENGINE.topCanvas).off("click", ENGINE.mouseClick);
    $(ENGINE.topCanvas).css("cursor", "");

    //add boxes
    console.log("%cAdding boxes, setting ENGINE ....", PRG.CSS);
    var disableKeys = ["enter", "space"];
    for (let key in disableKeys) ENGINE.disableKey(key);

    ENGINE.gameWIDTH = 48 * 21;
    ENGINE.gameHEIGHT = 48 * 16;
    ENGINE.titleHEIGHT = 48;
    ENGINE.titleWIDTH = ENGINE.gameWIDTH;
    ENGINE.bottomHEIGHT = 40;
    ENGINE.bottomWIDTH = ENGINE.gameWIDTH;
    ENGINE.scoreWIDTH = ENGINE.gameWIDTH;
    ENGINE.scoreHEIGHT = 64;

    ENGINE.checkProximity = false;
    ENGINE.checkIntersection = false;
    ENGINE.setCollisionsafe(49);

    $("#bottom").css(
      "margin-top",
      ENGINE.gameHEIGHT +
        ENGINE.titleHEIGHT +
        ENGINE.bottomHEIGHT +
        ENGINE.scoreHEIGHT
    );

    $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + 4);

    ENGINE.addBOX(
      "TITLE",
      ENGINE.titleWIDTH,
      ENGINE.titleHEIGHT,
      ["title"],
      null
    );
    ENGINE.addBOX(
      "SCORE",
      ENGINE.scoreWIDTH,
      ENGINE.scoreHEIGHT,
      ["score_back", "score", "hiscore"],
      null
    );
    ENGINE.addBOX(
      "ROOM",
      ENGINE.gameWIDTH,
      ENGINE.gameHEIGHT,
      [
        "background",
        "config",
        "animation",
        "actors",
        "text",
        "cover",
        "button",
        "click"
      ],
      null
    );

    ENGINE.addBOX(
      "DOWN",
      ENGINE.bottomWIDTH,
      ENGINE.bottomHEIGHT,
      ["bottom", "bottomText"],
      null
    );

    GAME.titleScreen();
  }
};
var MAP = {};
var HERO = {
  startInit: function () {
    HERO.spriteClass = "DotHunter";
    HERO.asset = ASSET[HERO.spriteClass];
    HERO.actor = new ACTOR(
      HERO.spriteClass,
      HERO.x,
      HERO.y,
      "front",
      HERO.asset
    );
    HERO.dead = false;
    HERO.speed = INI.HERO_SPEED;
    HERO.changeSpeed = INI.HERO_SPEED;
  },
  init: function () {
    HERO.dead = false;
    GRID.gridToSprite(MAP[GAME.level].startPoint, HERO.actor);
    HERO.MoveState = new MoveState(MAP[GAME.level].startPoint);
    HERO.actor.orientation = "front";
    HERO.MoveState.dir = LEFT;
    HERO.actor.refresh();
    HERO.dragon = false;
    HERO.change = null;
    HERO.warning = null;
  },
  draw: function () {
    if (HERO.dead) return;
    ENGINE.spriteDraw(
      "actors",
      HERO.actor.x,
      HERO.actor.y,
      HERO.actor.sprite()
    );
    ENGINE.layersToClear.add("actors");
  },
  move: function () {
    if (HERO.dead) return;
    if (HERO.MoveState.moving) {
      GRID.translateMove(HERO, false, HeroOnFinish);
    } else {
      HERO.changeDirection(HERO.MoveState.dir);
    }
    function HeroOnFinish() {
      HERO.speed = HERO.changeSpeed;
    }
  },
  changeDirection: function (dir) {
    if (HERO.MoveState.moving) return;
    let x = HERO.MoveState.endGrid.x + dir.x;
    let y = HERO.MoveState.endGrid.y + dir.y;
    let next = new Grid(x, y);
    if (MAP[GAME.level].isInRoomOrItsDoors(next, MAP[GAME.level].rooms[0]))
      return;
    if (!GRID.gridIsBlock(next)) {
      HERO.MoveState.next(dir);
    } else {
      if (GRID.outside(next)) {
        HERO.MoveState.endGrid = GRID.toOtherSide(next);
      }
    }
  },
  manage: function () {
    HERO.move();
    HERO.touchConfigItem();
    HERO.collideMonster();
  },
  touchConfigItem: function () {
    let index = GRID.gridToIndex(HERO.MoveState.homeGrid);
    let stuff = MAP[GAME.level].GridMap.map[index];

    if (stuff <= 2) return;
    switch (stuff) {
      case 8:
        MAP[GAME.level].GridMap.map[index] = 0;
        MAP[GAME.level].dots--;
        MAP[GAME.level].dotsPicked++;
        AUDIO.WakaWaka.play();
        GAME.score += INI.SCORE_DOT;
        break;
      case 4:
        MAP[GAME.level].GridMap.map[index] = 0;
        MAP[GAME.level].cheese--;
        AUDIO.Cheese.play();
        GAME.score += INI.SCORE_CHEESE;
        HERO.toDragon();
        break;
      case 18:
        GAME.score += GAME.levelBonus.score;
        TEXTPOOL.pool.push(
          new TextSprite(
            GAME.levelBonus.score,
            GRID.gridToCoord(MAP[GAME.level].bonus),
            "lime",
            150
          )
        );
        GAME.clearBonus();
        break;
    }
    GAME.PAINT.refreshConfig = true;
    TITLE.repaintScore = true;
    if (MAP[GAME.level].dots <= 0 && MAP[GAME.level].cheese <= 0) {
      //console.log("LEVEL", GAME.level, " cleared!");
      GAME.levelEnd();
    }
    if (
      MAP[GAME.level].dotsPicked === INI.DP_trigger1 ||
      MAP[GAME.level].dotsPicked === INI.DP_trigger2
    ) {
      GAME.setBonus();
    }
    if (GAME.score >= GAME.extraLife[0]) {
      GAME.lives++;
      GAME.extraLife.shift();
      TEXTPOOL.pool.push(
        new TextSprite(
          "Extra Life!",
          GRID.gridToCoord(HERO.MoveState.homeGrid),
          "red",
          150,
          20
        )
      );
      AUDIO.Life.play();
    }
  },
  toDragon: function () {
    GAME.monsterEatingBonus = -1;
    let time = LevelTable.dragonTime(GAME.level);
    if (HERO.change) {
      HERO.change.extend(time);
      ENEMY.scare();
    } else {
      HERO.dragon = true;
      HERO.changeSpeed = INI.DRAGON_SPEED;
      HERO.actor.setSpriteClass("Dragon");
      HERO.change = new CountDown("dragon", time, HERO.toFlash);
      ENEMY.scare();
    }
  },
  toFlash: function () {
    HERO.warning = new FrameCounter("Flash", 30, GAME.flashing, HERO.toRat);
  },
  toRat: function () {
    GAME.monsterEatingBonus = -1;
    HERO.dragon = false;
    HERO.changeSpeed = INI.HERO_SPEED;
    HERO.actor.setSpriteClass("DotHunter");
    HERO.change = null;
    ENEMY.calm();
  },
  collideMonster: function () {
    if (HERO.dead) return;
    for (let PL = ENEMY.POOL.length, q = PL - 1; q >= 0; q--) {
      let enemy = ENEMY.POOL[q];
      if (enemy.state === "Dead" || enemy.state === "Cage") continue;
      let hit = GRID.collision(HERO, enemy.MoveState.homeGrid);
      if (hit) {
        if (HERO.dragon && enemy.state === "Flee") {
          GAME.monsterEatingBonus++;
          if (GAME.monsterEatingBonus >= LevelTable.monsterEatingBonus.length) {
            GAME.monsterEatingBonus = LevelTable.monsterEatingBonus.length - 1;
          }
          let bonus = LevelTable.monsterEatingBonus[GAME.monsterEatingBonus];
          TEXTPOOL.pool.push(
            new TextSprite(
              bonus,
              GRID.gridToCoord(enemy.MoveState.homeGrid),
              "yellow",
              150
            )
          );
          GAME.score += bonus;
          enemy.die();
          if (GAME.monsterEatingBonus === 3) {
            GAME.monsterStreak--;
          }
          if (GAME.monsterStreak === 0) {
            GAME.score += 4000;
            TEXTPOOL.pool.push(
              new TextSprite(
                "- 4000 -",
                GRID.gridToCoord(enemy.MoveState.homeGrid),
                "red",
                150,
                20
              )
            );
            AUDIO.Life.play();
          }
        } else {
          ENGINE.GAME.ANIMATION.waitThen(HERO.die);
        }
      }
    }
  },
  die: function () {
    if (HERO.dead) return;
    //console.log("HERO died");
    ENGINE.TIMERS.stop();
    ENGINE.GAME.ANIMATION.stop();
    GAME.CI.reset();
    HERO.dead = true;
    HERO.paintDeath();
    GAME.lives--;
    TITLE.score();
    if (GAME.lives <= 0) {
      //console.log("GAME OVER");
      TITLE.gameOver();
      AUDIO.Death.onended = GAME.end;
      AUDIO.Death.play();
    } else {
      AUDIO.EvilLaughter.onended = GAME.levelContinue;
      AUDIO.EvilLaughter.play();
      ENEMY.calm();
      ENEMY.reset();
    }
  },
  paintDeath: function () {
    ENGINE.clearLayer("actors");
    ENEMY.draw();
    ENGINE.spriteDraw("actors", HERO.actor.x, HERO.actor.y, SPRITE.Skull);
  }
};
var LevelTable = {
  monsterEatingBonus: [200, 400, 800, 1600],
  color: function (level) {
    const Colors = [
      "#0000E0",
      "#0000FF",
      "lime",
      "forestgreen",
      "violet",
      "lightgreen",
      "lawngreen",
      "green",
      "chartreuse",
      "steelblue",
      "fuchsia",
      "blueviolet",
      "indigo",
      "deeppink",
      "darkgray",
      "antiquewhite",
      "chocolate"
    ];
    if (level === 1) {
      return "#0000E0";
    } else {
      return Colors.chooseRandom();
    }
  },
  dragonTime: function (level) {
    let time;
    switch (true) {
      case level < 4:
        time = 7;
        break;
      case level < 7:
        time = 5;
        break;
      case level < 10:
        time = 4;
        break;
      case level < 12:
        time = 3;
        break;
      case level < 13:
        time = 2;
        break;
      case level >= 13:
        time = 1;
        break;
    }
    return time;
  },
  bonus: function (level) {
    const score = [
      100,
      300,
      500,
      700,
      1000,
      1500,
      2000,
      2500,
      3000,
      5000,
      10000,
      20000
    ];
    const fruit = [
      "Apple",
      "Pear",
      "Strawberry",
      "Orange",
      "Banana",
      "Watermelon",
      "Pineapple",
      "Acorn",
      "Cake",
      "Key",
      "Ring",
      "Crown"
    ];
    let LN = fruit.length;
    if (level - 1 >= LN) {
      return { score: score.last(), fruit: fruit.last() };
    } else {
      return { score: score[level - 1], fruit: fruit[level - 1] };
    }
  },
  speed: function (level) {
    let speed;
    switch (true) {
      case level < 2:
        speed = 2;
        break;
      case level < 4:
        speed = 3;
        break;
      case level < 5:
        speed = 4;
        break;
      case level < 7:
        speed = 6;
        break;
      case level >= 10:
        speed = 8;
        break;
    }
    return speed;
  },
  scaredSpeed: function (level) {
    let speed;
    switch (true) {
      case level < 3:
        speed = 2;
        break;
      case level < 4:
        speed = 3;
        break;
      case level < 7:
        speed = 4;
        break;
      case level < 10:
        speed = 6;
        break;
      case level >= 13:
        speed = 8;
        break;
    }
    return speed;
  },
  wander: function (level) {
    let time;
    switch (true) {
      case level < 4:
        time = 7;
        break;
      case level < 7:
        time = 5;
        break;
      case level < 10:
        time = 3;
        break;
      case level >= 10:
        time = 1;
        break;
    }
    return time;
  },
  chase: function (level) {
    let time;
    switch (true) {
      case level < 7:
        time = 20;
        break;
      case level < 10:
        time = 30;
        break;
      case level >= 10:
        time = 1000;
        break;
    }
    return time;
  }
};
var GAME = {
  CSS: "color: orange",
  titleScreen: function () {
    TITLE.startTitle();
  },
  CI: {
    text: ["READY", "SET?", "GO!"],
    reset: function () {
      GAME.CI.start = null;
      GAME.CI.now = null;
    }
  },
  countIn: function () {
    if (!GAME.CI.start) GAME.CI.start = performance.now();
    var delta = Math.floor((performance.now() - GAME.CI.start) / 1000);
    if (delta >= 3) {
      ENGINE.clearLayer("text");
      ENGINE.GAME.ANIMATION.next(GAME.run);
    } else if (delta !== GAME.CI.now) {
      SPEECH.speak(GAME.CI.text[delta]);
      ENGINE.clearLayer("text");
      ENGINE.TEXT.centeredText(
        GAME.CI.text[delta],
        ENGINE.gameHEIGHT / 2 - 144
      );
      GAME.CI.now = delta;
    }
  },
  abort: function () {
    ENGINE.GAME.stopAnimation = true;
    console.error("..... aborting GAME, DEBUG info:");
  },
  start: function () {
    console.log(`%c****************** GAME.start ******************`, GAME.CSS);
    if (AUDIO.Title) {
      AUDIO.Title.pause();
      AUDIO.Title.currentTime = 0;
    }
    AUDIO.WakaWaka.playbackRate = 3.2;
    MAP = {};
    $("#startGame").addClass("hidden");
    $(ENGINE.topCanvas).off("mousemove", ENGINE.mouseOver);
    $(ENGINE.topCanvas).off("click", ENGINE.mouseClick);
    $(ENGINE.topCanvas).css("cursor", "");
    ENGINE.hideMouse();
    GAME.extraLife = SCORE.extraLife.clone();
    ENGINE.GAME.start();
    ENGINE.KEY.on();
    GAME.prepareForRestart();
    GAME.level = 1;
    GAME.levelBonus = null;
    GAME.bonusTimer = null;
    GAME.score = 0;
    GAME.extraLife = SCORE.extraLife.clone();
    GAME.lives = 3;
    ENGINE.INI.ANIMATION_INTERVAL = 16;
    DUNGEON.MAX_ROOM = 3;
    HERO.startInit();
    ENGINE.GAME.ANIMATION.waitThen(GAME.levelStart, 2);
  },
  setBonus: function () {
    if (GAME.bonusTimer !== null) return;
    GAME.bonusTimer = new CountDown("bonus", INI.BONUS_TIME, GAME.clearBonus);
    MAP[GAME.level].GridMap.set(MAP[GAME.level].bonus, 16);
  },
  clearBonus: function () {
    GAME.PAINT.refreshConfig = true;
    GAME.bonusTimer = null;
    MAP[GAME.level].GridMap.clear(MAP[GAME.level].bonus, 16);
  },
  prepareForRestart: function () {
    ENGINE.GAME.ANIMATION.stop();
    ENGINE.clearLayer("text");
    ENGINE.clearLayer("actors");
    ENGINE.clearLayer("background");
    ENGINE.clearLayer("button");
    ENGINE.clearLayer("click");
    ENGINE.clearLayer("bottomText");
    ENGINE.clearLayer("cover");
    ENGINE.clearLayer("animation");
  },
  levelExecute: function () {
    console.log("level", GAME.level, "executes");
    HERO.init();
    GAME.firstFrameDraw(GAME.level);
    const RD = new RenderData("Arcade", 40, "#FFF", "text", "#DDD", 2, 2, 2);
    ENGINE.TEXT.RD = RD;
    ENGINE.GAME.ANIMATION.next(GAME.countIn);
  },
  levelContinue: function () {
    console.log("LEVEL", GAME.level, "continues ...");
    ENGINE.clearLayer("actors");
    ENGINE.TIMERS.start();
    GAME.levelExecute();
  },
  levelStart: function () {
    console.log("starting level", GAME.level);
    ENGINE.clearLayer("text");
    ENGINE.clearLayer("actors");
    ENGINE.clearLayer("background");
    ENGINE.clearLayer("cover");
    ENGINE.clearLayer("animation");
    GAME.initLevel(GAME.level);
    ENEMY.init();
    GAME.levelExecute();
  },
  levelTransition: function () {
    if (ENGINE.GAME.stopAnimation) return;
    let CTX = LAYER.cover;
    CTX.fillStyle = "#000";
    CTX.fillRect(0, 0, ENGINE.gameWIDTH, GAME.TRANS.w);
    CTX.fillRect(
      0,
      ENGINE.gameHEIGHT - GAME.TRANS.w,
      ENGINE.gameWIDTH,
      GAME.TRANS.w
    );
    GAME.TRANS.w += 4;
    if (GAME.TRANS.w > ENGINE.gameHEIGHT / 2) {
      //
      ENGINE.GAME.ANIMATION.stop();
      //
      GAME.nextLevel();
    }
  },
  TRANS: {
    w: 1,
    reset: function () {
      GAME.TRANS.w = 1;
    }
  },
  prepareNextLevel: function () {
    GAME.TRANS.reset();
    ENGINE.clearLayer("actors");
    ENGINE.clearLayer("animation");
    TEXTPOOL.pool.clear();
    GAME.CI.reset();
    HERO.toRat();
    ENGINE.GAME.ANIMATION.next(GAME.levelTransition);
  },
  nextLevel: function () {
    GAME.level++;
    GAME.levelCompleted = false;
    //console.log("creating next level: ", GAME.level);
    ENGINE.GAME.ANIMATION.waitThen(GAME.levelStart, 2);
  },
  levelEnd: function () {
    //console.log("level", GAME.level, "ended.");
    ENGINE.TEXT.centeredText(
      `LEVEL ${GAME.level} CLEARED`,
      ENGINE.gameHEIGHT / 2
    );
    GAME.levelCompleted = true;
    AUDIO.ClearLevel.onended = GAME.prepareNextLevel;
    AUDIO.ClearLevel.play();
    ENGINE.GAME.ANIMATION.stop();
  },
  initLevel: function (level) {
    let t1 = performance.now();
    MAP[level] = new PacDungeon(INI.SIZEX, INI.SIZEY);
    GAME.configureLevel(level);
    console.log(
      "Created pacDungeon: ",
      MAP[level],
      " in ",
      performance.now() - t1,
      " ms."
    );
    MAP[level].pac = PacGrid.gridToPacGrid(MAP[level]);
    ENGINE.PACGRID.configure(16, "background", "#000", LevelTable.color(level));
    GAME.levelBonus = LevelTable.bonus(GAME.level);
    GAME.levelTime = new Timer("Level");
    GAME.monsterEatingBonus = -1;
    GAME.monsterStreak = 4;
  },
  frameDraw: function () {
    ENGINE.clearLayerStack();
    HERO.draw();
    ENEMY.draw();
    if (GAME.PAINT.refreshConfig) GAME.PAINT.config();
    if (TITLE.repaintScore) TITLE.score();
    TEXTPOOL.draw("animation");
  },
  firstFrameDraw: function (level) {
    TITLE.main();
    ENGINE.PACGRID.draw(MAP[level].pac);
    GAME.PAINT.config();
    HERO.draw();
    ENEMY.draw();
  },
  run: function () {
    if (ENGINE.GAME.stopAnimation) return;
    GAME.respond();
    HERO.manage();
    ENEMY.manage();
    ENGINE.TIMERS.update();
    ENGINE.FRAME_COUNTERS.update();
    GAME.frameDraw();
  },
  respond: function () {
    //GAME.respond() template
    if (HERO.dead) return;
    var map = ENGINE.GAME.keymap;

    if (map[ENGINE.KEY.map.A]) {
      ENGINE.GAME.keymap[ENGINE.KEY.map.A] = false; //NO repeat
    }
    if (map[ENGINE.KEY.map.D]) {
      ENGINE.GAME.keymap[ENGINE.KEY.map.D] = false; //NO repeat
    }

    if (map[ENGINE.KEY.map.ctrl]) {
      console.log("CTRL");

      ENGINE.GAME.keymap[ENGINE.KEY.map.ctrl] = false; //NO repeat
    }
    if (map[ENGINE.KEY.map.space]) {
      //console.log("SPACE");
      ENGINE.GAME.keymap[ENGINE.KEY.map.space] = false; //NO repeat
    }

    //single key section
    if (map[ENGINE.KEY.map.left]) {
      HERO.changeDirection(LEFT);
      return;
    }
    if (map[ENGINE.KEY.map.right]) {
      HERO.changeDirection(RIGHT);
      return;
    }
    if (map[ENGINE.KEY.map.up]) {
      HERO.changeDirection(UP);
      return;
    }
    if (map[ENGINE.KEY.map.down]) {
      HERO.changeDirection(DOWN);
      return;
    }

    return;
  },
  setup: function () {
    console.log("%cGAME SETUP started", PRG.CSS);
    $("#buttons").prepend("<input type='button' id='startGame' value='START'>");
    $("#startGame").on("click", GAME.start);
  },
  end: function () {
    console.log("GAME ENDED");
    ENGINE.showMouse();
    GAME.checkScore();
    ENGINE.flattenLayers("config", "background");
    ENGINE.flattenLayers("actors", "background");
    ENGINE.flattenLayers("animation", "background");
    ENGINE.clearLayer("config");
    ENGINE.clearLayer("actors");
    ENGINE.clearLayer("animation");
    TITLE.pressEnter();
    ENGINE.GAME.ANIMATION.next(GAME.endAnimation);
  },
  endAnimation: function () {
    if (ENGINE.GAME.keymap[ENGINE.KEY.map.enter]) {
      ENGINE.GAME.ANIMATION.waitThen(GAME.titleScreen);
    }
    let CTX = LAYER.background;
    let W = CTX.canvas.width;
    let H = CTX.canvas.height;
    const colors = ["#F00", "#E00", "#D00", "#C00"];
    for (let q = 0; q < 10 ** 3; q++) {
      CTX.fillStyle = colors.chooseRandom();
      let x = RND(0, W - 1);
      let y = RND(0, H - 1);
      CTX.pixelAt(x, y, 1);
    }
    CTX.fillStyle = "#000";
    for (let q = 0; q < 10 ** 4; q++) {
      let x = RND(0, W - 1);
      let y = RND(0, H - 1);
      CTX.pixelAt(x, y, 1);
    }
  },
  checkScore: function () {
    console.log(PRG.NAME, "stopped?", !ENGINE.GAME.running);
    SCORE.checkScore(GAME.score);
    SCORE.hiScore();
    TITLE.hiScore();
  },
  configureLevel: function (level) {
    console.log("Configuring level:", level);
    /*
    default map:
    0: nothing
    1: wall
    2: reserved
    4: cheese
    8: dot
    16: bonus
    */

    let topLeft = MAP[level].findFreeCorner(new Grid(1, 1), RIGHT, DOWN);
    MAP[level].GridMap.set(topLeft, 4);
    MAP[level].GridMap.set(topLeft.reflect(MAP[level].symX), 4);
    let bottomLeft = MAP[level].findFreeCorner(
      new Grid(1, MAP[level].maxY),
      RIGHT,
      UP
    );
    MAP[level].GridMap.set(bottomLeft, 4);
    MAP[level].GridMap.set(bottomLeft.reflect(MAP[level].symX), 4);
    MAP[level].cheese = 4;

    //dots
    MAP[level].dots = 0;
    for (let x = MAP[level].minX; x <= MAP[level].maxX; x++) {
      for (let y = MAP[level].minY; y <= MAP[level].maxY; y++) {
        let dot = new Grid(x, y);
        if (MAP[level].isDot(dot)) {
          if (
            !MAP[level].GridMap.check(dot, 2 + 4) &&
            MAP[level].isInAnyRoom(dot) === false
          ) {
            MAP[level].dots++;
            MAP[level].GridMap.set(dot, 8);
          }
        }
      }
    }
    MAP[level].dotsPicked = 0;
  },
  PAINT: {
    refreshConfig: null,
    config: function () {
      ENGINE.clearLayer("config");
      GAME.PAINT.refreshConfig = false;
      let map = MAP[GAME.level].GridMap.map;
      let LN = map.length;
      for (let q = 0; q < LN; q++) {
        if (map[q] === 4) {
          ENGINE.spriteToGrid("config", GRID.indexToGrid(q), SPRITE.Cheese);
          continue;
        }
        if (map[q] === 8) {
          ENGINE.spriteToGrid("config", GRID.indexToGrid(q), SPRITE.Dot);
          continue;
        }
        if (map[q] & 16) {
          ENGINE.spriteToGrid(
            "config",
            GRID.indexToGrid(q),
            SPRITE[GAME.levelBonus.fruit]
          );
          continue;
        }
      }
    }
  },
  generateTitleText: function () {
    let text = `${PRG.NAME} ${
      PRG.VERSION
    }, a game by Lovro Selič, ${"\u00A9"} C00lSch00l ${
      PRG.YEAR
    } . Music: 'Arise' written and performed by LaughingSkull, ${"\u00A9"} 2007 Lovro Selič. `;
    text +=
      "     ENGINE, SPEECH, MAZE and GAME code by Lovro Selič using JavaScript ES7. ";
    text = text.split("").join(String.fromCharCode(8202));
    return text;
  },
  setTitle: function () {
    const text = GAME.generateTitleText();
    const RD = new RenderData("Annie", 16, "lime", "bottomText");
    const SQ = new Square(
      0,
      0,
      LAYER.bottomText.canvas.width,
      LAYER.bottomText.canvas.height
    );
    GAME.movingText = new MovingText(text, 3, RD, SQ);
  },
  runTitle: function () {
    if (ENGINE.GAME.stopAnimation) return;
    GAME.movingText.process();
    GAME.titleFrameDraw();
  },
  titleFrameDraw: function () {
    GAME.movingText.draw();
    GAME.fancyText.draw();
    TITLE.lines();
    TITLE.animateTitleGhosts();
    TITLE.animateTitleRat();
  },
  setFancyText(x, y) {
    const RD = new RenderData("Arcade", 80, "lime", "text", "lime", 5, 5, 6);
    GAME.fancyText = new FancyText(PRG.NAME, x, y, RD, GREENS);
  },
  flashing() {
    if (this.count % 2 === 0) {
      ENEMY.setBrave();
    } else {
      ENEMY.setScared();
    }
  }
};
var TITLE = {
  repaintScore: null,
  main: function () {
    TITLE.title();
    TITLE.bottom();
    TITLE.score();
    TITLE.hiScore();
  },
  title: function () {
    var CTX = LAYER.title;
    TITLE.background();
    var fs = 42;
    CTX.font = fs + "px Annie";
    CTX.textAlign = "center";
    var txt = CTX.measureText(PRG.NAME);
    var x = ENGINE.titleWIDTH / 2;
    var y = Math.floor((ENGINE.titleHEIGHT - fs) / 2) + fs;
    var gx = x - txt.width / 2;
    var gy = y - fs;
    var grad = CTX.createLinearGradient(gx, gy + 10, gx, gy + fs);
    grad.addColorStop("0", "#CCC");
    grad.addColorStop("0.1", "#EEE");
    grad.addColorStop("0.2", "#DDD");
    grad.addColorStop("0.3", "#AAA");
    grad.addColorStop("0.4", "#999");
    grad.addColorStop("0.5", "#666");
    grad.addColorStop("0.6", "#888");
    grad.addColorStop("0.7", "#AAA");
    grad.addColorStop("0.8", "#BBB");
    grad.addColorStop("0.9", "#EEE");
    grad.addColorStop("1", "#CCC");
    GAME.grad = grad;
    CTX.fillStyle = grad;
    CTX.shadowColor = "#cec967";
    CTX.shadowOffsetX = 2;
    CTX.shadowOffsetY = 2;
    CTX.shadowBlur = 3;
    CTX.fillText(PRG.NAME, x, y);
  },
  background: function () {
    var CTX = LAYER.title;
    CTX.fillStyle = "#000";
    CTX.roundRect(
      0,
      0,
      ENGINE.titleWIDTH,
      ENGINE.titleHEIGHT,
      {
        upperLeft: 20,
        upperRight: 20,
        lowerLeft: 0,
        lowerRight: 0
      },
      true,
      true
    );
  },
  bottom: function () {
    var CTX = LAYER.bottom;
    CTX.fillStyle = "#000";
    CTX.roundRect(
      0,
      0,
      ENGINE.bottomWIDTH,
      ENGINE.bottomHEIGHT,
      {
        upperLeft: 0,
        upperRight: 0,
        lowerLeft: 20,
        lowerRight: 20
      },
      true,
      true
    );
    CTX.textAlign = "center";
    var x = ENGINE.bottomWIDTH / 2;
    var y = ENGINE.bottomHEIGHT / 2;
    CTX.font = "12px Consolas";
    CTX.fillStyle = "silver";
    CTX.shadowOffsetX = 2;
    CTX.shadowOffsetY = 2;
    CTX.shadowBlur = 5;
    CTX.shadowColor = "#cec967";
    CTX.fillText("Version " + PRG.VERSION + " by Lovro Selič", x, y);
  },
  bottomBlank: function () {
    var CTX = LAYER.bottom;
    CTX.fillStyle = "#000";
    CTX.roundRect(
      0,
      0,
      ENGINE.bottomWIDTH,
      ENGINE.bottomHEIGHT,
      {
        upperLeft: 0,
        upperRight: 0,
        lowerLeft: 20,
        lowerRight: 20
      },
      true,
      true
    );
  },
  scoreBlank: function () {
    ENGINE.clearLayer("score_back");
    var CTX = LAYER.score_back;
    CTX.fillStyle = "#000";
    CTX.fillRect(0, 0, ENGINE.scoreWIDTH, ENGINE.scoreHEIGHT);
  },
  score: function () {
    ENGINE.clearLayer("score");
    TITLE.repaintScore = false;
    TITLE.scoreBlank();
    let CTX = LAYER.score;
    let fs = 25;
    let y = Math.floor((ENGINE.scoreHEIGHT - fs) / 2) + fs;
    CTX.font = fs + "px Garamond";
    CTX.fillStyle = GAME.grad;
    CTX.shadowColor = "yellow";
    CTX.shadowOffsetX = 1;
    CTX.shadowOffsetY = 1;
    CTX.shadowBlur = 2;
    CTX.textAlign = "left";
    let x = 48;
    let text = `SCORE: ${GAME.score.toString().padStart(6, "0")}`;
    CTX.fillText(text, x, y);
    x = 250;
    text = `LEVEL: ${GAME.level.toString().padStart(2, "0")}`;
    CTX.fillText(text, x, y);
    x = 400;
    ENGINE.draw("score", x, y - 32, SPRITE[GAME.levelBonus.fruit]);
    x = 480;
    text = `LIVES: ${GAME.lives.toString().padStart(2, "0")}`;
    CTX.fillText(text, x, y);
  },
  hiScore: function () {
    ENGINE.clearLayer("hiscore");
    let CTX = LAYER.hiscore;
    let fs = 20;
    let y = Math.floor((ENGINE.scoreHEIGHT - fs) / 2) + fs;
    CTX.font = fs + "px Garamond";
    CTX.fillStyle = GAME.grad;
    CTX.shadowColor = "yellow";
    CTX.shadowOffsetX = 1;
    CTX.shadowOffsetY = 1;
    CTX.shadowBlur = 2;
    CTX.textAlign = "left";
    var x = 666;
    var index = SCORE.SCORE.name[0].indexOf("&nbsp");
    var HS;
    if (index > 0) {
      HS = SCORE.SCORE.name[0].substring(
        0,
        SCORE.SCORE.name[0].indexOf("&nbsp")
      );
    } else {
      HS = SCORE.SCORE.name[0];
    }
    var text =
      "HISCORE: " +
      SCORE.SCORE.value[0].toString().padStart(6, "0") +
      " by " +
      HS;
    CTX.fillText(text, x, y);
  },
  gameOver: function () {
    ENGINE.clearLayer("text");
    var CTX = LAYER.text;
    CTX.textAlign = "center";
    var x = ENGINE.gameWIDTH / 2;
    var y = ENGINE.gameHEIGHT / 2;
    var fs = 64;
    CTX.font = fs + "px Garamond";
    var txt = CTX.measureText("GAME OVER");
    var gx = x - txt.width / 2;
    var gy = y - fs;
    var grad = CTX.createLinearGradient(gx, gy + 10, gx, gy + fs);
    grad.addColorStop("0", "#DDD");
    grad.addColorStop("0.1", "#EEE");
    grad.addColorStop("0.2", "#DDD");
    grad.addColorStop("0.3", "#CCC");
    grad.addColorStop("0.4", "#BBB");
    grad.addColorStop("0.5", "#AAA");
    grad.addColorStop("0.6", "#BBB");
    grad.addColorStop("0.7", "#CCC");
    grad.addColorStop("0.8", "#DDD");
    grad.addColorStop("0.9", "#EEE");
    grad.addColorStop("1", "#DDD");
    CTX.fillStyle = grad;
    CTX.shadowColor = "#FFF";
    CTX.shadowOffsetX = 2;
    CTX.shadowOffsetY = 2;
    CTX.shadowBlur = 3;
    CTX.fillText("GAME OVER", x, y);
  },
  pressEnter: function () {
    var CTX = LAYER.text;
    CTX.textAlign = "center";
    CTX.font = 32 + "px Garamond";
    var x = ENGINE.gameWIDTH / 2;
    var y = ENGINE.gameHEIGHT / 2 + 80;
    CTX.fillText("Press ENTER to continue", x, y);
  },
  music: function () {
    if (AUDIO.Title) AUDIO.Title.play();
  },
  startTitle: function () {
    if (AUDIO.Title) AUDIO.Title.play();
    ENGINE.clearLayer("text");
    ENGINE.clearLayer("actors");
    ENGINE.clearLayer("score");
    ENGINE.clearLayer("hiscore");

    TITLE.background();
    TITLE.scoreBlank();
    var CTX = LAYER.background;
    CTX.fillStyle = "#000";
    CTX.fillRect(0, 0, ENGINE.gameWIDTH, ENGINE.gameHEIGHT);
    TITLE.bottomBlank();
    const RD = new RenderData(
      "Annie",
      30,
      "silver",
      "background",
      "darkgray",
      2,
      2,
      2
    );
    ENGINE.TEXT.RD = RD;
    let x, y;
    y = 180;
    ENGINE.TEXT.centeredText("BY", y);
    y = 220;
    ENGINE.TEXT.centeredText("LOVRO SELIČ", y);
    $("#DOWN")[0].scrollIntoView();
    let cname = ENGINE.getCanvasName("ROOM");
    ENGINE.topCanvas = cname;
    TITLE.drawButtons();
    
    //set ghosts
    x = 672;
    y = 300;
    let delta = 96;
    TITLE.ghosts = [];
    for (const ghost in GHOSTS){
      TITLE.ghosts.push(new ACTOR(GHOSTS[ghost].spriteClass.brave, x, y, "front", ASSET[GHOSTS[ghost].spriteClass.brave]));
      ENGINE.TEXT.leftText(ghost, x + 64, y + 32);
      y += delta;
    }
    //set rat
    TITLE.rat = new ACTOR("DotHunter", 208, 672, "right", ASSET.DotHunter);
    TITLE.rat.dir = RIGHT;
    TITLE.rat.speed = 10;
    TITLE.drawHiScore();
    //dynamic title on text
    x = 208;
    y = 100;
    GAME.setFancyText(x, y);
    GAME.setTitle();
    ENGINE.INI.ANIMATION_INTERVAL = 49;
    ENGINE.GAME.start(); //INIT game loop
    ENGINE.GAME.ANIMATION.next(GAME.runTitle);
  },
  animateTitleGhosts: function(){
    ENGINE.clearLayer("actors");
    for (let ghost of TITLE.ghosts){
      ghost.animateMove("front");
      ENGINE.draw("actors", ghost.x, ghost.y, ghost.sprite());
    }
  },
  animateTitleRat: function(){
    let left = 208;
    let right = 208 + 615 - 48;
    
    TITLE.rat.x += TITLE.rat.dir.x * TITLE.rat.speed;
    if (TITLE.rat.x <= left){
      TITLE.rat.dir = RIGHT;
    } else if (TITLE.rat.x >= right){
      TITLE.rat.dir = LEFT;
    }
    
    TITLE.rat.orientation = TITLE.rat.getOrientation(TITLE.rat.dir);
    TITLE.rat.animateMove(TITLE.rat.orientation);
    ENGINE.draw("actors", TITLE.rat.x, TITLE.rat.y, TITLE.rat.sprite());
  },
  drawButtons: function () {
    ENGINE.clearLayer("button");
    FORM.BUTTON.POOL.clear();
    let x = 32;
    let y = 690;
    let w = 132;
    let h = 24;
    let startBA = new Area(x, y, w, h);
    let buttonColors = new ColorInfo(
      "darkorange",
      "#orange",
      "#222",
      "#666",
      13
    );
    let musicColors = new ColorInfo("lime", "#090", "#222", "#666", 13);

    FORM.BUTTON.POOL.push(
      new Button("Start game", startBA, buttonColors, GAME.start)
    );
    const sg = localStorage.getItem(PRG.SG);
    y += 1.5 * h;
    let music = new Area(x, y, w, h);
    FORM.BUTTON.POOL.push(
      new Button("Play title music", music, musicColors, TITLE.music)
    );
    FORM.BUTTON.draw();
    $(ENGINE.topCanvas).mousemove(ENGINE.mouseOver);
    $(ENGINE.topCanvas).click(ENGINE.mouseClick);
  },
  lines: function () {
    let x = 208;
    let y = 250;
    TITLE.line(x, y);
    y = 660;
    TITLE.line(x, y);
    y = 720;
    TITLE.line(x, y);
  },
  line: function (x, y) {
    let CTX = LAYER.animation;
    let size = 2;
    let width = 615;
    let curX = x;
    while (curX <= x + width) {
      CTX.fillStyle = GREENS.chooseRandom();
      CTX.pixelAt(curX, y, size);
      curX += size;
    }
  },
  drawHiScore() {
    let y = 320;
    let x = 208;
    var CTX = LAYER.background;
    CTX.textAlign = "left";
    let fs = 28;
    CTX.font = `${fs}px Consolas`;
    ENGINE.resetShadow(CTX);
    for (var hs = 1; hs <= SCORE.SCORE.depth; hs++) {
      let name = SCORE.SCORE.name[hs - 1].split("&")[0].padEnd(10, " ");
      let HS = `${hs.toString().padStart(2, "0")}. ${name} ${SCORE.SCORE.value[
        hs - 1
      ]
        .toString()
        .padStart(7, " ")}`;
      if (hs === 1) {
        CTX.fillStyle = "gold";
      } else if (hs === 2) {
        CTX.fillStyle = "silver";
      } else if (hs === 3) {
        CTX.fillStyle = "#cd7f32";
      } else {
        CTX.fillStyle = "green";
      }
      CTX.fillText(HS, x, y);
      y += Math.floor(fs * 1.2);
    }
  }
};
class Ghost {
  constructor(template) {
    for (const property in template) {
      this[property] = template[property];
    }
    this.home = Grid.toClass(this.home);
    this.started = false;
    this.timer = null;
    this.dirStack = [];
    this.state = "Cage";
    this.speed = LevelTable.speed(GAME.level);
    this.changeSpeed = this.speed;
    this.trigger = Math.max(0, this.trigger - (GAME.level - 1) * 4);
    this.actor = new ACTOR(
      this.spriteClass.brave,
      0,
      0,
      "front",
      ASSET[this.spriteClass.brave]
    );
    this.MoveState = new MoveState(this.home);
    GRID.gridToSprite(this.home, this.actor);
  }
  makeMove() {
    this.MoveState.dir = this.dirStack.shift();
    this.MoveState.next(this.MoveState.dir);
  }
  changeState(state) {
    if (this.state != "Flee" && this.state != "Dead" && this.state != "Cage") {
      this.state = state;
    }
  }
  die() {
    this.state = "Dead";
    //this.changeSpeed = 12;
    this.changeSpeed = 6;
    this.actor.setSpriteClass("Eyes");
    this.dirStack.clear();
    if (this.timer) {
      this.timer.unregister();
    }
    this.timer = null;
  }
}
var ENEMY = {
  POOL: [],
  init: function () {
    ENEMY.POOL.clear();
    ENEMY.POOL.push(new Ghost(GHOSTS.Ghosty));
    ENEMY.POOL.push(new Ghost(GHOSTS.Ugly));
    ENEMY.POOL.push(new Ghost(GHOSTS.Scary));
    ENEMY.POOL.push(new Ghost(GHOSTS.Floaty));
  },
  reset: function () {
    for (let q = 0; q < ENEMY.POOL.length; q++) {
      let ghost = ENEMY.POOL[q];
      ghost.MoveState = new MoveState(ghost.home);
      GRID.gridToSprite(ghost.home, ghost.actor);
      ghost.state = "Cage";
      ghost.dirStack.clear();
    }
  },
  draw: function () {
    ENGINE.layersToClear.add("actors");
    for (let q = 0; q < ENEMY.POOL.length; q++) {
      let ghost = ENEMY.POOL[q];
      ENGINE.spriteDraw(
        "actors",
        ghost.actor.x,
        ghost.actor.y,
        ghost.actor.sprite()
      );
    }
  },
  manage: function () {
    GRID.calcDistancesBFS_A(HERO.MoveState.homeGrid, MAP[GAME.level]);
    const nodeMap = MAP[GAME.level].nodeMap;

    for (let PL = ENEMY.POOL.length, q = PL - 1; q >= 0; q--) {
      let enemy = ENEMY.POOL[q];
      if (enemy.MoveState.moving) {
        if (checkFreedom(enemy, q)) {
          GRID.translateMove(enemy, false, enemyOnFinish.bind(enemy));
        }
        continue;
      }
      if (enemy.dirStack.length > 0) {
        enemy.makeMove();
        continue;
      }
      let timerName;

      switch (enemy.state) {
        case "Cage":
          enemy.changeSpeed = LevelTable.speed(GAME.level);
          enemy.speed = enemy.changeSpeed;
          enemy.actor.setSpriteClass(enemy.spriteClass.brave);
          if (GAME.levelTime.time().s > enemy.trigger) enemy.started = true;
          if (MAP[GAME.level].dotsPicked >= enemy.trigger || enemy.started) {
            let path = GRID.findPath(
              enemy.MoveState.endGrid,
              MAP[GAME.level].bonus,
              MAP[GAME.level],
              ENGINE.INI.MAX_PATH,
              UP
            );
            enemy.dirStack = path.stack;
            enemy.state = "Wander";
            enemy.started = true;
            enemy.makeMove();
          }
          break;

        case "Wander":
          timerName = enemy.name + "-ToHunt";
          if (!ENGINE.TIMERS.exists(timerName)) {
            if (enemy.timer) {
              enemy.timer.unregister();
            }
            enemy.timer = new CountDown(
              timerName,
              LevelTable.wander(GAME.level),
              enemy.changeState.bind(enemy, "Hunt")
            );
          }

          enemy.dirStack = GRID.AI.wanderer.hunt(
            enemy,
            enemy.MoveState,
            MAP[GAME.level].rooms[0].door
          ).return;
          enemy.makeMove();
          break;

        case "Hunt":
          timerName = enemy.name + "-ToWander";
          if (!ENGINE.TIMERS.exists(timerName)) {
            if (enemy.timer) {
              enemy.timer.unregister();
            }
            enemy.timer = new CountDown(
              timerName,
              LevelTable.chase(GAME.level),
              enemy.changeState.bind(enemy, "Wander")
            );
          }
          let hunt;
          if (enemy.AI) {
            hunt = GRID.AI[enemy.AI].hunt(HERO, enemy.MoveState, 3);
          } else {
            let distance =
              nodeMap[enemy.MoveState.endGrid.x][enemy.MoveState.endGrid.y]
                .distance;
            if (distance > INI.FLOATY_DISTANCE) {
              hunt = GRID.AI.advancer.hunt(HERO);
            } else {
              hunt = GRID.AI.runAway.hunt(
                enemy.MoveState.endGrid,
                nodeMap,
                enemy.MoveState.dir
              );
            }
          }

          let path;
          if (hunt.type === "path") {
            path = hunt.return;
          } else {
            path = GRID.findPathToFirstCrossroad(
              enemy.MoveState.endGrid,
              hunt.return,
              MAP[GAME.level],
              enemy.MoveState.dir
            );
          }
          if (path != null) {
            enemy.dirStack = path;
            enemy.makeMove();
          } else {
            path = GRID.findPathToFirstCrossroad(
              enemy.MoveState.endGrid,
              HERO.MoveState.homeGrid,
              MAP[GAME.level],
              enemy.MoveState.dir
            );
            if (path != null) {
              enemy.dirStack = path;
              enemy.makeMove();
            }
          }
          break;

        case "Flee":
          let dir = GRID.AI.runAway.hunt(
            enemy.MoveState.endGrid,
            nodeMap,
            enemy.MoveState.dir
          );
          enemy.dirStack = dir.return;
          enemy.makeMove();
          break;

        case "Dead":
          let pathHome = GRID.findPath(
            enemy.MoveState.endGrid,
            enemy.home,
            MAP[GAME.level]
          );
          enemy.dirStack = pathHome.stack;
          enemy.makeMove();
          enemy.state = "Cage";
          break;

        default:
          console.error(enemy, "state ERROR!");
          continue;
          break;
      }
    }

    function enemyOnFinish() {
      this.speed = this.changeSpeed;
    }
    function checkFreedom(enemy, q) {
      if (q > 0) {
        return !GRID.same(
          enemy.MoveState.homeGrid,
          ENEMY.POOL[q - 1].MoveState.homeGrid
        );
      } else return true;
    }
  },
  calm: function () {
    for (let PL = ENEMY.POOL.length, q = PL - 1; q >= 0; q--) {
      let enemy = ENEMY.POOL[q];
      if (enemy.state === "Flee" && enemy.state != "Dead") {
        enemy.actor.setSpriteClass(enemy.spriteClass.brave);
        enemy.state = "Hunt";
        enemy.changeSpeed = LevelTable.speed(GAME.level);
      }
    }
  },
  scare: function () {
    for (let PL = ENEMY.POOL.length, q = PL - 1; q >= 0; q--) {
      let enemy = ENEMY.POOL[q];
      if (
        MAP[GAME.level].isInRoom(
          enemy.MoveState.endGrid,
          MAP[GAME.level].rooms[0]
        )
      ) {
        continue;
      }

      if (enemy.state != "Cage" && enemy.state != "Dead") {
        enemy.actor.setSpriteClass(enemy.spriteClass.scared);
        enemy.dirStack.clear();
        enemy.state = "Flee";
        enemy.changeSpeed = LevelTable.scaredSpeed(GAME.level);
      }
    }
  },
  setScared: function () {
    for (let PL = ENEMY.POOL.length, q = PL - 1; q >= 0; q--) {
      let enemy = ENEMY.POOL[q];
      if (enemy.state === "Flee") {
        enemy.actor.setSpriteClass(enemy.spriteClass.scared);
      }
    }
  },
  setBrave: function () {
    for (let PL = ENEMY.POOL.length, q = PL - 1; q >= 0; q--) {
      let enemy = ENEMY.POOL[q];
      if (enemy.state === "Flee") {
        enemy.actor.setSpriteClass(enemy.spriteClass.brave);
      }
    }
  }
};
var GHOSTS = {
  Ghosty: {
    name: "Ghosty",
    spriteClass: {
      brave: "Ghosty",
      scared: "ScaredGhosty"
    },
    trigger: 0,
    state: "Cage",
    home: { x: 10, y: 6 },
    AI: "follower"
  },
  Scary: {
    name: "Scary",
    spriteClass: {
      brave: "Scary",
      scared: "ScaredScary"
    },
    trigger: 40,
    state: "Cage",
    home: { x: 11, y: 7 },
    AI: "shadower"
  },
  Ugly: {
    name: "Ugly",
    spriteClass: {
      brave: "Ugly",
      scared: "ScaredUgly"
    },
    trigger: 20,
    state: "Cage",
    home: { x: 9, y: 7 },
    AI: "default"
  },
  Floaty: {
    name: "Floaty",
    spriteClass: {
      brave: "Floaty",
      scared: "ScaredFloaty"
    },
    trigger: 60,
    state: "Cage",
    home: { x: 10, y: 8 },
    AI: null
  }
};

$(function () {
  PRG.INIT();
  SPEECH.init();
  PRG.setup();
  ENGINE.LOAD.preload();
  SCORE.init("SC", "DotHunter", 10, 30000);
  SCORE.loadHS();
  SCORE.hiScore();
  SCORE.extraLife = [25000, 50000, 100000, 250000, Infinity];
});
