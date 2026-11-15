// Objets du jeu (scène Niveau). Les objets de l'éditeur sont dans editeur/objets.js.

// Fil : segment dessiné, qui connaît les objets posés dessus (atteignables depuis ce fil)
export class Line extends Phaser.Geom.Line {
    constructor(name, graphics, x1, y1, x2, y2) {
        super(x1, y1, x2, y2);
        this.name = name;
        this.objects = [];
        graphics.strokeLineShape(this);
    }
    addObjects(objects) {
        this.objects.push(...objects);
    }
}

// Sprite ajouté à la scène avec un corps physique (comme scene.physics.add.sprite)
class PhysicsSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);
    }
}

export class Player extends PhysicsSprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.setName("PlayerFlower");
        this.lines = [];
        this.object = this;
        this.depth = 10;
    }
    // Objets posés sur les fils où se trouve le joueur
    getObjectsReachable() {
        return this.lines.flatMap(line => line.objects);
    }
    setObject(object) {
        this.object = object;
    }
    setLines(lines) {
        this.lines = lines;
    }
}

// Objet posé sur un ou plusieurs fils, cliquable ; halo au survol s'il est atteignable
class NetworkObject extends PhysicsSprite {
    constructor(name, scene, x, y, texture, player, glowOnHover = true) {
        super(scene, x, y, texture);
        this.name = name;
        this.setInteractive();
        this.lines = [];
        this.player = player;
        this.glow = this.preFX.addGlow().setActive(false);
        if (glowOnHover) {
            this.on("pointerover", () => {
                if (this.isReachable()) this.glow.setActive(true);
            }).on("pointerout", () => {
                this.glow.setActive(false);
            });
        }
        scene.objects.push(this);
    }
    isReachable() {
        return this.player.getObjectsReachable().includes(this);
    }
    addLine(line) {
        this.lines.push(line);
    }
}

export class Intersection extends NetworkObject {}

export class Arrivee extends NetworkObject {}

export class Dragon extends NetworkObject {
    constructor(name, scene, x, y, texture, player) {
        super(name, scene, x, y, texture, player, false);
        this.depth = 20;
    }
}

// Portail : mène à son "frère" (brother) ; null pour la sortie d'une paire à sens unique
export class Teleporteur extends NetworkObject {
    constructor(name, scene, x, y, texture, player, isConsumable = true) {
        super(name, scene, x, y, texture, player);
        this.brother = null;
        this.isConsumable = isConsumable;
        this.anims.play('portal');
    }
    setBrother(teleporteur) {
        this.brother = teleporteur;
    }
}
