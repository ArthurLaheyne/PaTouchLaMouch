import { Line, Player, Teleporteur, Dragon, Intersection, Arrivee } from './Objects.js';

export class Niveau extends Phaser.Scene
{
    constructor ()
    {
        super('Niveau');
    }

    init (data)
    {
        this.level_id = data.level_id;
    }

    preload() {
    }

    async create()
    {

        const scene = this
        
        this.background = this.add.image(0, 0, 'ocean').setOrigin(0, 0);
        this.background.displayWidth = this.sys.canvas.width;
        this.background.displayHeight = this.sys.canvas.height;

        const button_fullscreen = this.add.image(800 - 45, 45, 'fullscreen', 0).setOrigin(0.5, 0.5).setInteractive();
        button_fullscreen.on('pointerup', function ()
        {
            if (this.scale.isFullscreen) {
                button_fullscreen.setFrame(0);
                this.scale.stopFullscreen();
            } else {
                button_fullscreen.setFrame(1);
                this.scale.startFullscreen();
            }
        }, this);
        button_fullscreen.on('pointerover', () => {
            this.tweens.add({
                targets: button_fullscreen,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        button_fullscreen.on('pointerout', () => {
            this.tweens.add({
                targets: button_fullscreen,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });
        
        const button_recommencer = this.add.image(800 - 45, 135, 'restart', 0).setOrigin(0.5, 0.5).setInteractive();
        button_recommencer.on('pointerdown', (event) => {
            this.scene.restart();
        });
        button_recommencer.on('pointerover', () => {
            this.tweens.add({
                targets: button_recommencer,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        button_recommencer.on('pointerout', () => {
            this.tweens.add({
                targets: button_recommencer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });
        
        const button_back = this.add.image(800 - 45, 225, 'back', 0).setOrigin(0.5, 0.5).setInteractive();
        button_back.on('pointerdown', (event) => {
            this.scene.start('Niveaux');
        });
        button_back.on('pointerover', () => {
            this.tweens.add({
                targets: button_back,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                ease: 'Linear'
            });
        });
        button_back.on('pointerout', () => {
            this.tweens.add({
                targets: button_back,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Linear'
            });
        });

        this.anims.create({
            key: 'portal',
            frames: this.anims.generateFrameNumbers('portal', { start: 0, end: 13 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'dude',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'intersection',
            frames: this.anims.generateFrameNumbers('diamonds', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'dragon',
            frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });       
        
        
    
        scene.graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa } })
        scene.objects = []
        scene.player;
        scene.lines = [];
        scene.intersections = [];
        scene.dragons = [];
        
        
        
        async function getData() {
            const url = "https://hufyvhlacb.execute-api.us-west-2.amazonaws.com/patouchlamouch/levels/" + scene.level_id;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
              }
              const json = await response.json();
              return json
            } catch (error) {
                console.error(error.message);
            }
        }
        const data = await getData();
        let levelData = JSON.parse(data.Item.json);

        console.log(levelData);
        

        scene.player = new Player(this, levelData.start.x, levelData.start.y, 'flower')
        
        levelData.lines.forEach((lineData, key) => {
            let line = new Line(`line${key}`, scene, this.graphics, lineData.start.x, lineData.start.y, lineData.end.x, lineData.end.y, this.player)
            this.lines.push(line);
        });

        levelData.intersections.forEach((intersectionData, key) => {
            let intersection = new Intersection(`intersection${key}`, scene, intersectionData.position.x, intersectionData.position.y, 'diamonds', scene.player)
            intersectionData.lines.forEach(line => {
                intersection.addLine(scene.lines[line])
                this.lines[line].addObjects([intersection])
            });
            this.intersections.push(intersection);
        });

        this.player.setLines([scene.lines[0]])
        this.player.setObject(scene.intersections[0]);

        levelData.dragons.forEach((dragonData, key) => {
            let dragon = new Dragon(`dragon${key}`, scene, dragonData.position.x, dragonData.position.y, 'dragon', scene.player);
            dragonData.lines.forEach(line => {
                dragon.addLine(scene.lines[line])
            });
            scene.dragons.push(dragon);
        });

        this.arrivee = new Arrivee("arrivee", scene, levelData.end.x, levelData.end.y, 'flag', this.player);
        this.arrivee.addLine(scene.lines[0])
        scene.lines[0].addObjects([this.arrivee])

        this.target = new Phaser.Math.Vector2();
        const cursor = this.add.image(0, 0, 'cursor').setVisible(false);

        // On ne peut cliquer que sur un seul élément
        this.input.setTopOnly(false);

        this.objects.forEach(object => {
            object.on('pointerdown', (pointer, gameObjects) => {
                if (object.isReachable()) {
                    // Move at 200 px/s:
                    this.player.setObject(object)
                    if (this.player.object.constructor.name != "Intersection") {
                        this.player.setLines(this.player.object.lines)
                    } else if (this.player.object.constructor.name == "Intersection") {
                        // Trouver la ligne qui joint l'objet de départ et l'intersection d'arrivée
                    }
                    this.physics.moveToObject(this.player, object, 200);
                }
            })
        });


    }

    update()
    {
        const scene = this;
        if (scene.player && scene.player.body) {
            this.objects.forEach(object => {
                if (object.isReachable()) {
                    // Add tween animation !!!
                } else {
                    object.scale = 1
                }
            });
            //  4 is our distance tolerance, i.e. how close the player can get to the target
            //  before it is considered as being there. The faster it moves, the more tolerance is required.
            const tolerance = 4;

            // const tolerance = 200 * 1.5 / this.game.loop.targetFps;
            if (this.player.body.speed > 0)
            {
                const distance = Phaser.Math.Distance.BetweenPoints(this.player, this.player.object);
                if (distance < tolerance)
                {
                    this.player.body.reset(this.player.object.x, this.player.object.y);
                    if (this.player.object.constructor.name == "Intersection") {
                        this.player.setLines(this.player.object.lines)
                    }
                    else if (this.player.object.constructor.name == "Teleporteur") {
                        let teleporteur = this.player.object
                        if (!teleporteur.disabled) {
                            this.player.body.reset(teleporteur.brother.x, teleporteur.brother.y);
                            this.player.setObject(teleporteur.brother)
                            this.player.setLines(teleporteur.brother.lines)
                            if (teleporteur.isConsumable) {
                                this.player.setObject(null)
                                teleporteur.destroy(true)
                                teleporteur.brother.destroy(true)
                            }
                        }
                    }
                    else if (this.player.object.constructor.name == "Arrivee") {
                        this.player.setLines(this.player.object.lines)
                        let bravo = this.add.image(550, 400, 'bravo').setInteractive();
                        bravo.on('pointerdown', (event) => {
                            this.scene.restart();
                        });
                    }
                }
            }
            
            const toleranceToDragon = 20;
            this.dragons.forEach( (dragon) => {
                let distanceToDragon = Phaser.Math.Distance.BetweenPoints(this.player, dragon);
                if (this.player.body.speed > 0)
                {
                    if (distanceToDragon < toleranceToDragon)
                    {
                        this.player.body.reset(dragon.x, dragon.y);
                        dragon.anims.play('dragon')
                        
                        let restart = this.add.image(550, 400, 'recommencer').setInteractive();
                        restart.on('pointerdown', (event) => {
                            this.scene.restart();
                        });
                    }
                }
            })
        }
    }
}