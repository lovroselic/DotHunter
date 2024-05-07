"use strict";
//////////////////////////////////////
// GRID v 2.00       by LS          //
//////////////////////////////////////

var GRID = {
  VERSION: "2.00.01",
  CSS: "color: #0AA",
  SETTING: {
    ALLOW_CROSS: false
  },
  collision: function (actor, grid) {
    let actorGrid = actor.MoveState.homeGrid;
    return GRID.same(actorGrid, grid);
  },
  spriteToSpriteCollision: function (actor1, actor2) {
    return GRID.same(actor1.MoveState.homeGrid, actor2.MoveState.homeGrid);
  },
  gridToCenterPX: function (grid) {
    var x = grid.x * ENGINE.INI.GRIDPIX + Math.floor(ENGINE.INI.GRIDPIX / 2);
    var y = grid.y * ENGINE.INI.GRIDPIX + Math.floor(ENGINE.INI.GRIDPIX / 2);
    return new Point(x, y);
  },
  gridToSprite: function (grid, actor) {
    GRID.coordToSprite(GRID.gridToCoord(grid), actor);
  },
  coordToSprite: function (coord, actor) {
    actor.x = coord.x + Math.floor(ENGINE.INI.GRIDPIX / 2);
    actor.y = coord.y + Math.floor(ENGINE.INI.GRIDPIX / 2);
  },
  gridToCoord: function (grid) {
    var x = grid.x * ENGINE.INI.GRIDPIX;
    var y = grid.y * ENGINE.INI.GRIDPIX;
    return new Point(x, y);
  },
  coordToGrid: function (x, y) {
    var tx = Math.floor(x / ENGINE.INI.GRIDPIX);
    var ty = Math.floor(y / ENGINE.INI.GRIDPIX);
    return new Grid(tx, ty);
  },
  create: function (x, y) {
    var temp = [];
    var string = "1".repeat(x);
    for (var iy = 0; iy < y; iy++) {
      temp.push(string);
    }
    return temp;
  },
  grid: function () {
    var CTX = LAYER.grid;
    var x = 0;
    var y = 0;
    CTX.strokeStyle = "#FFF";
    //horizonal lines
    do {
      y += ENGINE.INI.GRIDPIX;
      CTX.beginPath();
      CTX.setLineDash([1, 3]);
      CTX.moveTo(x, y);
      CTX.lineTo(CTX.canvas.width, y);
      CTX.closePath();
      CTX.stroke();
    } while (y <= CTX.canvas.height);
    //vertical lines
    y = 0;
    do {
      x += ENGINE.INI.GRIDPIX;
      CTX.beginPath();
      CTX.setLineDash([1, 3]);
      CTX.moveTo(x, y);
      CTX.lineTo(x, CTX.canvas.height);
      CTX.closePath();
      CTX.stroke();
    } while (x <= CTX.canvas.width);
  },
  paintText: function (point, text, layer, color = "#FFF") {
    var CTX = LAYER[layer];
    CTX.font = "10px Consolas";
    var y = point.y + ENGINE.INI.GRIDPIX / 2;
    var x = point.x + ENGINE.INI.GRIDPIX / 2;
    CTX.fillStyle = color;
    CTX.textAlign = "center";
    CTX.fillText(text, x, y);
  },
  paint: function (
    grid,
    floorIMG,
    wallIMG,
    floorLayer = "floor",
    wallLayer = "wall",
    drawGrid = false
  ) {
    ENGINE.clearLayer(floorLayer);
    ENGINE.clearLayer(wallLayer);
    ENGINE.fill(LAYER[floorLayer], floorIMG);
    ENGINE.fill(LAYER[wallLayer], wallIMG);

    if (drawGrid) {
      ENGINE.clearLayer("grid");
      GRID.grid();
    }
  },
  repaint: function (
    grid,
    floorIMG,
    wallIMG,
    floorLayer = "floor",
    wallLayer = "wall",
    drawGrid = false
  ) {
    GRID.paint(grid, floorIMG, wallIMG, floorLayer, wallLayer, drawGrid);
    const height = grid.length;
    const width = grid[0].length;
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (grid[y].charAt(x) === "0") {
          let point = GRID.gridToCoord({ x: x, y: y });
          ENGINE.cutGrid(LAYER[wallLayer], point);
        }
      }
    }
  },
  map: {
    pack: function (grid) {
      var RL = grid.length;
      var converted = [];
      for (var i = 0; i < RL; i++) {
        converted.push(parseInt(grid[i], 2));
      }
      return converted;
    },
    unpack: function (map) {
      if (!map.packed) return map.grid;
      map.packed = false;
      console.log(`%cUnpacking map ...`, ENGINE.CSS);
      var h = parseInt(map.height, 10);
      var w = parseInt(map.width, 10);
      if (h != map.grid.length) {
        throw "Map corrupted: height:" + h + " grid.length: " + map.grid.length;
      }
      var binary = [];
      for (var i = 0; i < h; i++) {
        let binTemp = float64ToInt64Binary(map.grid[i]).padStart(w, "0");
        if (binTemp.length > w) {
          binTemp = binTemp.substr(binTemp.length - w, binTemp.length);
        }
        binary.push(binTemp);
      }
      return binary;
    }
  },
  outside: function (grid, map = MAP[GAME.level]) {
    return map.isOutOfBounds(grid);
  },
  toOtherSide: function (grid, map = MAP[GAME.level]) {
    grid.x = (grid.x + map.width) % map.width;
    grid.y = (grid.y + map.height) % map.height;
    return grid;
  },
  isBlock: function (x, y, map = MAP[GAME.level]) {
    if (x < 0 || y < 0) return true;
    if (x >= map.width || y >= map.height) return true;
    var block = map.grid[y].charAt(x);
    if (block === "1") {
      return true;
    } else return false;
  },
  gridIsBlock: function (grid, map = MAP[GAME.level]) {
    return GRID.isBlock(grid.x, grid.y, map);
  },
  trueToGrid: function (actor) {
    var TX = actor.x - Math.floor(ENGINE.INI.GRIDPIX / 2);
    var TY = actor.y - Math.floor(ENGINE.INI.GRIDPIX / 2);
    var GX = Math.floor(TX / ENGINE.INI.GRIDPIX);
    var GY = Math.floor(TY / ENGINE.INI.GRIDPIX);
    var MX = TX % ENGINE.INI.GRIDPIX;
    var MY = TY % ENGINE.INI.GRIDPIX;
    if (MX || MY) {
      return null;
    } else return { x: GX, y: GY };
  },
  same: function (grid1, grid2) {
    if (grid1 === null || grid2 === null) return false;
    if (grid1 === undefined || grid2 === undefined) return false;
    if (grid1.x === grid2.x && grid1.y === grid2.y) {
      return true;
    } else return false;
  },
  isGridIn: function (grid, gridArray) {
    for (var q = 0; q < gridArray.length; q++) {
      if (grid.x === gridArray[q].x && grid.y === gridArray[q].y) {
        return q;
      }
    }
    return -1;
  },
  getDirections: function (grid, obstacles = []) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      let newGrid = grid.add(ENGINE.directions[D]);

      if (GRID.outside(newGrid)) {
        newGrid = GRID.toOtherSide(newGrid);
      }

      if (!GRID.gridIsBlock(newGrid) && newGrid.isInAt(obstacles) === -1) {
        directions.push(ENGINE.directions[D]);
      }
    }
    return directions;
  },
  getDirectionsFromNodeMap(grid, nodeMap) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      let newGrid = grid.add(ENGINE.directions[D]);
      if (GRID.outside(newGrid)) {
        newGrid = GRID.toOtherSide(newGrid);
      }
      if (nodeMap[newGrid.x][newGrid.y]) {
        directions.push(ENGINE.directions[D]);
      }
    }
    return directions;
  },
  findCrossroad: function (start, dir) {
    let directions = GRID.getDirections(start);
    let back = dir.mirror();
    let BI = back.isInAt(directions);
    if (BI !== -1) directions.splice(BI, 1);
    while (directions.length < 2) {
      dir = directions[0];
      start = start.add(dir);
      directions = GRID.getDirections(start);
      back = dir.mirror();
      BI = back.isInAt(directions);
      if (BI !== -1) directions.splice(BI, 1);
    }
    return start;
  },
  findCrossroadAndLastDir: function (start, dir) {
    let directions = GRID.getDirections(start);
    let back = dir.mirror();
    let BI = back.isInAt(directions);
    if (BI !== -1) directions.splice(BI, 1);
    while (directions.length < 2) {
      dir = directions[0];
      start = start.add(dir);
      directions = GRID.getDirections(start);
      back = dir.mirror();
      BI = back.isInAt(directions);
      if (BI !== -1) directions.splice(BI, 1);
    }
    return { finish: start, dir: dir };
  },
  pathToCrossroad: function (start, dir, obst = []) {
    let path = [];
    path.push(dir);
    start = start.add(dir);
    let directions = GRID.getDirections(start, obst);
    if (directions.length === 1) return path;
    let back = dir.mirror();
    let BI = back.isInAt(directions);
    if (BI !== -1) directions.splice(BI, 1);
    while (directions.length === 1) {
      dir = directions[0];
      path.push(dir);
      start = start.add(dir);
      directions = GRID.getDirections(start);
      if (directions.length === 1) return path;
      back = dir.mirror();
      BI = back.isInAt(directions);
      if (BI !== -1) directions.splice(BI, 1);
    }
    return path;
  },
  findLengthToCrossroad: function (start, stack) {
    if (stack === null) return;
    var q = 0;
    do {
      if (stack[q] === undefined) return null;
      start = start.add(stack[q]);
      q++;
    } while (GRID.getDirections(start).length < 3);
    return q;
  },
  translateMove: function (
    entity,
    gridArray,
    changeView = false,
    onFinish = null,
    animate = true
  ) {
    entity.actor.x += entity.MoveState.dir.x * entity.speed;
    entity.actor.y += entity.MoveState.dir.y * entity.speed;
    entity.actor.orientation = entity.actor.getOrientation(
      entity.MoveState.dir
    );
    if (animate) {
      entity.actor.animateMove(entity.actor.orientation);
    }
    entity.MoveState.homeGrid = GRID.coordToGrid(
      entity.actor.x,
      entity.actor.y
    );

    if (gridArray.outside(entity.MoveState.homeGrid)) {
      entity.MoveState.homeGrid = gridArray.toOtherSide(
        entity.MoveState.homeGrid
      );
      GRID.gridToSprite(entity.MoveState.homeGrid, entity.actor);
    }

    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }

    ENGINE.VIEWPORT.alignTo(entity.actor);

    if (GRID.same(entity.MoveState.endGrid, GRID.trueToGrid(entity.actor))) {
      entity.MoveState.moving = false;
      entity.MoveState.startGrid = entity.MoveState.endGrid;
      entity.MoveState.homeGrid = entity.MoveState.endGrid;

      if (onFinish) onFinish.call();
    }
    return;
  },
  blockMove: function (entity, changeView = false) {
    let newGrid = entity.MoveState.startGrid.add(entity.MoveState.dir);
    entity.MoveState.reset(newGrid);
    GRID.gridToSprite(newGrid, entity.actor);
    entity.actor.orientation = entity.actor.getOrientation(
      entity.MoveState.dir
    );
    entity.actor.animateMove(entity.actor.orientation);

    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }
    ENGINE.VIEWPORT.alignTo(entity.actor);
  },
  teleportToGrid: function (entity, grid, changeView = false) {
    entity.MoveState.reset(grid);
    GRID.gridToSprite(grid, entity.actor);
    if (changeView) {
      ENGINE.VIEWPORT.check(entity.actor);
    }
    ENGINE.VIEWPORT.alignTo(entity.actor);
  },
  findAllPaths: function (start, finish, dungeon) {
    //A*
    var Q = new NodeQ("distance");
    let solutions = [];
    let NodeMap = dungeon.setNodeMap("tempNodeMap");
    Q.list.push(new SearchNode(start, finish, [new Vector(0, 0)]));
    if (Q.list[0].dist === 0) return null;
    NodeMap[start.x][start.y].distance = 0;
    var selected;
    var round = 0;
    while (Q.list.length > 0) {
      round++;
      selected = Q.list.shift();
      let dirs = GRID.getDirectionsFromNodeMap(selected.grid, NodeMap);
      for (let q = 0; q < dirs.length; q++) {
        let HG = selected.grid.add(dirs[q]);
        if (GRID.outside(HG)) {
          HG = GRID.toOtherSide(HG);
        }
        let history = [].concat(selected.history);
        history.push(HG);
        let I_stack = [].concat(selected.stack);
        I_stack.push(dirs[q]);

        let fork = new SearchNode(
          HG,
          finish,
          I_stack,
          selected.path + 1,
          history,
          round
        );

        if (fork.dist === 0) {
          fork.stack.splice(0, 1);
          fork.status = "Found";
          solutions.push(fork);
        }

        let node = NodeMap[fork.grid.x][fork.grid.y];
        if (fork.path < node.distance) {
          node.distance = fork.path;
          Q.queue(fork);
        }
      }
    }
    return solutions;
  },
  findPath: function (
    start,
    finish,
    dungeon,
    limit = ENGINE.INI.MAX_PATH,
    firstDir = null
  ) {
    //A*
    var Q = new NodeQ("distance");
    let NodeMap = dungeon.setNodeMap("tempNodeMap");
    if (firstDir != null) {
      let back = firstDir.mirror();
      let block = start.add(back);
      if (GRID.outside(block)) {
        block = GRID.toOtherSide(block);
      }
      NodeMap[block.x][block.y] = null;
      firstDir = new Vector(0, 0);
    }
    Q.list.push(new SearchNode(start, finish, [firstDir]));
    if (Q.list[0].dist === 0) return null;
    NodeMap[start.x][start.y].distance = 0;
    var selected;
    var round = 0;
    while (Q.list.length > 0) {
      round++;
      selected = Q.list.shift();
      if (selected.path > limit) {
        selected.status = "Excess";
        selected.stack.splice(0, 1);
        return selected;
      }
      let dirs = GRID.getDirectionsFromNodeMap(selected.grid, NodeMap);
      for (let q = 0; q < dirs.length; q++) {
        let HG = selected.grid.add(dirs[q]);
        if (GRID.outside(HG)) {
          HG = GRID.toOtherSide(HG);
        }
        let history = [].concat(selected.history);
        history.push(HG);
        let I_stack = [].concat(selected.stack);
        I_stack.push(dirs[q]);
        let fork = new SearchNode(
          HG,
          finish,
          I_stack,
          selected.path + 1,
          history,
          round
        );
        if (fork.dist === 0) {
          fork.stack.splice(0, 1);
          fork.status = "Found";
          return fork;
        }
        let node = NodeMap[fork.grid.x][fork.grid.y];
        if (fork.path < node.distance) {
          node.distance = fork.path;
          Q.queue(fork);
        }
      }
      if (round > ENGINE.INI.PATH_ROUNDS) {
        break;
      }
    }
    //no solution was found in ENGINE.INI.PATH_ROUNDS iterations
    if (Q.list.length > 0) {
      Q.list[0].stack.splice(0, 1);
      Q.list[0].status = "Abandoned";
      return Q.list[0];
    } else {
      selected.status = "NoSolution";
      selected.stack.splice(0, 1);
      return selected;
    }
  },

  findPathToFirstCrossroad: function (
    start,
    finish,
    dungeon,
    firstDir = new Vector(0, 0)
  ) {
    let path = GRID.findPath(
      start,
      finish,
      dungeon,
      ENGINE.INI.MAX_PATH,
      firstDir
    );
    if (path === null) return null;
    path = path.stack;
    let len = GRID.findLengthToCrossroad(start, path);
    if (len > 0) path.splice(len);
    return path;
  },
  paintGridPath: function (layer, color, path, start) {
    if (path === null) return;
    var CTX = LAYER[layer];
    ENGINE.clearLayer(layer);
    CTX.strokeStyle = color;
    var point = GRID.gridToCenterPX(start);
    point.toViewport();
    var PL = path.length;
    CTX.beginPath();
    CTX.moveTo(point.x, point.y);
    for (let q = 0; q < PL; q++) {
      point = GRID.gridToCenterPX(path[q]);
      CTX.lineTo(point.x, point.y);
      CTX.stroke();
    }
  },
  paintPath: function (layer, color, path, start, z = 0) {
    if (path === null) return;
    var CTX = LAYER[layer];
    ENGINE.clearLayer(layer);
    CTX.strokeStyle = color;
    var point = GRID.gridToCenterPX(start);
    point.toViewport();
    var PL = path.length;
    CTX.beginPath();
    CTX.moveTo(point.x + z, point.y + z);
    for (let q = 0; q < PL; q++) {
      point = point.translate(path[q]);
      CTX.lineTo(point.x + z, point.y + z);
      CTX.stroke();
    }
  },
  gridToIndex: function (grid, map = MAP[GAME.level]) {
    return grid.x + grid.y * map.width;
  },
  indexToGrid: function (index, map = MAP[GAME.level]) {
    let x = index % map.width;
    let y = Math.floor(index / map.width);
    return new Grid(x, y);
  },
  vision: function (startGrid, endGrid) {
    if (GRID.same(startGrid, endGrid)) return true;
    let path = GRID.raycasting(startGrid, endGrid);
    return GRID.pathClear(path);
  },
  raycasting: function (startGrid, endGrid) {
    let normDir = startGrid.direction(endGrid);
    let path = [];
    path.push(Grid.toClass(startGrid));
    let x = startGrid.x;
    let y = startGrid.y;
    let dx = Math.abs(endGrid.x - x);
    let dy = -Math.abs(endGrid.y - y);
    let Err = dx + dy;
    let E2, node;
    do {
      E2 = Err * 2;
      if (E2 >= dy) {
        Err += dy;
        x += normDir.x;
      }
      if (E2 <= dx) {
        Err += dx;
        y += normDir.y;
      }
      node = new Grid(x, y);
      path.push(node);
    } while (!GRID.same(node, endGrid));
    return path;
  },
  pathClear: function (path) {
    if (path.length === 0) return true;
    for (let q = 0; q < path.length; q++) {
      if (GRID.gridIsBlock(path[q])) return false;
    }
    return true;
  },
  calcDistancesBFS_BH: function (start, dungeon) {
    dungeon.setNodeMap();
    let BH = new BinHeap("distance");
    dungeon.nodeMap[start.x][start.y].distance = 0;
    BH.insert(dungeon.nodeMap[start.x][start.y]);
    while (BH.size() > 0) {
      let node = BH.extractMax();
      for (let D = 0; D < ENGINE.directions.length; D++) {
        let nextNode =
          dungeon.nodeMap[node.grid.x + ENGINE.directions[D].x][
            node.grid.y + ENGINE.directions[D].y
          ];
        if (nextNode) {
          if (nextNode.distance > node.distance + 1) {
            nextNode.distance = node.distance + 1;
            nextNode.prev = node.grid;
            BH.insert(nextNode);
          }
        }
      }
    }
  },
  calcDistancesBFS_A: function (start, dungeon) {
    dungeon.setNodeMap();
    let Q = new NodeQ("distance");
    dungeon.nodeMap[start.x][start.y].distance = 0;
    Q.queueSimple(dungeon.nodeMap[start.x][start.y]);
    while (Q.size() > 0) {
      let node = Q.dequeue();

      for (let D = 0; D < ENGINE.directions.length; D++) {
        let x =
          (node.grid.x + ENGINE.directions[D].x + dungeon.width) %
          dungeon.width;
        let y =
          (node.grid.y + ENGINE.directions[D].y + dungeon.height) %
          dungeon.height;
        let nextNode = dungeon.nodeMap[x][y];

        if (nextNode) {
          if (nextNode.distance > node.distance + 1) {
            nextNode.distance = node.distance + 1;
            nextNode.prev = node.grid;
            Q.queueSimple(nextNode);
          }
        }
      }
    }
  },
  pathFromNodeMap: function (origin, dungeon) {
    //origin type Grid
    let path = [];
    let prev = dungeon.nodeMap[origin.x][origin.y].prev;
    while (prev) {
      path.push(prev);
      prev = dungeon.nodeMap[prev.x][prev.y].prev;
    }
    return path;
  },
  AI: {
    advancer: {
      hunt: function (entity) {
        let next = GRID.findCrossroadAndLastDir(
          entity.MoveState.startGrid,
          entity.MoveState.dir
        );
        let nextCR = next.finish;
        let directions = GRID.getDirections(nextCR);
        let back = next.dir.mirror();
        let BI = back.isInAt(directions);
        if (BI !== -1) directions.splice(BI, 1);
        if (entity.MoveState.dir.isInAt(directions) !== -1) {
          return {
            type: "grid",
            return: GRID.findCrossroad(
              nextCR.add(entity.MoveState.dir),
              entity.MoveState.dir
            )
          };
        } else {
          let LNs = [];
          let CRs = [];
          for (let q = 0; q < directions.length; q++) {
            CRs.push(
              GRID.findCrossroad(nextCR.add(directions[q]), directions[q])
            );
            LNs.push(CRs[q].distance(entity.MoveState.startGrid));
          }
          let qq = LNs.indexOf(Math.min(...LNs));
          return { type: "grid", return: CRs[qq] };
        }
      }
    },
    default: {
      hunt: function (entity) {
        return {
          type: "grid",
          return: GRID.findCrossroad(
            entity.MoveState.startGrid,
            entity.MoveState.dir
          )
        };
      }
    },
    shadower: {
      hunt: function (entity, MS, tolerance) {
        let solutions = MS.endGrid.directionSolutions(
          entity.MoveState.homeGrid
        );
        let directions = GRID.getDirections(MS.endGrid);
        let back = MS.dir.mirror();
        let BI = back.isInAt(directions);
        if (BI !== -1) directions.splice(BI, 1);
        let selected;
        if (directions.length === 1) {
          selected = directions[0];
        } else {
          if (
            MS.goingAway(entity.MoveState) ||
            !MS.towards(entity.MoveState, tolerance)
          ) {
            if (entity.MoveState.dir.isInAt(directions) !== -1) {
              selected = entity.MoveState.dir;
            } else selected = solve();
          } else {
            let contra = entity.MoveState.dir.mirror();
            if (contra.isInAt(directions) !== -1) {
              selected = contra;
            } else selected = solve();
          }
        }
        if (!selected) {
          selected = directions.chooseRandom();
        }
        let path = GRID.pathToCrossroad(MS.endGrid, selected);
        return { type: "path", return: path };

        function solve() {
          for (let q = 0; q < 2; q++) {
            if (solutions[q].dir.isInAt(directions) !== -1)
              return solutions[q].dir;
          }
          return null;
        }
      }
    },
    follower: {
      hunt: function (entity) {
        return {
          type: "grid",
          return: GRID.findCrossroad(
            entity.MoveState.startGrid,
            entity.MoveState.dir.mirror()
          )
        };
      }
    },
    wanderer: {
      hunt: function (entity, MS, obst = []) {
        //reference to entity for compatibility
        let directions = GRID.getDirections(MS.endGrid, obst);
        if (directions.length > 1) {
          let back = MS.dir.mirror();
          let BI = back.isInAt(directions);
          if (BI !== -1) directions.splice(BI, 1);
        }
        let selected = directions.chooseRandom();
        let path = GRID.pathToCrossroad(MS.endGrid, selected, obst);
        return { type: "path", return: path };
      }
    },
    keepTheDistance: {
      hunt: function (MS, reference, setDistance) {
        //no reference to entity, has separate reference
        let directions = GRID.getDirections(
          MS.endGrid,
          MAP[GAME.level].DUNGEON.obstacles
        );
        let possible = [];
        let max = [];
        let curMax = 0;
        for (let i = 0; i < directions.length; i++) {
          let test = MS.endGrid.add(directions[i]);
          let distance = test.distanceDiagonal(reference);
          if (distance === setDistance) possible.push(directions[i]);
          if (distance > curMax) {
            max.clear();
            curMax = distance;
            max.push(directions[i]);
          } else if (distance === curMax) max.push(directions[i]);
        }
        let path;
        if (possible.length > 0) {
          path = [possible.chooseRandom()];
        } else if (max.length > 0) {
          path = [max.chooseRandom()];
        } else path = [];
        return { type: "path", return: path };
      }
    },
    circle: {
      hunt: function (MS, reference) {
        //no reference to entity, has separate reference
        const rs = randomSign();
        const initial = MS.endGrid.direction(reference).mirror();
        let start = MS.endGrid;
        let index = initial.isInAt(ENGINE.circle);
        let path = [];
        do {
          index += rs;
          if (index >= ENGINE.circle.length) index = 0;
          if (index < 0) index = ENGINE.circle.length - 1;
          let next = reference.add(ENGINE.circle[index]);
          path.push(start.direction(next));
          start = next;
        } while (!GRID.same(start, MS.endGrid));
        return { type: "path", return: path };
      }
    },
    runAway: {
      hunt: function (grid, nodeMap, currentDir = null) {
        //assumption: nodeMap calculated from HERO
        let dirs = GRID.getDirectionsFromNodeMap(grid, nodeMap);
        if (currentDir) {
          currentDir = currentDir.mirror();
          let BI = currentDir.isInAt(dirs);
          if (BI !== -1) dirs.splice(BI, 1);
        }
        let index = -1;
        let chosen = null;
        let distance = -1;
        for (let q = 0; q < dirs.length; q++) {
          let nextGrid = grid.add(dirs[q]);
          nextGrid = GRID.toOtherSide(nextGrid);
          let node = nodeMap[nextGrid.x][nextGrid.y];
          if (node.distance > distance) {
            distance = node.distance;
            index = q;
            chosen = node;
          }
        }
        return { type: "path", return: [dirs[index]] };
      }
    }
  }
};
class PathNode {
  constructor(x, y) {
    this.distance = Infinity;
    this.priority = Infinity;
    this.path = Infinity;
    this.prev = null;
    this.grid = new Grid(x, y);
    this.visited = false;
  }
  setPriority() {
    this.priority = this.path + this.distance;
  }
}
class BinHeap {
  constructor(prop) {
    this.HEAP = [];
    this.sort = prop;
  }
  size() {
    return this.HEAP.length;
  }
  parent(i) {
    return Math.floor((i - 1) / 2);
  }
  leftChild(i) {
    return 2 * i + 1;
  }
  rightChild(i) {
    return 2 * i + 2;
  }
  siftUp(i) {
    while (
      i > 0 &&
      this.HEAP[this.parent(i)][this.sort] > this.HEAP[i][this.sort]
    ) {
      this.HEAP.swap(this.parent(i), i);
      i = this.parent(i);
    }
  }
  siftDown(i) {
    let maxIndex = i;
    let L = this.leftChild(i);
    if (
      L <= this.size() - 1 &&
      this.HEAP[L][this.sort] < this.HEAP[maxIndex][this.sort]
    ) {
      maxIndex = L;
    }
    let R = this.rightChild(i);
    if (
      R <= this.size() - 1 &&
      this.HEAP[R][this.sort] < this.HEAP[maxIndex][this.sort]
    ) {
      maxIndex = R;
    }
    if (i !== maxIndex) {
      this.HEAP.swap(i, maxIndex);
      this.siftDown(maxIndex);
    }
  }
  insert(node) {
    this.HEAP.push(node);
    this.siftUp(this.size() - 1);
  }
  extractMax() {
    let result = this.HEAP[0];
    this.HEAP[0] = this.HEAP[this.size() - 1];
    this.HEAP.pop();
    this.siftDown(0);
    return result;
  }
  display() {
    while (this.size() > 0) {
      console.log(this.extractMax());
    }
  }
}
class SearchNode {
  constructor(HG, goal, stack, path, history, iterations) {
    this.grid = HG;
    this.stack = stack || [];
    this.history = history || [HG];
    this.path = path || 0;
    this.dist = this.grid.distance(goal);
    this.priority = this.path + this.dist;
    this.status = "Progress";
    this.iterations = iterations || 0;
  }
  append(node, goal) {
    let stack = this.stack.concat(node.stack);
    let history = this.history.concat(node.history.slice(1));
    let path = this.path + node.path;
    return new SearchNode(node.grid, goal, stack, path, history);
  }
}
class BlindNode {
  constructor(HG, stack, path, history, iterations) {
    this.grid = HG;
    this.stack = stack || [];
    this.history = history || [HG];
    this.path = path || 0;
    this.status = "Progress";
    this.iterations = iterations || 0;
  }
}
class NodeQ {
  constructor(prop) {
    this.list = [];
    this.sort = prop;
  }
  dequeue() {
    return this.list.shift();
  }
  size() {
    return this.list.length;
  }
  queueSimple(node) {
    var included = false;
    for (let q = 0; q < this.list.length; q++) {
      if (node[this.sort] < this.list[q][this.sort]) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      }
    }
    if (!included) this.list.push(node);
  }
  queue(node) {
    var included = false;
    for (let q = 0; q < this.list.length; q++) {
      if (node.priority < this.list[q].priority) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      } else if (
        node.priority === this.list[q].priority &&
        node.dist < this.list[q].dist
      ) {
        this.list.splice(q, 0, node);
        included = true;
        break;
      }
    }
    if (!included) this.list.push(node);
  }
}
class GridArray {
  constructor(sizeX, sizeY, byte = 1) {
    if (byte !== 1 && byte !== 2 && byte !== 4) {
      console.error(
        "GridArray set up with wrong size. Reset to default 8 bit!"
      );
      byte = 1;
    }
    let buffer = new ArrayBuffer(sizeX * sizeY * byte);
    let GM;
    switch (byte) {
      case 1:
        GM = new Uint8Array(buffer);
        break;
      case 2:
        GM = new Uint16Array(buffer);
        break;
      case 4:
        GM = new Uint32Array(buffer);
        break;
    }
    this.width = sizeX;
    this.height = sizeY;
    this.map = GM;
    this.nodeMap = null;
  }
  linkToEntity(entities) {
    for (const entity of entities) {
      entity.MoveState.gridArray = this;
    }
  }
  indexToGrid(index) {
    let x = index % this.width;
    let y = Math.floor(index / this.width);
    return new Grid(x, y);
  }
  gridToIndex(grid) {
    return grid.x + grid.y * this.width;
  }
  set(grid, bin) {
    this.map[this.gridToIndex(grid)] |= bin;
  }
  setValue(grid, value) {
    this.map[this.gridToIndex(grid)] = value;
  }
  clear(grid, bin) {
    let mask = 2 ** this.byte - 1;
    this.map[this.gridToIndex(grid)] &= mask - bin;
  }
  check(grid, bin) {
    return this.map[this.gridToIndex(grid)] & bin;
  }
  value(grid, value) {
    return this.map[this.gridToIndex(grid)] === value;
  }
  toWall(grid) {
    this.set(grid, 1);
  }
  wall(grid) {
    return this.check(grid, 1);
  }
  empty(grid) {
    return this.map[this.gridToIndex(grid)] === 0;
  }
  border(set = 1) {
    for (let x = 0; x < this.width; x++) {
      let grid1 = new Grid(x, 0);
      let grid2 = new Grid(x, this.height - 1);
      this.set(grid1, set);
      this.set(grid2, set);
    }
    for (let y = 0; y < this.height; y++) {
      let grid1 = new Grid(0, y);
      let grid2 = new Grid(this.width - 1, y);
      this.set(grid1, set);
      this.set(grid2, set);
    }
  }
  importGridMap(map) {
    //map is maze or dungeon object
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        let grid = new Grid(x, y);
        let index = this.gridToIndex(grid);
        if (map.isMazeWall(grid)) {
          this.toWall(grid);
        }
      }
    }
  }
  isOutOfBounds(grid) {
    if (
      grid.x >= this.width ||
      grid.x < 0 ||
      grid.y >= this.height ||
      grid.y < 0
    ) {
      return true;
    } else return false;
  }
  outside(grid) {
    return this.isOutOfBounds(grid);
  }
  toOtherSide(grid) {
    grid.x = (grid.x + this.width) % this.width;
    grid.y = (grid.y + this.height) % this.height;
    return grid;
  }
  checkLine(start, dir, length, value) {
    while (length > 0) {
      start = start.add(dir);
      if (this.isOutOfBounds(start)) return false;
      if (!this.value(start, value)) return false;
      length--;
    }
    return true;
  }
  checkNext(start, dir, value) {
    let next = start.add(dir);
    if (this.isOutOfBounds(next)) return false;
    return this.value(next, value);
  }
  setNodeMap(where = "nodeMap", path = [0]) {
    let map = [];
    for (let x = 0; x < this.width; x++) {
      map[x] = [];
      for (let y = 0; y < this.height; y++) {
        let value = this.map[this.gridToIndex(new Grid(x, y))];
        if (path.includes(value)) {
          map[x][y] = new PathNode(x, y);
        } else {
          map[x][y] = null;
        }
      }
    }
    this[where] = map;
    return map;
  }
  getDirectionsFromNodeMap(grid, nodeMap, allowCross = false) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      let newGrid = grid.add(ENGINE.directions[D]);

      if (this.outside(newGrid)) {
        if (allowCross) {
          newGrid = this.toOtherSide(newGrid);
        } else continue;
      }

      if (nodeMap[newGrid.x][newGrid.y]) {
        directions.push(ENGINE.directions[D]);
      }
    }
    return directions;
  }
  directionsFromVisitedNodeMap(grid, nodeMap, allowCross = false){
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      let newGrid = grid.add(ENGINE.directions[D]);

      if (this.outside(newGrid)) {
        if (allowCross) {
          newGrid = this.toOtherSide(newGrid);
        } else continue;
      }

      if (nodeMap[newGrid.x][newGrid.y]) {
        if (!nodeMap[newGrid.x][newGrid.y].visited){
          directions.push(ENGINE.directions[D]);
        }
      }
    }
    return directions;
  }
  findAllNodesOnPath(start, finish, path = [0]){
    let STACK = [];
    let NODES = [];
    let NodeMap = this.setNodeMap("AllNodes", path);
    STACK.push(start);
    while (STACK.length > 0){
      let node = STACK.pop();
      NODES.push(node);
      NodeMap[node.x][node.y].visited = true;
      if (GRID.same(node, finish)) continue;
      let dirs = this.directionsFromVisitedNodeMap(node, NodeMap);
      for (const d of dirs){
        STACK.push(node.add(d));
      }
    }
    return NODES;
  }
  findPath_AStar_fast(start, finish, path = [0]) {
    var Q = new NodeQ("priority");
    let NodeMap = this.setNodeMap("AStar", path);

    NodeMap[start.x][start.y].distance = start.distance(finish);
    NodeMap[start.x][start.y].path = 0;
    NodeMap[start.x][start.y].setPriority();

    Q.queueSimple(NodeMap[start.x][start.y]);
    while (Q.size() > 0) {
      let node = Q.dequeue();
      for (let D = 0; D < ENGINE.directions.length; D++) {
        //allows crossing!
        let x =
          (node.grid.x + ENGINE.directions[D].x + this.width) % this.width;
        let y =
          (node.grid.y + ENGINE.directions[D].y + this.height) % this.height;

        let nextNode = NodeMap[x][y];
        if (nextNode) {
          if (nextNode.path > node.path + 1) {
            nextNode.path = node.path + 1;
            nextNode.prev = node.grid;
            nextNode.distance = nextNode.grid.distance(finish);
            nextNode.setPriority();
            Q.queueSimple(nextNode);
            if (nextNode.distance === 0) {
              return NodeMap;
            }
          }
        }
      }
    }
    return null;
  }
  findPath_AStar(
    start,
    finish,
    path = [0],
    allowCross = false,
    maxPath = Infinity,
    maxIterations = Infinity
  ) {
    var Q = new NodeQ("distance");
    let NodeMap = this.setNodeMap("tempNodeMap", path);
    Q.list.push(new SearchNode(start, finish));
    if (Q.list[0].dist === 0) {
      Q.list[0].status = "Overlap";
      return Q.list[0];
    }
    NodeMap[start.x][start.y].distance = start.distance(finish);
    var selected;
    var iteration = 0;
    while (Q.list.length > 0) {
      iteration++;
      selected = Q.list.shift();

      if (selected.path > maxPath) {
        selected.status = "PathTooLong";
        return selected;
      }

      let dirs = this.getDirectionsFromNodeMap(
        selected.grid,
        NodeMap,
        allowCross
      );
      for (let q = 0; q < dirs.length; q++) {
        let HG = selected.grid.add(dirs[q]);

        if (allowCross) {
          if (this.outside(HG)) {
            HG = this.toOtherSide(HG);
          }
        }

        let history = [].concat(selected.history);
        history.push(HG);
        let I_stack = [].concat(selected.stack);
        I_stack.push(dirs[q]);
        let fork = new SearchNode(
          HG,
          finish,
          I_stack,
          selected.path + 1,
          history,
          iteration
        );
        if (fork.dist === 0) {
          fork.status = "Found";
          return fork;
        }
        let node = NodeMap[fork.grid.x][fork.grid.y];
        if (fork.path < node.distance) {
          node.distance = fork.path;
          Q.queue(fork);
        }
      }

      if (iteration > maxIterations) {
        selected.status = "Abandoned";
        return selected;
      }
    }
    selected.status = "NoSolution";
    return selected;
  }
  setStackValue(stack, value) {
    for (const grid of stack) {
      this.setValue(grid, value);
    }
  }
  floodFill(grid, value, condition = [0]) {
    var Q = [grid];
    let NodeMap = this.setNodeMap("floodFillNodeMap", condition);
    var selected;
    let iterations = 0;
    while (Q.length > 0) {
      selected = Q.shift();
      let dirs = this.getDirectionsFromNodeMap(selected, NodeMap);
      for (let q = 0; q < dirs.length; q++) {
        let next = selected.add(dirs[q]);
        NodeMap[next.x][next.y] = null;
        Q.push(next);
      }
      this.setValue(selected, value);
      iterations++;
    }
    return iterations;
  }
  floodFillSearch(grid, search, condition = [0]) {
    var Q = [grid];
    let NodeMap = this.setNodeMap("floodFillNodeMap", condition);
    var selected;
    while (Q.length > 0) {
      selected = Q.shift();
      let dirs = this.getDirectionsFromNodeMap(selected, NodeMap);
      for (let q = 0; q < dirs.length; q++) {
        let next = selected.add(dirs[q]);
        NodeMap[next.x][next.y] = null;
        Q.push(next);
      }
      if (selected.x === search.x && selected.y === search.y) {
        return true;
      }
    }
    return false;
  }
  getDirections(grid, value, leaveOut) {
    var directions = [];
    for (let D = 0; D < ENGINE.directions.length; D++) {
      if (!leaveOut.same(ENGINE.directions[D])) {
        let newGrid = grid.add(ENGINE.directions[D]);
        if (this.outside(newGrid)) {
          if (GRID.SETTING.ALLOW_CROSS) {
            newGrid = this.toOtherSide(newGrid);
          } else continue;
        }
        if (this.value(newGrid, value)) {
          directions.push(ENGINE.directions[D]);
        }
      }
    }
    return directions;
  }
  findPathByValue(grid, follow, find, firstDir) {
    let NodeMap = this.setNodeMap("searchValue", [follow, find]);
    let back = grid.add(firstDir.mirror());
    NodeMap[back.x][back.y].visited = true;
    let Q = [new BlindNode(grid)];
    let iteration = 0;
    while (true){
      let T = [];
      for (const q of Q){
        if (this.value(q.grid, find)){
          q.status = "Found";
          return q;
        }
        NodeMap[q.grid.x][q.grid.y].visited = true;
        let dirs = this.directionsFromVisitedNodeMap(q.grid, NodeMap);
        for (const dir of dirs){
          let nextGrid = q.grid.add(dir);
          let history = [].concat(q.history);
          history.push(nextGrid);
          let dirStack = [].concat(q.stack);
          dirStack.push(dir);
          let fork = new BlindNode(nextGrid, dirStack, q.path + 1, history, iteration);
          T.push(fork);
        }
      }
      Q = T;
      iteration++;
    }
  }
  cutPath(path, goodValue) {
    let start = 0;
    let end = path.length - 1;
    let mid;
    while (true) {
      mid = Math.floor((end + start) / 2);
      if (mid === start) {
        return path[mid];
      }
      if (this.value(path[mid], goodValue)) {
        start = mid;
      } else {
        end = mid;
      }
    }
  }
  followPathUntil(path, goodValue){
    for (let i = 1; i < path.length; i++){
      if (!this.value(path[i], goodValue)){
        return path[i-1];
      }
    }
    return path.last();
  }
  xFilterNodes(nodes, badValue){
    let goodNodes = [];
    for (const node of nodes){
      let ok = true;
      for (const dir of ENGINE.corners){
        let check = node.add(dir);
        if (this.value(check, badValue)){
          ok = false;
          break;
        }
      }
      if (ok){
        goodNodes.push(node);
      }
    }
    return goodNodes;
  }
}
//END
console.log(`%cGRID ${GRID.VERSION} loaded.`, GRID.CSS);
