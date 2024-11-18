import { Line, Player, Teleporteur, Dragon, Intersection, Arrivee } from './Objects.js';

export class Game extends Phaser.Scene
{
    constructor ()
    {
        super('Game');
    }

    create()
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
            this.scene.start('MainMenu');
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

        this.objects = []

        this.player = new Player(this, 300, 300, 'flower')

        this.graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa } })

        this.line1 = new Line("line1", scene, this.graphics, 300, 0, 300, 600, this.player)
        this.line2 = new Line("line2", scene, this.graphics, 0, 600, 600, 0, this.player)
        this.line3 = new Line("line3", scene, this.graphics, 0, 300, 800, 300, this.player)
        this.line4 = new Line("line4", scene, this.graphics, 0, 120, 800, 600, this.player)
        this.intersection1 = new Intersection("intersection-1-2-3-4-5", scene, 300, 300, 'diamonds', this.player)
        this.intersection1.addLine(this.line1)
        this.intersection1.addLine(this.line2)
        this.intersection1.addLine(this.line3)
        this.intersection1.addLine(this.line4)
        this.intersections = [this.intersection1];
        this.line1.addObjects([this.intersection1])
        this.line2.addObjects([this.intersection1])
        this.line3.addObjects([this.intersection1])
        this.line4.addObjects([this.intersection1])

        this.line5 = new Line("line5", scene, this.graphics, 50, 150, 300, 120, this.player, false)
        this.intersection2 = new Intersection("intersection-4-5", scene, 50, 150, 'diamonds', this.player)
        this.intersection2.addLine(this.line4)
        this.intersection2.addLine(this.line5)
        this.intersection3 = new Intersection("intersection-1-5", scene, 300, 120, 'diamonds', this.player)
        this.intersection3.addLine(this.line1)
        this.intersection3.addLine(this.line5)
        this.intersections.push(this.intersection2);
        this.intersections.push(this.intersection3);
        this.line1.addObjects([this.intersection3])
        this.line4.addObjects([this.intersection2])
        this.line5.addObjects([this.intersection2])
        this.line5.addObjects([this.intersection3])

        this.line6 = new Line("line6", scene, this.graphics, 500, 100, 650, 300, this.player, false)
        this.intersection4 = new Intersection("intersection-2-6", scene, 500, 100, 'diamonds', this.player)
        this.intersection4.addLine(this.line2)
        this.intersection4.addLine(this.line6)
        this.intersection5 = new Intersection("intersection-6-3", scene, 650, 300, 'diamonds', this.player)
        this.intersection5.addLine(this.line6)
        this.intersection5.addLine(this.line3)
        this.intersections.push(this.intersection4);
        this.intersections.push(this.intersection5);
        this.line2.addObjects([this.intersection4])
        this.line6.addObjects([this.intersection4])
        this.line6.addObjects([this.intersection5])
        this.line3.addObjects([this.intersection5])

        this.line7 = new Line("line7", scene, this.graphics, 470, 400, 300, 560, this.player, false)
        this.intersection6 = new Intersection("intersection-4-7", scene, 470, 400, 'diamonds', this.player)
        this.intersection6.addLine(this.line4)
        this.intersection6.addLine(this.line7)
        this.intersection7 = new Intersection("intersection-1-7", scene, 300,560, 'diamonds', this.player)
        this.intersection7.addLine(this.line1)
        this.intersection7.addLine(this.line7)
        this.intersections.push(this.intersection6)
        this.intersections.push(this.intersection7)
        this.line4.addObjects([this.intersection6])
        this.line7.addObjects([this.intersection6])
        this.line1.addObjects([this.intersection7])
        this.line7.addObjects([this.intersection7])

        this.line8 = new Line("line8", scene, this.graphics, 300, 560, 120, 480, this.player, false)
        this.intersection8 = new Intersection("intersection-2-8", scene, 120, 480, 'diamonds', this.player)
        this.intersection8.addLine(this.line2)
        this.intersection8.addLine(this.line8)
        this.intersection7.addLine(this.line8)
        this.intersections.push(this.intersection8)
        this.line2.addObjects([this.intersection8])
        this.line8.addObjects([this.intersection8])
        this.line8.addObjects([this.intersection7])

        this.line9 = new Line("line9", scene, this.graphics, 150, 450, 100, 300, this.player, false)
        this.intersection9 = new Intersection("intersection-2-9", scene, 150, 450, 'diamonds', this.player)
        this.intersection9.addLine(this.line2)
        this.intersection9.addLine(this.line9)
        this.intersection10 = new Intersection("intersection-3-9", scene, 100, 300, 'diamonds', this.player)
        this.intersection10.addLine(this.line3)
        this.intersection10.addLine(this.line9)
        this.intersections.push(this.intersection9)
        this.intersections.push(this.intersection10)
        this.line2.addObjects([this.intersection9])
        this.line9.addObjects([this.intersection9])
        this.line3.addObjects([this.intersection10])
        this.line9.addObjects([this.intersection10])

        this.line10 = new Line("line10", scene, this.graphics, 175, 0, 175, 135, this.player, false)
        this.intersection11 = new Intersection("intersection-5-10", scene, 175, 135, 'diamonds', this.player)
        this.intersection11.addLine(this.line5)
        this.intersection11.addLine(this.line10)
        this.intersections.push(this.intersection11)
        this.line5.addObjects([this.intersection11])
        this.line10.addObjects([this.intersection11])

        this.line11 = new Line("line11", scene, this.graphics, 600, 600, 600, 480, this.player, false)
        this.intersection12 = new Intersection("intersection-11-4", scene, 600, 480, 'diamonds', this.player)
        this.intersection12.addLine(this.line11)
        this.intersection12.addLine(this.line4)
        this.intersections.push(this.intersection12)
        this.line11.addObjects([this.intersection12])
        this.line4.addObjects([this.intersection12])

        this.line10_portal_start = new Teleporteur("line10_portal_start", scene, 175, 0, 'portal', this.player)
        this.line10_portal_start.addLine(this.line10)
        this.line10.addObjects([this.line10_portal_start])
        this.line11_portal_end = new Teleporteur("line11_portal_end", scene, 600, 600, 'portal', this.player)
        this.line11_portal_end.addLine(this.line11)
        this.line11.addObjects([this.line11_portal_end])
        this.line10_portal_start.setBrother(this.line11_portal_end)
        this.line11_portal_end.setBrother(this.line10_portal_start)

        this.player.setObject(this.intersection1);
        this.player.setLines(this.player.object.lines)

        this.dragon1 = new Dragon("dragon1", scene, 380, 345, 'dragon', this.player);
        this.dragon1.addLine(this.line4)
        this.dragon2 = new Dragon("dragon2", scene, 300, 450, 'dragon', this.player);
        this.dragon2.addLine(this.line1)
        this.dragon3 = new Dragon("dragon3", scene, 260, 340, 'dragon', this.player);
        this.dragon3.addLine(this.line2)
        this.dragon4 = new Dragon("dragon4", scene, 220, 300, 'dragon', this.player);
        this.dragon4.addLine(this.line3)
        this.dragon5 = new Dragon("dragon5", scene, 200, 240, 'dragon', this.player);
        this.dragon5.addLine(this.line4)
        this.dragon6 = new Dragon("dragon6", scene, 375, 225, 'dragon', this.player);
        this.dragon6.addLine(this.line2)
        this.dragon7 = new Dragon("dragon7", scene, 450, 300, 'dragon', this.player);
        this.dragon7.addLine(this.line3)
        this.dragon8 = new Dragon("dragon8", scene, 700, 300, 'dragon', this.player);
        this.dragon8.addLine(this.line3)
        this.dragon9 = new Dragon("dragon9", scene, 250, 120, 'dragon', this.player);
        this.dragon9.addLine(this.line5)
        this.dragon10 = new Dragon("dragon10", scene, 125, 135, 'dragon', this.player);
        this.dragon10.addLine(this.line5)

        this.dragons = [this.dragon1, this.dragon2, this.dragon3, this.dragon4, this.dragon5, this.dragon6, this.dragon7, this.dragon8, this.dragon9, this.dragon9];

        this.arrivee = new Arrivee("arrivee", scene, 550, 300, 'flag', this.player);
        this.arrivee.addLine(this.line3)
        this.line3.addObjects([this.arrivee])

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