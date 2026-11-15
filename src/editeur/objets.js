// Objets de l'éditeur (scène Sandbox). Les objets du jeu sont dans jeu/objets.js.

// Fil de l'éditeur ; sa géométrie est dans this.geom ({x1, y1, x2, y2})
export class EditorLine extends Phaser.GameObjects.Line {
    constructor(name, scene, x1, y1, x2, y2) {
        super(scene, undefined, undefined, x1, y1, x2, y2, '0xaa00aa', 1);
        this.name = name;
        this.status = "DRAWING"; // puis "DRAWN" une fois la seconde extrémité posée
        this.setLineWidth(4);
        // Origine en haut à gauche : les coordonnées de la ligne sont celles de la scène.
        // Avec l'origine par défaut (0.5), une ligne créée d'emblée avec sa taille (niveau rouvert dans
        // l'éditeur) est dessinée décalée de la moitié de sa boîte englobante.
        this.setOrigin(0, 0);
        scene.sys.displayList.add(this);
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

// Poignée de déplacement (mode d, draggable) ou croix de suppression (mode s) d'un objet.
// Zone de clic ronde ; quand plusieurs poignées sont sous le curseur (bouts de fil proches), seule la plus
// proche répond, quelle que soit celle qui est dessinée au-dessus.
export class Handle extends PhysicsSprite {
    constructor(name, scene, x, y, texture, target, draggable = true) {
        super(scene, x, y, texture);
        this.name = name;
        this.target = target;
        this.depth = 10;
        const radius = Math.min(this.width, this.height) / 2;
        this.setInteractive({
            draggable,
            hitArea: new Phaser.Geom.Circle(this.width / 2, this.height / 2, radius),
            hitAreaCallback: (area, localX, localY, handle) => {
                if (!Phaser.Geom.Circle.Contains(area, localX, localY)) return false;
                const px = handle.x - handle.displayOriginX + localX;
                const py = handle.y - handle.displayOriginY + localY;
                const distance = Math.hypot(px - handle.x, py - handle.y);
                return !handle.scene.children.list.some(other => other !== handle && other instanceof Handle
                    && other.active && other.input && other.input.enabled
                    && Math.hypot(px - other.x, py - other.y) < distance);
            },
        });
    }
}

// Objet posé sur un fil : dragon, départ, arrivée. lines_key : [clé du fil] ; anchor : voir ancrage.js
export class EditorObject extends PhysicsSprite {
    constructor(name, scene, x, y, texture) {
        super(scene, x, y, texture);
        this.name = name;
        this.lines_key = [];
        this.depth = 1;
        this.setInteractive();
    }
}

// Losange d'intersection (affichage seulement)
export class EditorIntersection extends PhysicsSprite {
    constructor(name, scene, x, y, texture) {
        super(scene, x, y, texture);
        this.name = name;
        this.depth = 0;
        this.displayWidth = 16;
        this.displayHeight = 12;
    }
}
