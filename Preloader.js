export class Preloader extends Phaser.Scene
{
    constructor ()
    {
        super("Preloader");
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, "preloader");

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        //  Load the https://labs.phaser.io/assets for the game - Replace with the path to your own https://labs.phaser.io/assets
        // this.load.setPath("assets/games/coin-clicker/");

        this.load.image("drag", "assets/drag.png");
        this.load.image("background", "assets/background.png");
        this.load.image("patouchlamouch", "assets/PaTouch-LaMouch.png");
        this.load.atlas('coin', 'assets/coin.png', 'assets/coin.json');
        this.load.image('ocean', 'assets/oceanx700.jpg');
        this.load.image('bravo', 'assets/bravo.png');
        this.load.image('recommencer', 'assets/recommencer.png');
        this.load.image('back', 'assets/back.png');
        this.load.image('fullscreen', 'assets/fullscreen-2.png');
        this.load.spritesheet('dragon', 'assets/dragon3.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('flag', 'assets/flag.png', { frameWidth: 46, frameHeight: 40 });
        this.load.spritesheet('dude', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('flower', 'https://labs.phaser.io/assets/sprites/flower-exo.png');
        this.load.image('cursor', 'https://labs.phaser.io/assets/sprites/drawcursor.png');
        this.load.image('restart', 'assets/refresh-small-2.png');
        this.load.spritesheet('diamonds', 'https://labs.phaser.io/assets/sprites/diamonds32x24x5.png', { frameWidth: 32, frameHeight: 24 });
        this.load.spritesheet('portal', 'assets/portal.png', { frameWidth: 46, frameHeight: 48 });
    }

    create ()
    {
        //  When all the https://labs.phaser.io/assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, we will define our 'coin' animation here, so we can use it in other scenes:

        this.anims.create({
            key: "rotate",
            frames: this.anims.generateFrameNames("coin", { prefix: "coin_", start: 1, end: 7, zeroPad: 2 }),
            frameRate: 16,
            repeat: -1
        });

        this.anims.create({
            key: "vanish",
            frames: this.anims.generateFrameNames("coin", { prefix: "vanish_", start: 1, end: 4 }),
            frameRate: 10
        });

        //  When all the https://labs.phaser.io/assets are loaded go to the next scene.
        //  We can go there immediately via: this.scene.start("MainMenu");
        //  Or we could use a Scene transition to fade between the two scenes:

        this.scene.transition({
            target: 'MainMenu',
            duration: 1000,
            moveBelow: true,
            onUpdate: (progress) => {
                this.cameras.main.setAlpha(1 - progress);
            }
        });

        //  When the transition completes, it will move automatically to the MainMenu scene
    }
}