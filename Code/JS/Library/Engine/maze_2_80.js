///////////////////////Dungeon.js///////////////
//                                            //
//        Procedureal maze and dungeon        //
//             generation: 2.80               //
//                                            //
//    dependencies: Prototype LS, ENGINE      //
////////////////////////////////////////////////

/*
TODO:

bugs:

*/

"use strict";

class PathNode {
  constructor(x, y) {
    this.distance = Infinity;
    this.prev = null;
    this.grid = new Grid(x, y);
  }
}
class Room {
  constructor(id, area) {
    this.id = id;
    this.area = area;
    this.squareSize = area.w * area.h;
    this.type = "common";
    this.door = [];
    this.reserved = [];
    this.enemyStartPosition = [];
  }
  randomGrid() {
    let grid;
    do {
      let x = RND(this.area.x, this.area.x + this.area.w - 1);
      let y = RND(this.area.y, this.area.y + this.area.h - 1);
      grid = new Grid(x, y);
    } while (grid.isInAt(this.reserved) !== -1);
    return grid;
  }
  random_Uninhabited_Grid(obstacles = []) {
    let grid;
    do {
      let x = RND(this.area.x, this.area.x + this.area.w - 1);
      let y = RND(this.area.y, this.area.y + this.area.h - 1);
      grid = new Grid(x, y);
    } while (
      grid.isInAt(this.enemyStartPosition) !== -1 ||
      grid.isInAt(obstacles) !== -1
    );
    this.enemyStartPosition.push(grid);
    return grid;
  }
  hasSpace() {
    if (this.reserved.length / this.squareSize > 0.5) return false;
    else return true;
  }
}
class Tree {
  constructor(leaf) {
    this.leaf = leaf;
    this.left = null;
    this.right = null;
  }
  getLeafs() {
    if (this.left === null && this.right === null) {
      return [this.leaf];
    } else return [].concat(this.left.getLeafs(), this.right.getLeafs());
  }
  hasBothKids() {
    if (this.left !== null && this.right !== null) {
      return true;
    } else return false;
  }
  liveBranch() {
    if (this.left === null || this.right === null) return false;
    return this.left.hasBothKids() && this.right.hasBothKids();
  }
  deadEnd() {
    if (this.left === null && this.right === null) {
      return true;
    } else return false;
  }
}
class Bias {
  constructor(size) {
    this.size = size;
    this.reset();
  }
  reset() {
    this.current = 0;
    this.active = false;
    this.direction = null;
  }
  activate(dir) {
    this.active = true;
    this.direction = dir;
    this.current++;
  }
  next() {
    this.current++;
    if (this.current >= this.size) this.reset();
  }
}
class Maze {
  constructor(
    sizeX,
    sizeY,
    start,
    seedGrid = this.createGrid(sizeX, sizeY),
    protectSeed = false
  ) {
    this.type = "MAZE";
    this.grid = seedGrid;
    if (protectSeed) {
      this.protectedGrid = this.grid.clone();
    } else {
      this.protectedGrid = null;
    }
    this.width = sizeX;
    this.height = sizeY;
    this.maxX = sizeX - 2;
    this.maxY = sizeY - 2;
    this.minX = 1;
    this.minY = 1;
    if (MAZE.storeDeadEnds) this.deadEnds = new Set();
    if (MAZE.useBias) this.bias = new Bias(MAZE.bias);
    this.density = null;

    let STACK = [];
    let selected, nextBranchPointer;
    let count = 0;
    let branch = 0;

    if (MAZE.storeDeadEnds) {
      this.deadEnds.add(start);
    }

    do {
      branch++;
      count = 0;
      do {
        count++;
        this.dot(start);
        let pointers = this.nextPointers(start);
        if (pointers.length > 0) {
          if (MAZE.useBias && this.bias.active) {
            let check = this.bias.direction.isInPointerArray(pointers);
            if (check !== -1) {
              selected = pointers.splice(check, 1)[0];
              this.bias.next();
            } else {
              selected = pointers.removeRandom();
              if (MAZE.useBias) this.bias.activate(selected.vector);
            }
          } else {
            selected = pointers.removeRandom();
            if (MAZE.useBias) this.bias.activate(selected.vector);
          }
          start = selected.grid;
          STACK = [...STACK, ...pointers];
        } else {
          if (MAZE.storeDeadEnds) {
            this.deadEnds.add(start);
          }
          break;
        }
      } while (true);
      do {
        if (STACK.length === 0) return;
        nextBranchPointer = STACK.pop();
      } while (!this.safePointer(nextBranchPointer));
      start = nextBranchPointer.grid;
    } while (true);

    this.recheckDeadEnds();
  }
  setVal(grid, value) {
    this.grid[grid.y] = this.grid[grid.y].changeChar(grid.x, value);
  }
  dot(grid) {
    this.setVal(grid, "0");
  }
  wall(grid) {
    this.setVal(grid, "1");
  }
  isOut(grid) {
    if (
      grid.x > this.maxX ||
      grid.x < this.minX ||
      grid.y > this.maxY ||
      grid.y < this.minY
    ) {
      return true;
    } else return false;
  }
  isDot(grid) {
    if (this.isOut(grid)) return false;
    let block = this.grid[grid.y].charAt(grid.x);
    if (block === "0") {
      return true;
    } else return false;
  }
  isProtected(grid) {
    if (this.isOut(grid)) return false;
    if (this.protectedGrid === null) return false;
    let block = this.protectedGrid[grid.y].charAt(grid.x);
    if (block === "0") {
      return true;
    } else return false;
  }
  isWall(grid) {
    if (this.isOut(grid)) return false;
    let block = this.grid[grid.y].charAt(grid.x);
    if (block === "1") {
      return true;
    } else return false;
  }
  isMazeWall(grid) {
    //this variation does not ignore outer border wall!
    if (
      grid.x >= this.width ||
      grid.x < 0 ||
      grid.y >= this.height ||
      grid.y < 0
    )
      return false;
    let block = this.grid[grid.y].charAt(grid.x);
    if (block === "1") {
      return true;
    } else return false;
  }
  nextPointers(grid) {
    var pointerCandidates = [];
    for (let q = 0; q < 4; q++) {
      let checkedGrid = grid.add(ENGINE.directions[q]);
      if (!this.isOut(checkedGrid) && this.isWall(checkedGrid)) {
        pointerCandidates.push(new Pointer(checkedGrid, ENGINE.directions[q]));
      }
    }
    const PL = pointerCandidates.length;
    for (let w = PL - 1; w >= 0; w--) {
      if (!this.safePointer(pointerCandidates[w]))
        pointerCandidates.splice(w, 1);
    }
    return pointerCandidates;
  }
  safePointer(pointer) {
    let allDirections = [...ENGINE.directions, ...ENGINE.corners];
    let back = pointer.vector.mirror();
    back.trimMirror(allDirections);
    const ADL = allDirections.length;
    for (let q = 0; q < ADL; q++) {
      let testGrid = pointer.grid.add(allDirections[q]);
      if (this.isDot(testGrid)) return false;
    }
    return true;
  }
  measureDensity() {
    let total = (this.maxY - this.minY) * (this.maxX - this.minX);
    let empty = this.allDots();
    let density = empty / total;
    return density.toFixed(3);
  }
  allDots() {
    let empty = 0;
    for (let y = this.minY; y <= this.maxY; y++) {
      for (let x = this.minX; x <= this.maxX; x++) {
        let grid = new Grid(x, y);
        if (this.isDot(grid)) empty++;
      }
    }
    return empty;
  }
  missingToDensity(density) {
    let dots = this.allDots();
    let total = (this.maxY - this.minY) * (this.maxX - this.minX);
    let required = total * density;
    let missing = Math.floor(required) - dots;
    return missing;
  }
  isDeadEnd(grid) {
    let dots = 0;
    for (let q = 0; q < ENGINE.directions.length; q++) {
      let nextGrid = grid.add(ENGINE.directions[q]);
      if (this.isDot(nextGrid)) dots++;
    }
    if (dots === 1) {
      return true;
    } else return false;
  }
  hasConnections(grid) {
    let dots = 0;
    for (let q = 0; q < ENGINE.directions.length; q++) {
      let nextGrid = grid.add(ENGINE.directions[q]);
      if (this.isDot(nextGrid)) dots++;
    }
    return dots;
  }
  polishDeadEnds() {
    this.deadEnds = [...this.deadEnds];
    for (let q = this.deadEnds.length - 1; q >= 0; q--) {
      let deadEnd = this.deadEnds[q];
      if (!this.isDeadEnd(deadEnd)) continue;
      let dir = this.deadEndDirection(deadEnd);
      let next = deadEnd.add(dir);
      if (this.hasConnections(next) > 2) {
        this.wall(deadEnd);
        this.deadEnds.splice(q, 1);
      }
    }
  }
  connectionCandidates(DeadEnd) {
    let possible = [];
    for (let z = 0; z < 4; z++) {
      let bridge = DeadEnd.add(ENGINE.directions[z]);
      if (this.isWall(bridge)) {
        let test = bridge.add(ENGINE.directions[z]);
        if (this.isDot(test)) {
          let connections = this.hasConnections(bridge);
          if (connections === 2 && !this.isInAnyRoom(test)) {
            possible.push(bridge);
          }
        }
      }
    }
    return possible;
  }
  connectSomeDeadEnds(butLeave, safety = 0) {
    //does not create doors, ignores protection!
    this.deadEnds = [...this.deadEnds];
    let DEL = this.deadEnds.length - butLeave;
    let candidates = this.deadEnds.removeRandomPool(DEL);
    let CL = candidates.length;
    for (let q = 0; q < CL; q++) {
      let DeadEnd = candidates[q];
      if (this.isDeadEnd(DeadEnd)) {
        let possible = this.connectionCandidates(DeadEnd);

        if (possible.length) {
          this.dot(possible.chooseRandom());
        } else {
          this.deadEnds.push(DeadEnd);
        }
      }
    }
    for (let w = this.deadEnds.length - 1; w >= 0; w--) {
      let DeadEnd = this.deadEnds[w];
      if (!this.isDeadEnd(DeadEnd)) {
        this.deadEnds.splice(w, 1);
      }
    }

    safety++;
    if (safety > 10) return;
    if (this.deadEnds.length > butLeave)
      this.connectSomeDeadEnds(butLeave, safety);
    return;
  }
  connectDeadEnds() {
    //can create doors!
    this.deadEnds = [...this.deadEnds];
    var round = 1;
    do {
      var changed = 0;
      for (let q = this.deadEnds.length - 1; q >= 0; q--) {
        let DeadEnd = this.deadEnds[q];
        let did = false;
        for (let z = 0; z < 4; z++) {
          let bridge = DeadEnd.add(ENGINE.directions[z]);
          if (this.isWall(bridge)) {
            let test = bridge.add(ENGINE.directions[z]);
            if (this.isDot(test)) {
              let connections = this.hasConnections(bridge);
              if (connections === 2) {
                this.dot(bridge);
                changed++;
                did = true;
              }
            }
          }
        }
        if (did) this.deadEnds.splice(q, 1);
      }
      var tempDE = new Set();
      for (let q = this.deadEnds.length - 1; q >= 0; q--) {
        let DeadEnd = this.deadEnds[q];
        if (this.isDeadEnd(DeadEnd)) {
          let dir = this.deadEndDirection(DeadEnd);
          let newDE = DeadEnd.add(dir);
          this.wall(DeadEnd);
          if (this.isDeadEnd(newDE)) tempDE.add(newDE);
        }
        this.deadEnds.splice(q, 1);
      }
      this.deadEnds = [...tempDE];
      round++;
    } while (this.deadEnds.length > 0);
  }
  deadEndDirection(DE) {
    for (let z = 0; z < 4; z++) {
      let test = DE.add(ENGINE.directions[z]);
      if (this.isDot(test)) return ENGINE.directions[z];
    }
    return null;
  }
  addConnections() {
    //add connections but not to restricted
    let startY = this.minY + 1;
    let startX = this.minX + 1;
    let missing = this.missingToDensity(MAZE.targetDensity);
    let candidates = getCandidates(startY, startX, this);
    do {
      if (candidates.length === 0) break;
      let selected = candidates.removeRandom();
      if (this.hasAnyConnection(selected)) {
        this.dot(selected);
        missing--;
      } else continue;
    } while (missing > 0);

    function getCandidates(startY, startX, pThis) {
      let candidates = [];
      for (let y = startY; y < pThis.maxY; y++) {
        for (let x = startX; x < pThis.maxX; x++) {
          let test = new Grid(x, y);
          if (pThis.hasAnyConnection(test)) {
            candidates.push(test);
          }
        }
      }
      return candidates;
    }
  }
  hasAnyConnection(grid) {
    if (
      this.hasVerticalConnections(grid) ||
      this.hasHorizontalConnections(grid)
    ) {
      return true;
    } else return false;
  }
  hasVerticalConnections(grid) {
    if (this.isBridge(grid, UP, DOWN)) {
      return true;
    } else return false;
  }
  hasHorizontalConnections(grid) {
    if (this.isBridge(grid, LEFT, RIGHT)) {
      return true;
    } else return false;
  }
  isBridge(grid, v1, v2) {
    if (this.isWall(grid) && this.hasConnections(grid) === 2) {
      let D1 = grid.add(v1);
      let D2 = grid.add(v2);
      if (
        this.isDot(D1) &&
        this.isDot(D2) &&
        !this.isProtected(D1) &&
        !this.isProtected(D2)
      ) {
        return true;
      } else return false;
    } else return false;
  }
  createGrid(x, y) {
    var temp = [];
    var string = "1".repeat(x);
    for (let iy = 0; iy < y; iy++) {
      temp.push(string);
    }
    return temp;
  }
  recheckDeadEnds() {
    for (let q = this.deadEnds.length - 1; q >= 0; q--) {
      let deadEnd = this.deadEnds[q];
      if (!this.isDeadEnd(deadEnd)) this.deadEnds.splice(q, 1);
    }
  }
  open() {
    if (MAZE.openDirs === null) {
      console.error("Supply array of directions for opening the maze");
      return true;
    }
    let x = null;
    let y = null;
    for (const dir of MAZE.openDirs) {
      let done = false;
      if (dir.x === 0) {
        x = Math.floor(this.width / 2);
      } else if (dir.x === -1) {
        x = 0;
      } else {
        x = this.width - 1;
      }
      if (dir.y === 0) {
        y = Math.floor(this.height / 2);
      } else if (dir.y === -1) {
        y = 0;
      } else {
        y = this.height - 1;
      }
      if (dir.x === 0) {
        let look = dir.mirror();
        let start = new Grid(x, y);
        let check = start.add(look);
        if (this.isDot(check)) {
          this.dot(start);
          done = true;
          continue;
        }

        let left = start;
        let right = start;
        do {
          left = left.add(LEFT);
          right = right.add(RIGHT);
          check = left.add(look);
          if (this.isDot(check)) {
            this.dot(left);
            done = true;
            break;
          }
          check = right.add(look);
          if (this.isDot(check)) {
            this.dot(right);
            done = true;
            break;
          }
        } while (left.x > 0 && right.x < this.width - 1);
      } else if (dir.y === 0) {
        let look = dir.mirror();
        let start = new Grid(x, y);
        let check = start.add(look);
        if (this.isDot(check)) {
          this.dot(start);
          done = true;
          continue;
        }
        let up = start;
        let down = start;
        do {
          up = up.add(UP);
          down = down.add(DOWN);
          check = up.add(look);
          if (this.isDot(check)) {
            this.dot(up);
            done = true;
            break;
          }
          check = down.add(look);
          if (this.isDot(check)) {
            this.dot(down);
            done = true;
            break;
          }
        } while (up.y > 0 && down.y < this.height - 1);
      }
      if (!done) {
        console.error("Opening not done on face:", dir);
        return false;
      }
    }
    return true;
  }
}
class MasterDungeon {
  constructor(sizeX, sizeY) {
    this.type = "DUNGEON";
    this.width = sizeX;
    this.height = sizeY;
    this.maxX = sizeX - 2;
    this.maxY = sizeY - 2;
    this.minX = 1;
    this.minY = 1;
    this.nodeMap = null;
    this.entrance = null;
    this.exit = null;
    this.gate = null;
    this.door = null;
    this.temple = null;
    this.silverKey = null;
    this.goldKey = null;
    this.reserved = [];
    this.enemyStartPosition = [];
    this.obstacles = [];
  }
  connectRooms() {
    for (let q = 0, RL = this.rooms.length; q < RL; q++) {
      let room = this.rooms[q];
      if (room.type !== "common") continue;
      let N;

      if (DUNGEON.SINGLE_DOOR) {
        N = 1;
      } else if (room.squareSize < 20) {
        N = RND(1, 2);
      } else N = RND(2, 4);

      this.connectToGrid(room, N);
      room.priority = 1 + q;
    }
  }
  isDot(grid) {
    if (this.isOut(grid)) return false;
    let block = this.grid[grid.y].charAt(grid.x);
    if (block === "0") {
      return true;
    } else return false;
  }
  isWall(grid) {
    if (this.isOut(grid)) return false;
    let block = this.grid[grid.y].charAt(grid.x);
    if (block === "1") {
      return true;
    } else return false;
  }
  isMazeWall(grid) {
    //this variation does not ignore outer border wall!
    if (
      grid.x >= this.width ||
      grid.x < 0 ||
      grid.y >= this.height ||
      grid.y < 0
    )
      return false;
    let block = this.grid[grid.y].charAt(grid.x);
    if (block === "1") {
      return true;
    } else return false;
  }
  isOut(grid) {
    if (
      grid.x > this.maxX ||
      grid.x < this.minX ||
      grid.y > this.maxY ||
      grid.y < this.minY
    ) {
      return true;
    } else return false;
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
  hasConnections(grid) {
    let dots = 0;
    for (let q = 0; q < ENGINE.directions.length; q++) {
      let nextGrid = grid.add(ENGINE.directions[q]);
      if (this.isDot(nextGrid)) dots++;
    }
    return dots;
  }
  isBridge(grid, v1, v2) {
    if (this.isWall(grid) && this.hasConnections(grid) === 2) {
      if (this.isDot(grid.add(v1)) && this.isDot(grid.add(v2))) {
        return true;
      } else return false;
    } else return false;
  }
  connectToGrid(room, N) {
    let connections = this.findConnections(room);
    let NoOfDoors = Math.min(N, connections.length);
    if (NoOfDoors === 0) {
      console.error(
        "Cannot connect room to grid with standard procedure ERROR"
      );
      console.warn("Tunneling!");
      return this.tunnelToGrid(room, N);
    } else {
      do {
        let door = connections.removeRandom();
        this.dot(door);
        room.door.push(door);
        NoOfDoors--;
      } while (NoOfDoors > 0);
    }
  }
  tunnelToGrid(room, N) {
    let connections = this.findTunnels(room);
    let NoOfDoors = Math.min(N, connections.length);
    if (NoOfDoors === 0) {
      console.error("no connections even after tunneling!");
      return;
    } else {
      do {
        let tunnel = connections.removeRandom();
        let door = tunnel.start;
        this.dot(door);
        this.dot(door.add(tunnel.direction));
        room.door.push(door);
        NoOfDoors--;
      } while (NoOfDoors > 0);
    }
  }
  findTunnels(room) {
    room = room.area;
    var pool = [];
    let up = [];
    let down = [];
    let left = [];
    let right = [];
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      let bridge = new Grid(x, room.y - 1);
      let outer = bridge.add(UP);
      let next = outer.add(UP);
      if (
        this.isDot(next) &&
        this.hasConnections(bridge) === 1 &&
        this.hasConnections(outer) === 1
      ) {
        up.push({ start: bridge, direction: UP });
      }
    }
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      let bridge = new Grid(x, room.y + room.h);
      let outer = bridge.add(DOWN);
      let next = outer.add(DOWN);
      if (
        this.isDot(next) &&
        this.hasConnections(bridge) === 1 &&
        this.hasConnections(outer) === 1
      ) {
        down.push({ start: bridge, direction: DOWN });
      }
    }
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      let bridge = new Grid(room.x - 1, y);
      let outer = bridge.add(LEFT);
      let next = outer.add(LEFT);
      if (
        this.isDot(next) &&
        this.hasConnections(bridge) === 1 &&
        this.hasConnections(outer) === 1
      ) {
        left.push({ start: bridge, direction: LEFT });
      }
    }
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      let bridge = new Grid(room.x + room.w, y);
      let outer = bridge.add(RIGHT);
      let next = outer.add(RIGHT);
      if (
        this.isDot(next) &&
        this.hasConnections(bridge) === 1 &&
        this.hasConnections(outer) === 1
      ) {
        right.push({ start: bridge, direction: RIGHT });
      }
    }
    if (up.length) pool.push(up.chooseRandom());
    if (down.length) pool.push(down.chooseRandom());
    if (left.length) pool.push(left.chooseRandom());
    if (right.length) pool.push(right.chooseRandom());
    return pool;
  }
  findConnections(room) {
    room = room.area;
    var pool = [];
    let up = [];
    let down = [];
    let left = [];
    let right = [];
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      let bridge = new Grid(x, room.y - 1);
      let next = bridge.add(UP);
      if (this.isDot(next) && this.hasConnections(bridge) === 2) {
        up.push(bridge);
      }
    }
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      let bridge = new Grid(x, room.y + room.h);
      let next = bridge.add(DOWN);
      if (this.isDot(next) && this.hasConnections(bridge) === 2) {
        down.push(bridge);
      }
    }
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      let bridge = new Grid(room.x - 1, y);
      let next = bridge.add(LEFT);
      if (this.isDot(next) && this.hasConnections(bridge) === 2) {
        left.push(bridge);
      }
    }
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      let bridge = new Grid(room.x + room.w, y);
      let next = bridge.add(RIGHT);
      if (this.isDot(next) && this.hasConnections(bridge) === 2) {
        right.push(bridge);
      }
    }
    if (up.length) pool.push(up.chooseRandom());
    if (down.length) pool.push(down.chooseRandom());
    if (left.length) pool.push(left.chooseRandom());
    if (right.length) pool.push(right.chooseRandom());
    return pool;
  }
  centerTopEntry(room) {
    //console.log("centerTopEntry", room);
    return new Grid(room.area.x + (room.area.h - 1) / 2, room.area.y - 1);
  }
  randomEntry(room) {
    room = room.area;
    var pool = [];
    for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
      pool.push(new Grid(x, room.y - 1));
      pool.push(new Grid(x, room.y + room.h));
    }
    for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
      pool.push(new Grid(room.x - 1, y));
      pool.push(new Grid(room.x + room.w, y));
    }
    return pool.chooseRandom();
  }
  singleCenteredRoom() {
    let roomArr = [];
    let size = DUNGEON.MAX_ROOM;
    let x = Math.floor((this.width - size) / 2);
    let y = Math.floor((this.height - size) / 2);
    let area = new Area(x, y, size, size);
    this.carveRoom(area);
    let room = new Room(0, area);
    roomArr.push(room);
    return roomArr;
  }
  makeRooms() {
    let roomArr = [];
    let id = 0;
    if (DUNGEON.LIMIT_ROOMS) {
      this.areas.shuffle();
    }
    for (const area of this.areas) {
      let W = area.w - 2 * DUNGEON.MIN_PADDING;
      let H = area.h - 2 * DUNGEON.MIN_PADDING;
      W = RND(DUNGEON.MIN_ROOM, Math.min(W, DUNGEON.MAX_ROOM));
      H = RND(DUNGEON.MIN_ROOM, Math.min(H, DUNGEON.MAX_ROOM));
      let X = area.x + DUNGEON.MIN_PADDING;
      let Y = area.y + DUNGEON.MIN_PADDING;
      let DW = area.w - W - 2 * DUNGEON.MIN_PADDING;
      let DH = area.h - H - 2 * DUNGEON.MIN_PADDING;
      X += RND(0, DW);
      Y += RND(0, DH);
      let room = new Area(X, Y, W, H);
      this.carveRoom(room);
      let RoomObj = new Room(id, room);
      area.room = RoomObj;
      roomArr.push(RoomObj);
      id++;
      if (DUNGEON.LIMIT_ROOMS) {
        if (roomArr.length === DUNGEON.ROOM_LIMIT) {
          break;
        }
      }
    }
    return roomArr;
  }
  carveRoom(room) {
    for (let x = room.x; x < room.x + room.w; x++) {
      for (let y = room.y; y < room.y + room.h; y++) {
        let grid = new Grid(x, y);
        this.dot(grid);
      }
    }
  }
  setVal(grid, value) {
    this.grid[grid.y] = this.grid[grid.y].changeChar(grid.x, value);
  }
  dot(grid) {
    this.setVal(grid, "0");
  }
  wall(grid) {
    this.setVal(grid, "1");
  }
  createGrid(x, y) {
    var temp = [];
    var string = "1".repeat(x);
    for (let iy = 0; iy < y; iy++) {
      temp.push(string);
    }
    return temp;
  }
  configure() {
    this.setEntrance();
    this.setExit();
    this.setGatesAndKeys();
    this.setTemple();
  }
  setGatesAndKeys() {
    let exit = this.findRoom("end");
    this.gate = exit.door[0];
    let key = this.findRoom("key");
    this.goldKey = this.findMiddleSpace(key.area);
    key.reserved.push(this.goldKey);
    this.door = key.door[0];
    this.reserved.push(this.gate);
    this.reserved.push(this.door);
    if (coinFlip()) {
      this.silverKey = this.deadEnds.removeRandom();
      this.reserved.push(this.silverKey);
    } else {
      let silver = this.findRoom("common");
      silver.type = "silver";
      this.silverKey = this.findMiddleSpace(silver.area);
      silver.reserved.push(this.silverKey);
    }
  }
  setEntrance() {
    let start = this.findRoom("start");
    this.entrance = this.findMiddleSpace(start.area);
    start.reserved.push(this.entrance);
    start.enemyStartPosition.push(this.entrance);
  }
  setTemple() {
    let start = this.findRoom("temple");
    this.temple = this.findMiddleSpace(start.area);
    start.reserved.push(this.temple);
  }
  setExit() {
    let exit = this.findRoom("end");
    this.exit = this.findMiddleSpace(exit.area);
    exit.reserved.push(this.exit);
  }
  findMiddleSpace(area) {
    let pool = [];
    for (let x = area.x + 1; x < area.x + area.w - 1; x++) {
      for (let y = area.y + 1; y < area.y + area.h - 1; y++) {
        pool.push(new Grid(x, y));
      }
    }
    return pool.chooseRandom();
  }
  findSpace(area) {
    let pool = [];
    for (let x = area.x; x < area.x + area.w; x++) {
      for (let y = area.y; y < area.y + area.h; y++) {
        pool.push(new Grid(x, y));
      }
    }
    return pool.chooseRandom();
  }
  findRoom(type) {
    let room;
    for (let q = 0, LN = this.rooms.length; q < LN; q++) {
      room = this.rooms[q];
      if (room.type === type) return room;
    }
    return null;
  }
  isDeadEnd(grid) {
    let dots = 0;
    for (let q = 0; q < ENGINE.directions.length; q++) {
      let nextGrid = grid.add(ENGINE.directions[q]);
      if (this.isDot(nextGrid)) dots++;
    }
    if (dots === 1) {
      return true;
    } else return false;
  }
  recheckDeadEnds() {
    for (let q = this.deadEnds.length - 1; q >= 0; q--) {
      let deadEnd = this.deadEnds[q];
      if (!this.isDeadEnd(deadEnd)) this.deadEnds.splice(q, 1);
    }
  }
  isInRoom(grid, room) {
    if (
      grid.x >= room.area.x &&
      grid.x <= room.area.x + room.area.w - 1 &&
      grid.y >= room.area.y &&
      grid.y <= room.area.y + room.area.h - 1
    )
      return true;
    else return false;
  }
  isInRoomOrItsDoors(grid, room) {
    if (this.isInRoom(grid, room)) {
      return true;
    } else {
      for (let q = 0; q < room.door.length; q++) {
        if (grid.same(room.door[q])) return true;
      }
    }
    return false;
  }
  isInAnyRoom(grid) {
    for (let q = 0, LN = this.rooms.length; q < LN; q++) {
      let room = this.rooms[q];
      if (this.isInRoom(grid, room)) return true;
    }
    return false;
  }
  isInWhichRoom(grid) {
    for (let q = 0, LN = this.rooms.length; q < LN; q++) {
      let room = this.rooms[q];
      if (this.isInRoom(grid, room)) return room;
    }
    return null;
  }
  getFreeCorrGrid(obstacles = []) {
    let grid;
    do {
      let x = RND(this.minX, this.maxX);
      let y = RND(this.minY, this.maxY);
      grid = new Grid(x, y);
    } while (
      !this.isDot(grid) ||
      this.isInAnyRoom(grid) ||
      grid.isInAt(this.reserved) !== -1 ||
      grid.isInAt(obstacles) !== -1
    );
    this.reserved.push(grid);
    return grid;
  }
  getUninhabitedCorrGrid(obstacles = []) {
    let grid;
    do {
      let x = RND(this.minX, this.maxX);
      let y = RND(this.minY, this.maxY);
      grid = new Grid(x, y);
    } while (
      !this.isDot(grid) ||
      this.isInAnyRoom(grid) ||
      grid.isInAt(this.enemyStartPosition) !== -1 ||
      grid.isInAt(obstacles) !== -1
    );
    this.enemyStartPosition.push(grid);
    return grid;
  }
  getAnyGrid() {
    let x = RND(this.minX, this.maxX);
    let y = RND(this.minY, this.maxY);
    let grid = new Grid(x, y);
    return grid;
  }
  getFreeAnyGrid() {
    let x = RND(this.minX, this.maxX);
    let y = RND(this.minY, this.maxY);
    let grid = new Grid(x, y);
    if (!this.isDot(grid)) return this.getFreeAnyGrid();
    let room = this.isInWhichRoom(grid);
    if (room !== null) {
      if (room.hasSpace()) {
        if (grid.isInAt(room.reserved) !== -1) {
          return this.getFreeAnyGrid();
        } else {
          room.reserved.push(grid);
        }
      } else return this.getFreeAnyGrid();
    } else {
      if (grid.isInAt(this.reserved) !== -1) {
        return this.getFreeAnyGrid();
      } else {
        this.reserved.push(grid);
        let isDE = grid.isInAt(this.deadEnds);
        if (isDE !== -1) this.deadEnds.splice(isDE, 1);
      }
    }
    return grid;
  }
  getFreeRoomGrid() {
    let room;
    do {
      room = this.rooms.chooseRandom();
    } while (!room.hasSpace());
    let grid = room.randomGrid();
    room.reserved.push(grid);
    return grid;
  }
  setObstacles() {
    this.obstacles.clear();
    this.obstacles = [...arguments].flat().filter((el) => el !== null);
  }
  setNodeMap(where = "nodeMap") {
    let map = [];
    for (let x = 0; x < this.width; x++) {
      map[x] = [];
      for (let y = 0; y < this.height; y++) {
        if (this.grid[y].charAt(x) === "1") {
          map[x][y] = null;
        } else {
          map[x][y] = new PathNode(x, y);
        }
      }
    }
    this.obstacles.forEach((obj) => (map[obj.x][obj.y] = null));
    this[where] = map;
    return map;
  }
  gridDistance(grid) {
    if (!this.nodeMap) return -1;
    return this.nodeMap[grid.x][grid.y].distance;
  }
  nextDirToGoal(grid) {
    if (!this.nodeMap) return -1;
    let prev = this.nodeMap[grid.x][grid.y].prev;
    return grid.direction(prev);
  }
  rectCircularCorridor(x, y, w, h) {
    for (let X = x; X < x + w; X++) {
      this.dot(new Grid(X, y));
      this.dot(new Grid(X, y + h - 1));
    }
    for (let Y = y; Y < y + h; Y++) {
      this.dot(new Grid(x, Y));
      this.dot(new Grid(x + w - 1, Y));
    }
  }
  connectionCandidates(DeadEnd) {
    let possible = [];
    for (let z = 0; z < 4; z++) {
      let bridge = DeadEnd.add(ENGINE.directions[z]);
      if (this.isWall(bridge)) {
        let test = bridge.add(ENGINE.directions[z]);
        if (this.isDot(test)) {
          let connections = this.hasConnections(bridge);
          if (connections === 2 && !this.isInAnyRoom(test)) {
            possible.push(bridge);
          }
        }
      }
    }
    return possible;
  }
  connectSomeDeadEnds(butLeave, safety = 0) {
    //does not create doors, ignores protection!
    this.deadEnds = [...this.deadEnds];
    let DEL = this.deadEnds.length - butLeave;
    let candidates = this.deadEnds.removeRandomPool(DEL);
    let CL = candidates.length;
    for (let q = 0; q < CL; q++) {
      let DeadEnd = candidates[q];
      if (this.isDeadEnd(DeadEnd)) {
        let possible = this.connectionCandidates(DeadEnd);

        if (possible.length) {
          this.dot(possible.chooseRandom());
        } else {
          this.deadEnds.push(DeadEnd);
        }
      }
    }
    for (let w = this.deadEnds.length - 1; w >= 0; w--) {
      let DeadEnd = this.deadEnds[w];
      if (!this.isDeadEnd(DeadEnd)) {
        this.deadEnds.splice(w, 1);
      }
    }

    safety++;
    if (safety > 10) return;
    if (this.deadEnds.length > butLeave)
      this.connectSomeDeadEnds(butLeave, safety);
    return;
  }
  addConnections() {
    //add connections but not to restricted
    let startY = this.minY + 1;
    let startX = this.minX + 1;
    let missing = this.missingToDensity(MAZE.targetDensity);
    let candidates = getCandidates(startY, startX, this);
    do {
      if (candidates.length === 0) break;
      let selected = candidates.removeRandom();
      if (this.hasAnyConnection(selected)) {
        this.dot(selected);
        missing--;
      } else continue;
    } while (missing > 0);

    function getCandidates(startY, startX, pThis) {
      let candidates = [];
      for (let y = startY; y < pThis.maxY; y++) {
        for (let x = startX; x < pThis.maxX; x++) {
          let test = new Grid(x, y);
          if (pThis.hasAnyConnection(test)) {
            candidates.push(test);
          }
        }
      }
      return candidates;
    }
  }
  hasAnyConnection(grid) {
    if (
      this.hasVerticalConnections(grid) ||
      this.hasHorizontalConnections(grid)
    ) {
      return true;
    } else return false;
  }
  hasVerticalConnections(grid) {
    if (this.isBridge(grid, UP, DOWN)) {
      return true;
    } else return false;
  }
  hasHorizontalConnections(grid) {
    if (this.isBridge(grid, LEFT, RIGHT)) {
      return true;
    } else return false;
  }
  isBridge(grid, v1, v2) {
    if (this.isWall(grid) && this.hasConnections(grid) === 2) {
      let D1 = grid.add(v1);
      let D2 = grid.add(v2);
      if (
        this.isDot(D1) &&
        this.isDot(D2) &&
        !this.isInAnyRoom(D1) &&
        !this.isInAnyRoom(D2)
      ) {
        return true;
      } else return false;
    } else return false;
  }
  measureDensity() {
    let total = (this.maxY - this.minY) * (this.maxX - this.minX);
    let empty = this.allDots();
    let density = empty / total;
    return density.toFixed(3);
  }
  allDots() {
    let empty = 0;
    for (let y = this.minY; y <= this.maxY; y++) {
      for (let x = this.minX; x <= this.maxX; x++) {
        let grid = new Grid(x, y);
        if (this.isDot(grid)) empty++;
      }
    }
    return empty;
  }
  missingToDensity(density) {
    let dots = this.allDots();
    let total = (this.maxY - this.minY) * (this.maxX - this.minX);
    let required = total * density;
    let missing = Math.floor(required) - dots;
    return missing;
  }
  polishDeadEnds() {
    this.deadEnds = [...this.deadEnds];
    for (let q = this.deadEnds.length - 1; q >= 0; q--) {
      let deadEnd = this.deadEnds[q];
      if (!this.isDeadEnd(deadEnd)) continue;
      let dir = this.deadEndDirection(deadEnd);
      let next = deadEnd.add(dir);
      if (this.hasConnections(next) > 2) {
        this.wall(deadEnd);
        this.deadEnds.splice(q, 1);
      }
    }
  }
  deadEndDirection(DE) {
    for (let z = 0; z < 4; z++) {
      let test = DE.add(ENGINE.directions[z]);
      if (this.isDot(test)) return ENGINE.directions[z];
    }
    return null;
  }
  recheckDeadEnds() {
    for (let q = this.deadEnds.length - 1; q >= 0; q--) {
      let deadEnd = this.deadEnds[q];
      if (!this.isDeadEnd(deadEnd)) this.deadEnds.splice(q, 1);
    }
  }
  removeLongDeadEnds() {
    for (let q = 0; q < this.deadEnds.length; q++) {
      let DE = this.deadEnds[q];
      while (this.isDeadEnd(DE)) {
        let dir = this.deadEndDirection(DE);
        let possible = this.connectionCandidates(DE);
        if (possible.length) {
          this.dot(possible.chooseRandom());
          break;
        } else {
          this.wall(DE);
          DE = DE.add(dir);
        }
      }
    }
  }
  scanForDeadEnds() {
    let deadEnds = [];
    for (let y = this.minY; y <= this.maxY; y++) {
      for (let x = this.minX; x <= this.maxX; x++) {
        let grid = new Grid(x, y);
        if (this.isDot(grid) && this.isDeadEnd(grid)) deadEnds.push(grid);
      }
    }
    return deadEnds;
  }
  findFreeCorner(corner, dir1, dir2) {
    let possible = [];
    while (true) {
      possible.push(corner);

      let dir1m = dir1.mirror();
      let c1 = corner;
      while (!this.isOut(c1.add(dir1m))) {
        c1 = c1.add(dir1m);
        possible.push(c1);
      }

      let dir2m = dir2.mirror();
      let c2 = corner;
      while (!this.isOut(c2.add(dir2m))) {
        c2 = c2.add(dir2m);
        possible.push(c2);
      }

      while (possible.length > 0) {
        let opt = possible.removeRandom();
        if (this.isDot(opt)) {
          return opt;
        }
      }

      corner = corner.add(dir1).add(dir2);
    }
  }
}
class Dungeon extends MasterDungeon {
  constructor(sizeX, sizeY) {
    super(sizeX, sizeY);
    this.grid = this.createGrid(sizeX, sizeY);
    if (DUNGEON.SINGLE_CENTERED_ROOM) {
      this.rooms = this.singleCenteredRoom();
    } else {
      this.mainArea = new Area(
        this.minX,
        this.minY,
        this.maxX - this.minX + 1,
        this.maxY - this.minY + 1
      );
      this.areaTree = splitArea(this.mainArea, DUNGEON.ITERATIONS);
      this.areas = this.areaTree.getLeafs();
      this.rooms = this.makeRooms();
    }
    this.rooms.sortByPropDesc("squareSize");
    if (this.rooms[0].squareSize < DUNGEON.BIG_ROOM) {
      DUNGEON.BIG_ROOM = this.rooms[0].squareSize;
    }
    let startingRoom = getRoom(this.rooms, "common", DUNGEON.BIG_ROOM);
    startingRoom.type = "start";
    let start = this.randomEntry(startingRoom);
    startingRoom.door.push(start);
    var randomMaze = MAZE.create(sizeX, sizeY, start, this.grid, true);
    this.grid = randomMaze.grid;
    if (randomMaze.deadEnds) this.deadEnds = randomMaze.deadEnds;
    if (randomMaze.density) this.density = randomMaze.density;
    if (DUNGEON.SET_ROOMS) {
      let endingRoom = getRoom(this.rooms, "common", DUNGEON.BIG_ROOM);
      endingRoom.type = "end";
      this.connectToGrid(endingRoom, 1);

      let keyRoom = getRoom(this.rooms, "common");
      keyRoom.type = "key";
      this.connectToGrid(keyRoom, 1);

      let templeRoom = getRoom(this.rooms, "common");
      templeRoom.type = "temple";
      this.connectToGrid(templeRoom, 1);
    }

    this.connectRooms();
    this.recheckDeadEnds();

    delete this.areas;
    delete this.areaTree;
    return;

    function splitArea(area, iteration) {
      var root = new Tree(area);
      if (area.w <= 2 * DUNGEON.PAD && area.h <= 2 * DUNGEON.PAD) return root;
      if (area.w > DUNGEON.FREE || area.h > DUNGEON.FREE) {
        if (iteration !== 0) {
          var splitRoot = randomSplit(area);
          root.left = splitArea(splitRoot[0], iteration - 1);
          root.right = splitArea(splitRoot[1], iteration - 1);
        }
      }
      return root;
    }
    function randomSplit(area) {
      if (area.w <= 2 * DUNGEON.PAD) {
        return horizontal(area);
      } else if (area.h <= 2 * DUNGEON.PAD) {
        return vertical(area);
      } else if (coinFlip()) {
        return horizontal(area);
      } else return vertical(area);

      function horizontal(area) {
        let r1, r2;
        r1 = new Area(
          area.x,
          area.y,
          area.w,
          RND(DUNGEON.PAD, area.h - DUNGEON.PAD)
        );
        r2 = new Area(area.x, area.y + r1.h, area.w, area.h - r1.h);
        return [r1, r2];
      }
      function vertical(area) {
        let r1, r2;
        r1 = new Area(
          area.x,
          area.y,
          RND(DUNGEON.PAD, area.w - DUNGEON.PAD),
          area.h
        );
        r2 = new Area(area.x + r1.w, area.y, area.w - r1.w, area.h);
        return [r1, r2];
      }
    }
    function getRoom(rooms, type, size = 4) {
      let sieveSize = [];
      let sieveType = [];
      for (let q = 0; q < rooms.length; q++) {
        if (rooms[q].type === "common") {
          sieveType.push(q);
          if (rooms[q].squareSize >= size) {
            sieveSize.push(q);
          }
        }
      }
      if (sieveType.length === 0) return null;
      if (sieveSize.length > 0) {
        return rooms[sieveSize.chooseRandom()];
      } else {
        return rooms[sieveType.chooseRandom()];
      }
    }
  }
}
class FixedDungeon extends MasterDungeon {
  constructor(sizeX, sizeY, grid) {
    super(sizeX, sizeY);
    this.grid = grid;
    this.deadEnds = [];
    this.rooms = [];
  }
}
class PacDungeon extends MasterDungeon {
  constructor(sizeX, sizeY) {
    /*
    assumptions: Y axis of symmetry
    */
    super(sizeX, sizeY);
    if (sizeX % 2 === 0) console.error("sizeY not odd ERROR", this);
    //limit to symmetry axis
    this.maxX = (sizeX - 1) / 2;
    this.symX = new Grid(this.maxX, 0);
    this.type = "PAC-DUNGEON";
    this.grid = this.createGrid(sizeX, sizeY);
    this.deadEnds = [];
    this.rooms = this.singleCenteredRoom();
    let start = this.centerTopEntry(this.rooms[0]);
    this.reserved.push(start);
    this.bonus = start.add(UP);
    this.startPoint = start.add(new Vector(0, 5));
    this.reserved.push(this.bonus);
    this.reserved.push(this.startPoint);

    this.rooms[0].door.push(start);
    this.dot(start);
    this.rectCircularCorridor(
      this.rooms[0].area.x - 2,
      this.rooms[0].area.y - 2,
      this.rooms[0].area.w + 4,
      this.rooms[0].area.h + 4
    );
    start = start.add(UP).add(UP);

    //create maze
    MAZE.useBias = true;
    var randomMaze = new Maze(this.maxX + 2, sizeY, start, this.grid, true);
    this.grid = randomMaze.grid;
    if (randomMaze.deadEnds) this.deadEnds = randomMaze.deadEnds;
    this.connectSomeDeadEnds(0);

    MAZE.targetDensity = 0.82;
    this.addConnections();
    this.polishDeadEnds();
    this.symCopy();
    this.maxX = sizeX - 2;
    this.density = this.measureDensity();
    let doors = this.setSideDoors();
    if (!doors) {
      console.error("Door not created FEATURE!");
    }
    this.deadEnds = this.scanForDeadEnds();
    if (this.deadEnds.length > 0) {
      this.removeLongDeadEnds();
    }
    this.GridMap = new GridMap(this, 8);
    //reserved (2**2)
    this.GridMap.map[GRID.gridToIndex(this.bonus, this)] |= 2;
    this.GridMap.map[GRID.gridToIndex(this.startPoint, this)] |= 2;
    this.GridMap.map[GRID.gridToIndex(this.rooms[0].door[0], this)] |= 2;
  }
  symCopy() {
    for (let y = this.minY; y <= this.maxY; y++) {
      for (let x = 1; x <= this.maxX - this.minX; x++) {
        if (this.isDot(new Grid(this.maxX - x, y))) {
          this.dot(new Grid(this.maxX + x, y));
        }
      }
    }
  }
  setSideDoors() {
    let y = Math.floor(this.height / 2);
    let left = new Grid(0, y);
    if (this.isDot(left.add(RIGHT))) {
      this.dot(left);
      this.dot(new Grid(this.width - 1, y));
      return true;
    }
    let up = 0;
    let down = 0;
    do {
      up--;
      down++;
      if (this.isDot(new Grid(0, y + up).add(RIGHT))) {
        this.dot(new Grid(0, y + up));
        this.dot(new Grid(this.width - 1, y + up));
        return true;
      }
      if (this.isDot(new Grid(0, y + down).add(RIGHT))) {
        this.dot(new Grid(0, y + down));
        this.dot(new Grid(this.width - 1, y + down));
        return true;
      }
    } while (y + up > 0 && y + down < this.height - 1);
    console.error("Doors not created!");
    return false;
  }
}
class PacGrid {
  constructor(sizeX, sizeY, buffer) {
    this.width = sizeX;
    this.height = sizeY;
    this.map = new Uint8Array(buffer);
  }
  static gridToPacGrid(maze) {
    //accepts maze, dungeon
    let sizeX = parseInt(maze.width, 10);
    let sizeY = parseInt(maze.height, 10);
    let mapBuffer = new ArrayBuffer(sizeX * sizeY);
    let map = new Uint8Array(mapBuffer);
    for (let x = 0; x < sizeX; x++) {
      for (let y = 0; y < sizeY; y++) {
        var index = y * sizeX + x;
        if (maze.grid[y].charAt(x) === "1") {
          map[index] = map[index] | 1;
          var grid = new Grid(x, y);
          for (let q = 0; q < ENGINE.circle.length; q += 2) {
            let check = grid.add(ENGINE.circle[q]);
            if (maze.isMazeWall(check)) {
              let prevI = q - 1;
              if (prevI < 0) prevI = ENGINE.circle.length - 1;
              let nextI = q + 1;
              let prev = grid.add(ENGINE.circle[prevI]);
              let next = grid.add(ENGINE.circle[nextI]);
              if (maze.isMazeWall(prev) && maze.isMazeWall(next)) {
                continue;
              } else {
                map[index] = map[index] | (2 ** (q / 2 + 2));
                let mirrorIndex = check.y * sizeX + check.x;
                let w = q + 4;
                if (w >= ENGINE.circle.length) w -= ENGINE.circle.length;
                map[mirrorIndex] = map[mirrorIndex] | (2 ** (w / 2 + 2));
              }
            }
          }
        }
      }
    }
    return new PacGrid(sizeX, sizeY, mapBuffer);
  }
}
class GridMap {
  /*
  default map:
  0: nothing
  1: wall
  2: reserved
  */
  constructor(map, size = 8) {
    let factor = Math.floor(size / 8);
    let buffer = new ArrayBuffer(map.width * map.height * factor);
    let GM;
    switch (size) {
      case 8:
        GM = new Uint8Array(buffer);
        break;
      case 16:
        GM = new Uint16Array(buffer);
        break;
      default:
        console.error("GridMap constructor size error. Use 8, 16.");
    }
    this.size = size;
    let index;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        index = x + y * map.width;
        let grid = new Grid(x, y);
        if (map.isMazeWall(grid)) {
          GM[index] = 0b00000001;
        }
      }
    }
    this.map = GM;
  }
  set(grid, bin) {
    this.map[GRID.gridToIndex(grid)] |= bin;
  }
  clear(grid, bin) {
    let mask;
    switch (this.size) {
      case 8:
        mask = 0b11111111;
        break;
      case 16:
        mask = 0b1111111111111111;
        break;
    }
    this.map[GRID.gridToIndex(grid)] &= (mask - bin); 
  }
  check(grid, bin) {
    return this.map[GRID.gridToIndex(grid)] & bin;
  }
  wall() {
    return this.check(grid, 1);
  }
  empty() {
    return this.map[GRID.gridToIndex(grid)] === 0;
  }
  reserved(grid) {
    return this.check(grid, 2);
  }
}
var MAZE = {
  opened: false,
  openDirs: null,
  storeDeadEnds: true,
  autoCalcDensity: true,
  connectDeadEnds: false,
  connectSome: true,
  leaveDeadEnds: 8,
  polishDeadEnds: true,
  addConnections: false,
  useBias: true,
  bias: 2,
  targetDensity: 0.6,
  create: function (sizeX, sizeY, start, seed, protectSeed) {
    var maze = new Maze(sizeX, sizeY, start, seed, protectSeed);
    if (MAZE.polishDeadEnds) maze.polishDeadEnds();
    if (MAZE.connectSome) maze.connectSomeDeadEnds(MAZE.leaveDeadEnds);
    if (MAZE.connectDeadEnds) maze.connectDeadEnds();
    if (MAZE.addConnections) maze.addConnections();
    if (MAZE.autoCalcDensity) maze.density = maze.measureDensity();
    if (MAZE.opened) {
      if (!maze.open()) {
        console.warn("Maze not opened. Retry with recursion.");
        return MAZE.create(sizeX, sizeY, start, seed, protectSeed);
      }
    }
    return maze;
  }
};
var DUNGEON = {
  VERSION: "2.80.A",
  CSS: "color: #f4ee42",
  LIMIT_ROOMS: false,
  ROOM_LIMIT: null,
  MIN_ROOM: 4,
  MAX_ROOM: 8,
  MIN_PADDING: 2,
  PAD: null,
  FREE: null,
  ITERATIONS: 4,
  CONFIGURE: true,
  SET_ROOMS: true,
  BIG_ROOM: 24,
  SINGLE_DOOR: false,
  SINGLE_CENTERED_ROOM: false,
  create: function (sizeX, sizeY) {
    //tunneling safeguard
    if (DUNGEON.MIN_ROOM < 3) DUNGEON.MIN_ROOM = 3;
    var dungeon = new Dungeon(sizeX, sizeY);
    if (DUNGEON.CONFIGURE) dungeon.configure();
    return dungeon;
  }
};

console.log(`%cDUNGEON ${DUNGEON.VERSION} loaded.`, DUNGEON.CSS);
