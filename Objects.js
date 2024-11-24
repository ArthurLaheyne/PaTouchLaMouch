export class Line extends Phaser.Geom.Line {
    constructor(name, scene, graphics, x1, y1, x2, y2, player, hasPortals = true) {
        super(x1, y1, x2, y2);

        this.name = name
        this.objects = []
        this.graphics = graphics
        this.stroke()
        if (hasPortals) {
            this.start = new Teleporteur(name + "-start", scene, x1, y1, 'portal', player)
            this.start.addLine(this)
            this.objects.push(this.start)
            this.end = new Teleporteur(name + "-end", scene, x2, y2, 'portal', player)
            this.end.addLine(this)
            this.end.setBrother(this.start)
            this.start.setBrother(this.end)
            this.objects.push(this.end)
        }
    }
    addObjects = function (objects) {
        this.objects.push(...objects)
    }
    stroke = function () {
        this.graphics.strokeLineShape(this)
    }
}

export class Linee extends Phaser.Geom.Line {
    constructor(name, scene, graphics, x1, y1, x2, y2) {
        super(x1, y1, x2, y2);

        this.name = name
        this.objects = []
        this.dragons = []
        this.graphics = graphics
        this.stroke()
        this.status = "DRAWING"
        this.setInteractive();
    }
    addObjects = function (objects) {
        this.objects.push(...objects)
    }
    stroke = function () {
        this.graphics.strokeLineShape(this)
    }
    clear = function () {
        this.graphics.clear()
    }
}

export class Lineee extends Phaser.GameObjects.Line {
    constructor(name, scene, x1, y1, x2, y2) {
        super(scene, undefined, undefined, x1, y1, x2, y2, '0xaa00aa', 1);
        this.name = name
        this.dragon_keys = []
        this.status = "DRAWING"
        this.setLineWidth(4);
        
        // this.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
        // this.setActive(true);
        scene.sys.displayList.add(this);
        // scene.sys.updateList.add(this);
        // scene.physics.world.enableBody(this);
    }
}

export class Handle extends Phaser.GameObjects.Sprite { // 
    constructor(name, scene, x, y, texture, line) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.setInteractive({ draggable: true });
        this.line = line
        this.depth = 10
    }
}

export class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);
        this.setName("PlayerFlower")

        this.lines = []
        this.object = this
        this.depth = 10
    }
    getObjectsReachable() {
        const objects_reachable = []            
        this.lines.forEach(line => {
            // console.log(objects_reachable);
            objects_reachable.push(...line.objects)
        });
        
        return  objects_reachable;
    }
    setObject(object) {
        this.object = object
    }
    addLine(line) {
        this.lines.push(line)
    }
    setLines(lines) {
        this.lines = lines
    }
}

export class Dude extends Phaser.GameObjects.Sprite { // 
    constructor(name, scene, x, y, texture, player) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.setInteractive()
        this.lines = []
        this.player = player
        this.glow = this.preFX.addGlow().setActive(false)
        this.on("pointerover", () => {
            if (this.isReachable()) {
                this.glow.setActive(true)
            }
        }).on("pointerout", () => {
            this.glow.setActive(false)
        })
        
        scene.objects.push(this)
    }
    isReachable() {
        return this.player.getObjectsReachable().includes(this)
    }
    addLine(line) {
        this.lines.push(line)
    }
}

export class Teleporteur extends Phaser.GameObjects.Sprite { // 
    constructor(name, scene, x, y, texture, player, isConsumable = true) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.setInteractive()
        this.lines = []
        this.player = player
        this.glow = this.preFX.addGlow().setActive(false)
        this.on("pointerover", () => {
            if (this.isReachable()) {
                this.glow.setActive(true)
            }
        }).on("pointerout", () => {
            this.glow.setActive(false)
        })
        this.brother = null
        this.isConsumable = isConsumable
        scene.objects.push(this)
        this.anims.play('portal')
    }
    isReachable() {
        return this.player.getObjectsReachable().includes(this)
    }
    addLine(line) {
        this.lines.push(line)
    }
    setBrother(teleporteur) {
        this.brother = teleporteur
    }
}

export class Dragon extends Phaser.GameObjects.Sprite { // 
    constructor(name, scene, x, y, texture, player) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.depth = 20
        this.name = name
        this.setInteractive()
        this.lines = []
        this.player = player
        this.glow = this.preFX.addGlow().setActive(false)
        // this.on("pointerover", () => {
        //     this.anims.play('dragon')
        // }).on("pointerout", () => {
        //     this.anims.stop()
        //     this.setFrame(0)
        // })
        
        scene.objects.push(this)
    }
    isReachable() {
        return this.player.getObjectsReachable().includes(this)
    }
    addLine(line) {
        this.lines.push(line)
    }
}

export class Dragonn extends Phaser.GameObjects.Sprite { // 
    constructor(name, scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.lines = []
        this.depth = 1
        this.setInteractive()
    }
}

export class Depart extends Phaser.GameObjects.Sprite {
    constructor(name, scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.lines_key = []
        this.depth = 1
        this.setInteractive()
    }
}

export class Arriveee extends Phaser.GameObjects.Sprite {
    constructor(name, scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.lines_key = []
        this.depth = 1
        this.setInteractive()
    }
}

export class Intersection extends Phaser.GameObjects.Sprite { // 
    constructor(name, scene, x, y, texture, player) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.setInteractive()
        this.lines = []
        this.player = player
        this.glow = this.preFX.addGlow().setActive(false)
        this.on("pointerover", () => {
            if (this.isReachable()) {
                this.glow.setActive(true)
            }
        }).on("pointerout", () => {
            this.glow.setActive(false)
        })

        scene.objects.push(this)
    }
    isReachable() {
        return this.player.getObjectsReachable().includes(this)
    }
    addLine(line) {
        this.lines.push(line)
    }
}

export class Intersectionn extends Phaser.GameObjects.Sprite { // 
    constructor(name, scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.depth = 0
        this.displayWidth = 16
        this.displayHeight = 12
    }
}

export class Arrivee extends Phaser.GameObjects.Sprite {
    constructor(name, scene, x, y, texture, player) {
        super(scene, x, y, texture);
        
        // Mimics scene.physics.add.image() https://github.com/phaserjs/phaser/blob/v3.70.0/src/physics/arcade/Factory.js#L159
        scene.sys.displayList.add(this);
        scene.sys.updateList.add(this);
        scene.physics.world.enableBody(this);

        this.name = name
        this.setInteractive()
        this.lines = []
        this.player = player
        this.glow = this.preFX.addGlow().setActive(false)
        this.on("pointerover", () => {
            if (this.isReachable()) {
                this.glow.setActive(true)
            }
        }).on("pointerout", () => {
            this.glow.setActive(false)
        })
        
        scene.objects.push(this)
    }
    isReachable() {
        return this.player.getObjectsReachable().includes(this)
    }
    addLine(line) {
        this.lines.push(line)
    }
}