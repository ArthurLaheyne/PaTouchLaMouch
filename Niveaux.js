import { Line, Player, Teleporteur, Dragon, Intersection, Arrivee } from './Objects.js';

export class Niveaux extends Phaser.Scene
{
    constructor ()
    {
        super('Niveaux');
    }

    preload() {
        this.load.json('levelData', 'niveau1.json');
        // fetch("https://hufyvhlacb.execute-api.us-west-2.amazonaws.com/patouchlamouch/levels", {
        //     method: "GET",
        //     mode: "no-cors",
        //     headers: {
        //         "Content-type": "application/json; charset=UTF-8"
        //     }
        // })
        // .then((response) => console.log(response))
        // .then((json) => console.log(json));
    }

    async create()
    {

        const scene = this;
        scene.levels = [];
        
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

        const data = await getData();
        let levelsData = data.Items;
        console.log(levelsData);
        
        
        
        async function getData() {
            const url = "https://hufyvhlacb.execute-api.us-west-2.amazonaws.com/patouchlamouch/levels";
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

        levelsData.forEach((levelData, key) => {

            let json = JSON.parse(levelData.json);
            console.log(json);
            
            let level = scene.add.text(0, key * 30, levelData.id, { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0).setInteractive();
            level.on('pointerdown', () => {
                console.log(level);
                this.scene.start('Niveau', { level_id: levelData.id });
                
            })
            scene.levels.push(level);
        });

    }

    update()
    {
    }
}