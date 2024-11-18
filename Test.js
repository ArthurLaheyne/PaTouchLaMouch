import { Linee, Handle, Intersectionn } from './Objects.js';
import { Magnetize } from './Magnetize.js';

export class Test extends Phaser.Scene
{
    constructor ()
    {
        super('Test');
    }

    create()
    {
        const scene = this

        // LINES
        this.drawing_line = new Linee("line1", scene, this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa } }), 600, 400, 0, 0)

        // INTERSECTIONS
        this.intersection = new Intersectionn("intersection-4-5", scene, 400, 300, 'diamonds')
        this.intersection2 = new Intersectionn("intersection-6-5", scene, 600, 300, 'diamonds')
        this.intersections = [this.intersection, this.intersection2];

        // MAGNETIZE
        let magnetize = new Magnetize(scene, this.intersections);

        this.input.on('pointermove', function (pointer)
        {
            if (this.drawing_line && this.drawing_line.status == "DRAWING") {
                magnetize.magnetize(scene, this.drawing_line, this.intersections, pointer, 50, true);
                this.drawing_line.clear()
                this.drawing_line.stroke()
            }
        }, this);

    }

    preload ()
    {
        this.load.spritesheet('diamonds', 'https://labs.phaser.io/assets/sprites/diamonds32x24x5.png', { frameWidth: 32, frameHeight: 24 });
    }

    update()
    {
    }

}