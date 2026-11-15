// Charge toutes les images du jeu et de l'éditeur, crée les animations, puis ouvre le menu
export class Preloader extends Phaser.Scene
{
    constructor ()
    {
        super("Preloader");
    }

    init ()
    {
        // Barre de chargement, au centre du jeu (800 x 600)
        this.add.image(400, 300, "preloader");
        this.add.rectangle(400, 300, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(400 - 230, 300, 4, 28, 0xffffff);
        this.load.on("progress", (progress) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload ()
    {
        // Interface
        this.load.image("background", "assets/background.png");
        this.load.image("patouchlamouch", "assets/PaTouch-LaMouch.png");
        this.load.image('ocean', 'assets/oceanx700.jpg');
        this.load.image('fullscreen', 'assets/fullscreen-2.png');
        this.load.image('back', 'assets/back.png');
        this.load.image('restart', 'assets/refresh-small-2.png');
        this.load.image('bravo', 'assets/bravo.png');
        this.load.image('recommencer', 'assets/recommencer.png');
        // Jeu
        this.load.image('flower', 'assets/joueur.png'); // copie locale de labs.phaser.io/assets/sprites/flower-exo.png
        this.load.spritesheet('diamonds', 'assets/diamants.png', { frameWidth: 32, frameHeight: 24 }); // copie locale de labs.phaser.io/assets/sprites/diamonds32x24x5.png
        this.load.spritesheet('dragon', 'assets/dragon3.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('flag', 'assets/flag.png', { frameWidth: 46, frameHeight: 40 });
        this.load.spritesheet('portal', 'assets/portal.png', { frameWidth: 46, frameHeight: 48 });
        // Éditeur
        this.load.image("drag", "assets/drag.png");
        this.load.image("delete", "assets/delete.png");
        this.load.spritesheet('depart', 'assets/depart.png', { frameWidth: 46, frameHeight: 40 });
    }

    create ()
    {
        // Animations, communes à toutes les scènes
        this.anims.create({ key: 'portal', frames: this.anims.generateFrameNumbers('portal', { start: 0, end: 13 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'dragon', frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });

        // Fondu vers le menu
        this.scene.transition({
            target: 'MainMenu',
            duration: 1000,
            moveBelow: true,
            onUpdate: (progress) => {
                this.cameras.main.setAlpha(1 - progress);
            }
        });
    }
}
