/**
 * mainly old code later substituted with IAM
 * but kept for compatibility with old games
 * avoid !!!
 * version 1.0
 */
console.info("OldEngineWedge available");
class AnimationSPRITE {
    constructor(x, y, type, howmany) {
        this.x = x;
        this.y = y;
        this.pool = [];
        for (let i = 0; i < howmany; i++) {
            this.pool.push(type + i.toString().padStart(2, "0"));
        }
    }
}

class TextSprite {
    constructor(text, point, color, frame, offset = 0) {
        this.text = text;
        this.point = point;
        this.color = color || "#FFF";
        this.frame = frame || ENGINE.INI.FADE_FRAMES; //magic number
        this.offset = offset;
    }
}

const TEXTPOOL = {
    pool: [],
    draw: function (layer) {
        var TPL = TEXTPOOL.pool.length;
        if (TPL === 0) return;
        ENGINE.layersToClear.add(layer);
        var CTX = LAYER[layer];
        CTX.font = "10px Consolas";
        CTX.textAlign = "center";
        var vx, vy;
        for (let q = TPL - 1; q >= 0; q--) {
            CTX.fillStyle = TEXTPOOL.pool[q].color;
            vx =
                TEXTPOOL.pool[q].point.x - ENGINE.VIEWPORT.vx + ENGINE.INI.GRIDPIX / 2;
            vy =
                TEXTPOOL.pool[q].point.y -
                ENGINE.VIEWPORT.vy +
                ENGINE.INI.GRIDPIX / 2 +
                TEXTPOOL.pool[q].offset;
            CTX.save();
            CTX.globalAlpha =
                (1000 -
                    (ENGINE.INI.FADE_FRAMES - TEXTPOOL.pool[q].frame) *
                    (1000 / ENGINE.INI.FADE_FRAMES)) /
                1000;
            CTX.fillText(TEXTPOOL.pool[q].text, vx, vy);
            CTX.restore();
            TEXTPOOL.pool[q].frame--;
            if (TEXTPOOL.pool[q].frame <= 0) {
                TEXTPOOL.pool.splice(q, 1);
            }
        }
    }
};

class PartSprite {
    constructor(point, sprite, line, speed) {
        this.point = point;
        this.sprite = sprite;
        this.line = line;
        this.speed = speed;
    }
}

const SpritePOOL = {
    pool: [],
    draw: function (layer) {
        var SPL = SpritePOOL.pool.length;
        if (SPL === 0) return;
        ENGINE.layersToClear.add(layer);
        var vx, vy, line;
        for (var q = SPL - 1; q >= 0; q--) {
            vx = SpritePOOL.pool[q].point.x - ENGINE.VIEWPORT.vx;
            vy = SpritePOOL.pool[q].point.y - ENGINE.VIEWPORT.vy;
            line = SpritePOOL.pool[q].sprite.height - SpritePOOL.pool[q].line;
            ENGINE.drawPart(layer, vx, vy, SpritePOOL.pool[q].sprite, line);
            SpritePOOL.pool[q].line--;
            if (SpritePOOL.pool[q].line <= 0) {
                SpritePOOL.pool.splice(q, 1);
            }
        }
    }
};

const EXPLOSIONS = {
    pool: [],
    draw: function (layer) {
        // draws AnimationSPRITE(x, y, type, howmany) from EXPLOSIONS.pool
        // example new AnimationSPRITE(actor.x, actor.y, "AlienExp", 6)
        layer = layer || "explosion";
        var PL = EXPLOSIONS.pool.length;
        if (PL === 0) return;
        ENGINE.layersToClear.add(layer);
        for (var instance = PL - 1; instance >= 0; instance--) {
            var sprite = EXPLOSIONS.pool[instance].pool.shift();
            ENGINE.spriteDraw(
                layer,
                EXPLOSIONS.pool[instance].x - ENGINE.VIEWPORT.vx,
                EXPLOSIONS.pool[instance].y - ENGINE.VIEWPORT.vy,
                SPRITE[sprite]
            );
            if (EXPLOSIONS.pool[instance].pool.length === 0) {
                EXPLOSIONS.pool.splice(instance, 1);
            }
        }
    }
};