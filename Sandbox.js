import { Lineee, Handle, Intersectionn, Dragonn, Depart, Arriveee } from './Objects.js';
import { Magnetize } from './Magnetize.js';

export class Sandbox extends Phaser.Scene
{
    constructor ()
    {
        super('Sandbox');
    }

    create()
    {
        const scene = this
        
        this.background = this.add.image(0, 0, 'ocean').setOrigin(0, 0);
        this.background.displayWidth = this.sys.canvas.width;
        this.background.displayHeight = this.sys.canvas.height;

        this.trash = this.add.graphics()


        // INTERFACE
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
        button_recommencer.on('pointerup', (event) => {
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
        button_back.on('pointerup', (event) => {
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


        // INIT LINES, INTERSECTIONS AND DRAGONS
        this.drawing_line = null
        this.lines = []
        this.intersections = [];
        this.intersections_tmp = [];
        this.drawing_dragon;
        this.dragons = [];
        let magnetize = new Magnetize(scene, this.intersections.flat());
        this.drawing_depart;
        this.depart = null
        this.drawing_arrivee;
        this.arrivee = null


        // MODES

        this.mode = "";
        this.modeText = this.add.text(0, 0, "Line (l)", { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0)
        this.modeText = this.add.text(0, 30, "Drag (d)", { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0)
        this.modeText = this.add.text(0, 60, "Dragon (g)", { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0)
        this.modeText = this.add.text(0, 90, "Suppression (s)", { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0)
        this.modeText = this.add.text(0, 120, "Depart (q)", { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0)
        this.modeText = this.add.text(0, 150, "Arrivée (a)", { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0)
        this.modeText = this.add.text(0, 180, "Exporter (x)", { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' }).setAlign('left').setOrigin(0)
        const textStyle = { fontFamily: 'Arial Black', fontSize: 20, color: '#000000' };
        this.modeText = this.add.text(800, 600, "mode : " + this.mode, textStyle).setAlign('right').setOrigin(1)


        function cleanKeyDown() {
            scene.input.off();
            scene.input.off('pointerup');
            scene.input.off('pointerover');
            scene.input.off('pointermove');
            if (scene.drawing_dragon) {
                scene.drawing_dragon.destroy();
            }
            scene.lines.forEach(line => {
                if (line != undefined) {
                    if (line.start) {
                        line.start.destroy()
                        delete line.start
                    }
                    if (line.end) {
                        line.end.destroy()
                        delete line.end
                    }
                    if (line.del_start) {
                        line.del_start.destroy()
                        delete line.del_start
                    }
                    if (line.del_end) {
                        line.del_end.destroy()
                        delete line.del_end
                    } 
                }
            });
            scene.dragons.forEach(dragon => {
                if (dragon.handle) {
                    dragon.handle.destroy()
                    delete dragon.handle
                }
                if (dragon.del) {
                    dragon.del.destroy()
                    delete dragon.del
                }
            });
            if (scene.drawing_depart) {
                scene.drawing_depart.destroy();
            }
            if (scene.depart) {
                if (scene.depart.handle) {
                    scene.depart.handle.destroy()
                    delete scene.depart.handle
                }
                if (scene.depart.del) {
                    scene.depart.del.destroy()
                    delete scene.depart.del
                }
            }
            if (scene.drawing_arrivee) {
                scene.drawing_arrivee.destroy();
            }
            if (scene.arrivee) {
                if (scene.arrivee.handle) {
                    scene.arrivee.handle.destroy()
                    delete scene.arrivee.handle
                }
                if (scene.arrivee.del) {
                    scene.arrivee.del.destroy()
                    delete scene.arrivee.del
                }
            }
        }

        // LINE EVENTS
        this.input.keyboard.on('keydown-L', event =>
        {
            cleanKeyDown();

            this.mode = "line"
            this.modeText.setText(this.mode)

            // LINE DRAWING AND MAGNETIZE
            this.input.on('pointerup', (pointer) => {
                
                if (this.mode == "line") {
                    // Si la ligne n'existait pas, on la crée
                    if (!this.drawing_line) {
                        this.drawing_line = new Lineee("line1", scene, pointer.x, pointer.y, pointer.x, pointer.y)
                        
                    } else if (this.drawing_line && this.drawing_line.status == "DRAWING") {
                        
                        let magnetPoint = magnetize.magnetize(scene, this.drawing_line, this.intersections.flat(), pointer, 40, "end", false);
                                        
                        this.drawing_line.setTo(this.drawing_line.geom.x1, this.drawing_line.geom.y1, magnetPoint.x, magnetPoint.y)
                        this.drawing_line.status = "DRAWN"
                        this.lines.push(this.drawing_line)
                        this.drawing_line = null
    
                        // Generate intersections
                        this.intersections = generateIntersections(this.lines, this.intersections);
                    }
                }
            })
            this.input.on('pointermove', function (pointer)
            {
                if (this.mode == "line") {
                    if (this.drawing_line && this.drawing_line.status == "DRAWING") {
                        this.drawing_line.setTo(this.drawing_line.geom.x1, this.drawing_line.geom.y1, pointer.x, pointer.y)
                        magnetize.magnetize(scene, this.drawing_line, this.intersections.flat(), pointer, 40, "end", false);
                    }
                }
            }, this);
        });

        
        // DRAGON EVENTS 
        this.input.keyboard.on('keydown-G', event =>
        {
            cleanKeyDown();

            this.mode = "dragon"
            this.modeText.setText(this.mode)

            if (this.lines.length > 0) {
                // Apparition d'un sprite dragon suivant le curseur
                this.drawing_dragon = scene.add.sprite(scene.input.mousePointer.position.x, scene.input.mousePointer.position.y, 'dragon')
                this.input.on('pointermove', function(pointer)
                {
                    let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                    this.drawing_dragon.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                }, this);

                this.input.on('pointerup', function(pointer)
                {
                    let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                    let dragon = new Dragonn("dragon1", scene, magnetPoint.nearest_point.x, magnetPoint.nearest_point.y, 'dragon');
                    dragon.lines.push(magnetPoint.line);
                    magnetPoint.line.dragon_keys.push(scene.dragons.length);
                    scene.dragons.push(dragon);
                }, this);                    
            }
        });

        
        // DEPART EVENTS 
        this.input.keyboard.on('keydown-Q', event =>
        {
            cleanKeyDown();

            this.mode = "depart"
            this.modeText.setText(this.mode)

            if (this.lines.length > 0 && scene.depart == null) {
                // Apparition d'un sprite depart suivant le curseur
                this.drawing_depart = scene.add.sprite(scene.input.mousePointer.position.x, scene.input.mousePointer.position.y, 'depart')
                this.input.on('pointermove', function(pointer)
                {
                    if (scene.depart == null) {
                        let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                        this.drawing_depart.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                    }
                }, this);

                this.input.on('pointerup', function(pointer)
                {
                    if (scene.depart == null) {
                        let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                        scene.depart = new Depart("depart", scene, magnetPoint.nearest_point.x, magnetPoint.nearest_point.y, 'depart');
                        scene.depart.line_key = magnetPoint.line_key;
                        this.drawing_depart.destroy();
                        delete this.drawing_depart;
                    }
                }, this);                    
            }
        });

        
        // ARRIVEE EVENTS 
        this.input.keyboard.on('keydown-A', event =>
        {
            cleanKeyDown();

            this.mode = "arrivee"
            this.modeText.setText(this.mode)

            if (this.lines.length > 0 && scene.arrivee == null) {
                // Apparition d'un sprite depart suivant le curseur
                this.drawing_arrivee = scene.add.sprite(scene.input.mousePointer.position.x, scene.input.mousePointer.position.y, 'flag')
                this.input.on('pointermove', function(pointer)
                {
                    if (scene.arrivee == null) {
                        let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                        this.drawing_arrivee.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                    }
                }, this);

                this.input.on('pointerup', function(pointer)
                {
                    if (scene.arrivee == null) {
                        let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                        scene.arrivee = new Arriveee("arrivee", scene, magnetPoint.nearest_point.x, magnetPoint.nearest_point.y, 'flag');
                        scene.arrivee.line_key = magnetPoint.line_key;
                        this.drawing_arrivee.destroy();
                        delete this.drawing_arrivee;
                    }
                }, this);                    
            }
        });


        // HANDLE DRAG EVENTS
        this.input.keyboard.on('keydown-D', event =>
        {
            cleanKeyDown();

            this.mode = "drag"
            this.modeText.setText(this.mode)

            this.lines.forEach((line, key) => {     
                if (line != undefined) {           
                    if (!line.start) {
                        line.start = new Handle(line.name + "-start", scene, line.geom.x1, line.geom.y1, 'drag', line)
                        line.start.on('drag', function (pointer, dragX, dragY) {
                            let magnetPoint = magnetize.magnetize(scene, line, scene.intersections.flat(), pointer, 40, "start", false);
                            // Le pourcentage devra être défini à l'ajout du dragon, ici ça ne fonctionne pas
                            line.dragon_keys.forEach(dragon_key => {
                                if (scene.dragons[dragon_key] != undefined) {
                                    let dragon = scene.dragons[dragon_key];
                                    let geomLine = new Phaser.Geom.Line(line.geom.x1, line.geom.y1, line.geom.x2, line.geom.y2);
                                    let pointA = new Phaser.Geom.Point(line.geom.x1, line.geom.y1)
                                    let distanceDragon = Phaser.Math.Distance.BetweenPoints(pointA, dragon)
                                    let lineLength = Phaser.Geom.Line.Length(geomLine);
                                    let pourcentage = distanceDragon / lineLength;
                                    let pointPourcentage = geomLine.getPoint(pourcentage);                            
                                    dragon.setPosition(pointPourcentage.x, pointPourcentage.y);
                                    dragon.handle.setPosition(pointPourcentage.x, pointPourcentage.y);
                                }
                            });
                            if (scene.depart && scene.depart.line_key == key) {
                                let geomLine = new Phaser.Geom.Line(line.geom.x1, line.geom.y1, line.geom.x2, line.geom.y2);
                                let pointA = new Phaser.Geom.Point(line.geom.x1, line.geom.y1)
                                let distance = Phaser.Math.Distance.BetweenPoints(pointA, scene.depart)
                                let lineLength = Phaser.Geom.Line.Length(geomLine);
                                let pourcentage = distance / lineLength;
                                let pointPourcentage = geomLine.getPoint(pourcentage);                            
                                scene.depart.setPosition(pointPourcentage.x, pointPourcentage.y);
                                scene.depart.handle.setPosition(pointPourcentage.x, pointPourcentage.y);
                            }
                            if (scene.arrivee && scene.arrivee.line_key == key) {
                                let geomLine = new Phaser.Geom.Line(line.geom.x1, line.geom.y1, line.geom.x2, line.geom.y2);
                                let pointA = new Phaser.Geom.Point(line.geom.x1, line.geom.y1)
                                let distance = Phaser.Math.Distance.BetweenPoints(pointA, scene.arrivee)
                                let lineLength = Phaser.Geom.Line.Length(geomLine);
                                let pourcentage = distance / lineLength;
                                let pointPourcentage = geomLine.getPoint(pourcentage);                            
                                scene.arrivee.setPosition(pointPourcentage.x, pointPourcentage.y);
                                scene.arrivee.handle.setPosition(pointPourcentage.x, pointPourcentage.y);
                            }
                            this.x = magnetPoint.x
                            this.y = magnetPoint.y
                        });
                        line.start.on('dragend', function (pointer, dragX, dragY) {
                            //Rallonger la ligne pour qu'elle intersecte toujours l'autre ligne
                            Phaser.Geom.Line.Extend(line, 1, 0)
                            // Generate intersections
                            scene.intersections = generateIntersections(scene.lines, scene.intersections);
                        });
                    }
                    if (!line.end) {
                        line.end = new Handle(line.name + "-end", scene, line.geom.x2, line.geom.y2, 'drag', line)
                        line.end.on('drag', function (pointer, dragX, dragY) {
                            let magnetPoint = magnetize.magnetize(scene, line, scene.intersections.flat(), pointer, 40, "end", false);
                            // Le pourcentage devra être défini à l'ajout du dragon, ici ça ne fonctionne pas
                            line.dragon_keys.forEach(dragon_key => {
                                if (scene.dragons[dragon_key] != undefined) {
                                    let dragon = scene.dragons[dragon_key]
                                    let geomLine = new Phaser.Geom.Line(line.geom.x1, line.geom.y1, line.geom.x2, line.geom.y2);
                                    let pointB = new Phaser.Geom.Point(line.geom.x2, line.geom.y2)
                                    let distanceDragon = Phaser.Math.Distance.BetweenPoints(pointB, dragon)
                                    let lineLength = Phaser.Geom.Line.Length(geomLine);
                                    let pourcentage = (lineLength - distanceDragon) / lineLength;
                                    let pointPourcentage = geomLine.getPoint(pourcentage);
                                    dragon.setPosition(pointPourcentage.x, pointPourcentage.y);
                                    dragon.handle.setPosition(pointPourcentage.x, pointPourcentage.y);
                                }
                            });
                            if (scene.depart && scene.depart.line_key == key) {
                                let geomLine = new Phaser.Geom.Line(line.geom.x1, line.geom.y1, line.geom.x2, line.geom.y2);
                                let pointB = new Phaser.Geom.Point(line.geom.x2, line.geom.y2)
                                let distance = Phaser.Math.Distance.BetweenPoints(pointB, scene.depart)
                                let lineLength = Phaser.Geom.Line.Length(geomLine);
                                let pourcentage = (lineLength - distance) / lineLength;
                                let pointPourcentage = geomLine.getPoint(pourcentage);                            
                                scene.depart.setPosition(pointPourcentage.x, pointPourcentage.y);
                                scene.depart.handle.setPosition(pointPourcentage.x, pointPourcentage.y);
                            }
                            if (scene.arrivee && scene.arrivee.line_key == key) {
                                let geomLine = new Phaser.Geom.Line(line.geom.x1, line.geom.y1, line.geom.x2, line.geom.y2);
                                let pointB = new Phaser.Geom.Point(line.geom.x2, line.geom.y2)
                                let distance = Phaser.Math.Distance.BetweenPoints(pointB, scene.arrivee)
                                let lineLength = Phaser.Geom.Line.Length(geomLine);
                                let pourcentage = (lineLength - distance) / lineLength;
                                let pointPourcentage = geomLine.getPoint(pourcentage);                            
                                scene.arrivee.setPosition(pointPourcentage.x, pointPourcentage.y);
                                scene.arrivee.handle.setPosition(pointPourcentage.x, pointPourcentage.y);
                            }
                            this.x = magnetPoint.x
                            this.y = magnetPoint.y
                        });
                        line.end.on('dragend', function (pointer, dragX, dragY) {
                            //Rallonger la ligne pour qu'elle intersecte toujours l'autre ligne
                            Phaser.Geom.Line.Extend(line, 0, 1)
                            // Generate intersections
                            scene.intersections = generateIntersections(scene.lines, scene.intersections);
                        
                        });
                    }
                }
            });
            this.dragons.forEach((dragon, key) => {     
                if (dragon != undefined) {
                    if (!dragon.handle) {
                        dragon.handle = new Handle(dragon.name, scene, dragon.x, dragon.y, 'drag', dragon)
                        dragon.handle.on('drag', function (pointer, dragX, dragY) {
                            let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                            // Retirer le dragon des autres lignes
                            scene.lines.forEach(line => {
                                if (line.dragon_keys.includes(key)) {
                                    const index = line.dragon_keys.indexOf(key);
                                    line.dragon_keys.splice(index, 1);
                                }
                            })
                            magnetPoint.line.dragon_keys.push(key);
                            dragon.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                            dragon.handle.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                        });
                    }
                }           
            }); 
            if (scene.depart) {
                let depart = scene.depart;
                if (!depart.handle) {
                    depart.handle = new Handle(depart.name, scene, depart.x, depart.y, 'drag', depart)
                    depart.handle.on('drag', function (pointer, dragX, dragY) {
                        let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                        // Retirer le dragon des autres lignes
                        depart.line_key = magnetPoint.line_key
                        depart.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                        depart.handle.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                    });
                }
            }  
            if (scene.arrivee) {
                let arrivee = scene.arrivee;
                if (!arrivee.handle) {
                    arrivee.handle = new Handle(arrivee.name, scene, arrivee.x, arrivee.y, 'drag', arrivee)
                    arrivee.handle.on('drag', function (pointer, dragX, dragY) {
                        let magnetPoint = magnetize.magnetizeDragon(scene, scene.lines, pointer, false);
                        // Retirer le dragon des autres lignes
                        arrivee.line_key = magnetPoint.line_key
                        arrivee.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                        arrivee.handle.setPosition(magnetPoint.nearest_point.x, magnetPoint.nearest_point.y)
                    });
                }
            }           
        });

        
        // DELETE EVENTS 
        this.input.keyboard.on('keydown-S', event =>
        {
            cleanKeyDown();

            this.mode = "suppression"
            this.modeText.setText(this.mode)

            this.lines.forEach((line, key) => {
                if (line != undefined) {
                    if (!line.del_start) {
                        line.del_start = new Handle(line.name + "-del-start", scene, line.geom.x1, line.geom.y1, 'delete', line)
                        line.del_start.on('pointerup', (pointer, justOver) => {
                            deleteLine(key)
                        })
                    }
                    if (!line.del_end) {
                        line.del_end = new Handle(line.name + "-del-start", scene, line.geom.x2, line.geom.y2, 'delete', line)
                        line.del_end.on('pointerup', (pointer, justOver) => {
                            deleteLine(key)
                        })
                    }
                }
            });

            this.dragons.forEach((dragon, key) => {
                if (dragon != undefined) {
                    dragon.del = this.physics.add.sprite(dragon.x, dragon.y, 'delete');
                    dragon.del.depth = 20;
                    dragon.del.setInteractive()
                    dragon.del.on('pointerup', (pointer, justOver) => {
                        deleteDragon(key)
                    })
                }
            });
            if (scene.depart) {
                scene.depart.del = this.physics.add.sprite(scene.depart.x, scene.depart.y, 'delete');
                scene.depart.del.depth = 20;
                scene.depart.del.setInteractive()
                scene.depart.del.on('pointerup', (pointer, justOver) => {
                    scene.depart.del.destroy();
                    delete scene.depart.del;
                    scene.depart.destroy();
                    delete scene.depart
                })
            }
            if (scene.arrivee) {
                scene.arrivee.del = this.physics.add.sprite(scene.arrivee.x, scene.arrivee.y, 'delete');
                scene.arrivee.del.depth = 20;
                scene.arrivee.del.setInteractive()
                scene.arrivee.del.on('pointerup', (pointer, justOver) => {
                    scene.arrivee.del.destroy();
                    delete scene.arrivee.del;
                    scene.arrivee.destroy();
                    delete scene.arrivee
                })
            }

        });

        
        // EXPORT
        this.input.keyboard.on('keydown-X', event => {
            let json = {
                lines: [],
                intersections: [],
                dragons: [],
                start: {},
                end: {},
            }
            let jsonLines = []
            scene.lines.forEach((line, key) => {
                console.log(line);
                
                if (line) {
                    let jsonLine = {
                        "name": key,
                        "start": {
                            "x": line.geom.x1,
                            "y": line.geom.y1
                        },
                        "end": {
                            "x": line.geom.x2,
                            "y": line.geom.y2
                        }
                    }
                    jsonLines.push(jsonLine);
                }
            });
            json.lines = jsonLines
            let jsonIntersections = []
            scene.intersections.forEach((lineA_intersections, lineA_key) => {
                lineA_intersections.forEach((lineAB_intersection, lineB_key) => {
                    let lineA_index = jsonLines.findIndex((line) => {
                        return line.name == lineA_key;
                    })
                    let lineB_index = jsonLines.findIndex((line) => {
                        return line.name == lineB_key;
                    })
                    let jsonIntersection = {
                        "name": lineA_key + '-' + lineB_key,
                        "position": {
                            "x": lineAB_intersection.x,
                            "y": lineAB_intersection.y
                        },
                        "lines": [lineA_index, lineB_index]
                    }
                    jsonIntersections.push(jsonIntersection);
                });
            });
            json.intersections = jsonIntersections
            let jsonDragons = []
            scene.dragons.forEach((dragon, dragon_key) => {
                let jsonDragon = {
                    "name": dragon_key,
                    "position": {
                        "x": dragon.x,
                        "y": dragon.y
                    },
                    "lines": [
                        0
                    ]
                }
                jsonDragons.push(jsonDragon);
            });
            json.dragons = jsonDragons
            if (scene.depart) {
                json.start = {
                    x: scene.depart.x,
                    y: scene.depart.y
                }
            }
            if (scene.arrivee) {
                json.end = {
                    x: scene.arrivee.x,
                    y: scene.arrivee.y
                }
            }
            fetch("https://hufyvhlacb.execute-api.us-west-2.amazonaws.com/patouchlamouch", {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({json}),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
            .then((response) => response.json())
            .then((json) => console.log(json));;
        });


        function deleteLine(key) {
            scene.lines[key].dragon_keys.forEach(dragon_key => {
                // if (dragon != undefined) {
                    deleteDragon(dragon_key);
                // }
            });
            scene.lines[key].del_start.destroy();
            delete scene.lines[key].del_start;
            scene.lines[key].del_end.destroy();
            delete scene.lines[key].del_end;
            scene.lines[key].destroy();
            delete scene.lines[key];
            scene.intersections = generateIntersections(scene.lines, scene.intersections);
            if (scene.depart && scene.depart.line_key == key) {
                scene.depart.del.destroy()
                delete scene.depart.del
                scene.depart.destroy()
                delete scene.depart
            }
            if (scene.arrivee && scene.arrivee.line_key == key) {
                scene.arrivee.del.destroy()
                delete scene.arrivee.del
                scene.arrivee.destroy()
                delete scene.arrivee
            }
        }

        function deleteDragon(dragon_key) {
            if (scene.dragons[dragon_key] != undefined) {
                scene.dragons[dragon_key].del.destroy();
                delete scene.dragons[dragon_key].del;
                scene.dragons[dragon_key].destroy();
                delete scene.dragons[dragon_key];
            }
        }


        function generateIntersections(lines, scene_intersections) {
            scene_intersections.forEach(intersectionI => {
                intersectionI.forEach(intersectionJ => {
                    intersectionJ.destroy();
                });
            });
            let intersections = [];
            for (let i = 0; i < lines.length - 1; i++) { // Pour chaque lignes, en ignorant la dernière (elle ne peut croiser une autre ligne qui n'a pas encore été analysée)
                if (lines[i] != undefined) {
                    intersections[i] = [];
                    for (let j = i + 1; j < lines.length; j++) { // On parcourt toutes les autres lignes
                        if (lines[j] != undefined) {
                            let line1 = lines[i];
                            let line2 = lines[j];
                            
                            let intersect = Phaser.Geom.Intersects.GetLineToLine(line1.geom, line2.geom);
                            
                            if (intersect) {
                                if (intersections[i][j] === undefined) {
                                    intersections[i][j] = new Intersectionn("intersection-"+ i +"-"+ j +"", scene, intersect.x, intersect.y, 'diamonds')
                                } else {
                                    intersections[i][j].x = intersect.x;
                                    intersections[i][j].y = intersect.y;
                                }
                            } else {
                                if (intersections[i][j] !== undefined) {
                                    intersections[i][j].destroy();
                                    intersections[i][j] = undefined;
                                }
                            }
                        }
                    }
                }
            }
            return intersections;
        }

    }

    preload ()
    {
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        //  Load the https://labs.phaser.io/assets for the game - Replace with the path to your own https://labs.phaser.io/assets
        // this.load.setPath("assets/games/coin-clicker/");

        this.load.image("delete", "assets/delete.png");
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
        this.load.spritesheet('depart', 'assets/depart.png', { frameWidth: 46, frameHeight: 40 });
        this.load.spritesheet('dude', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('flower', 'https://labs.phaser.io/assets/sprites/flower-exo.png');
        this.load.image('cursor', 'https://labs.phaser.io/assets/sprites/drawcursor.png');
        this.load.image('restart', 'assets/refresh-small-2.png');
        this.load.spritesheet('diamonds', 'https://labs.phaser.io/assets/sprites/diamonds32x24x5.png', { frameWidth: 32, frameHeight: 24 });
        this.load.spritesheet('portal', 'assets/portal.png', { frameWidth: 46, frameHeight: 48 });
    }

    update()
    {
    }

}