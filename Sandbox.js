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
        const button_back = this.add.image(800 - 45, 135, 'back', 0).setOrigin(0.5, 0.5).setInteractive();
        button_back.on('pointerup', (event) => {
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
                        relocateAll();
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
                    setAnchor(dragon, magnetPoint.line_key, magnetPoint.nearest_point);
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
                        scene.depart.lines_key.push(magnetPoint.line_key);
                        setAnchor(scene.depart, magnetPoint.line_key, magnetPoint.nearest_point);
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
                        scene.arrivee.lines_key.push(magnetPoint.line_key);
                        setAnchor(scene.arrivee, magnetPoint.line_key, magnetPoint.nearest_point);
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
                            // Dragons, départ et arrivée restent entre leurs bornes (sur toutes les lignes)
                            relocateAll();
                            this.x = magnetPoint.x
                            this.y = magnetPoint.y
                        });
                        line.start.on('dragend', function (pointer, dragX, dragY) {
                            //Rallonger la ligne pour qu'elle intersecte toujours l'autre ligne
                            Phaser.Geom.Line.Extend(line, 1, 0)
                            // Generate intersections
                            scene.intersections = generateIntersections(scene.lines, scene.intersections);
                            relocateAll();
                        });
                    }
                    if (!line.end) {
                        line.end = new Handle(line.name + "-end", scene, line.geom.x2, line.geom.y2, 'drag', line)
                        line.end.on('drag', function (pointer, dragX, dragY) {
                            let magnetPoint = magnetize.magnetize(scene, line, scene.intersections.flat(), pointer, 40, "end", false);
                            // Dragons, départ et arrivée restent entre leurs bornes (sur toutes les lignes)
                            relocateAll();
                            this.x = magnetPoint.x
                            this.y = magnetPoint.y
                        });
                        line.end.on('dragend', function (pointer, dragX, dragY) {
                            //Rallonger la ligne pour qu'elle intersecte toujours l'autre ligne
                            Phaser.Geom.Line.Extend(line, 0, 1)
                            // Generate intersections
                            scene.intersections = generateIntersections(scene.lines, scene.intersections);
                            relocateAll();
                        
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
                                if (line && line.dragon_keys.includes(key)) {
                                    const index = line.dragon_keys.indexOf(key);
                                    line.dragon_keys.splice(index, 1);
                                }
                            })
                            magnetPoint.line.dragon_keys.push(key);
                            dragon.lines = [magnetPoint.line];
                            setAnchor(dragon, magnetPoint.line_key, magnetPoint.nearest_point);
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
                        depart.lines_key = [magnetPoint.line_key]
                        setAnchor(depart, magnetPoint.line_key, magnetPoint.nearest_point);
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
                        arrivee.lines_key = [magnetPoint.line_key]
                        setAnchor(arrivee, magnetPoint.line_key, magnetPoint.nearest_point);
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
                    let jsonIntersectionNew = {
                        "name": lineA_key + '-' + lineB_key,
                        "position": {
                            "x": Math.round(lineAB_intersection.x * 1000) / 1000,
                            "y": Math.round(lineAB_intersection.y * 1000) / 1000,
                        },
                        "lines": [lineA_index, lineB_index]
                    }
                    // On vérifie que ce n'est pas une intersection déjà existante, si c'est le cas, on ajoute la ligne parmis les lignes de l'intersection
                    let exists = false;
                    jsonIntersections.forEach(jsonIntersection => {
                        if (jsonIntersection.position.x == jsonIntersectionNew.position.x && jsonIntersection.position.y == jsonIntersectionNew.position.y) {
                            if (!jsonIntersection.lines.includes(lineA_index)) {
                                jsonIntersection.lines.push(lineA_index)
                            }
                            if (!jsonIntersection.lines.includes(lineB_index)) {
                                jsonIntersection.lines.push(lineB_index)
                            }
                            exists = true;
                        }
                    });
                    if (!exists) {
                        jsonIntersections.push(jsonIntersectionNew);
                    }
                });
            });
            json.intersections = jsonIntersections
            let jsonDragons = []
            scene.dragons.forEach((dragon, dragon_key) => {
                console.log(dragon);
                
                let jsonDragon = {
                    "name": dragon_key,
                    "position": {
                        "x": dragon.x,
                        "y": dragon.y
                    },
                    "lines": []
                }
                // dragon.lines contient les objets Lineee : on retrouve leur index dans scene.lines, puis dans jsonLines
                jsonDragon.lines = dragon.lines.map(lineObject => {
                    const line_key = scene.lines.indexOf(lineObject);
                    return jsonLines.findIndex((line) => {
                        return line.name == line_key;
                    })
                });
                jsonDragons.push(jsonDragon);
            });
            json.dragons = jsonDragons
            if (scene.depart) {
                json.start = {
                    x: scene.depart.x,
                    y: scene.depart.y,
                }
                json.start.lines = scene.depart.lines_key.map(line_key => {
                    return jsonLines.findIndex((line) => {
                        return line.name == line_key;
                    })
                });
            }
            if (scene.arrivee) {
                json.end = {
                    x: scene.arrivee.x,
                    y: scene.arrivee.y,
                }
                json.end.lines = scene.arrivee.lines_key.map(line_key => {
                    return jsonLines.findIndex((line) => {
                        return line.name == line_key;
                    })
                });
            }
            console.log(json);
            
            saveLevel(json);
        });


        // Enregistre le niveau sur le serveur (save-level.php, remplace l'API AWS éteinte le 2026-11-14).
        // Sans serveur PHP (ex. en local avec http-server), propose de télécharger le niveau à la place.
        let saving = false;
        async function saveLevel(json) {
            if (saving) return;
            const warnings = countWarnings();
            if (warnings > 0 && !window.confirm(warnings + " élément(s) en rouge : leur segment a changé (intersection disparue ou ajoutée). Enregistrer quand même ?")) return;
            const password = window.prompt("Mot de passe pour enregistrer le niveau :");
            if (password === null) return;
            saving = true;
            showMessage("Enregistrement...", "#000000");
            try {
                const response = await fetch("save-level.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ password, json }),
                });
                const result = await response.json().catch(() => null);
                if (response.ok && result?.ok) {
                    showMessage("Niveau enregistré !", "#006600");
                } else if (result?.error) {
                    showMessage(result.error, "#aa0000");
                } else {
                    throw new Error("HTTP " + response.status);
                }
            } catch (error) {
                console.error(error);
                showMessage("Serveur indisponible", "#aa0000");
                if (window.confirm("Le serveur n'a pas pu enregistrer le niveau. Le télécharger à la place ?")) {
                    downloadLevel(json);
                }
            } finally {
                saving = false;
            }
        }

        function downloadLevel(json) {
            const id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "niveau-" + Date.now();
            const level = { id, datetime: new Date().toISOString(), json };
            const blob = new Blob([JSON.stringify(level, null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "niveau-" + id + ".json";
            link.click();
            URL.revokeObjectURL(link.href);
        }

        let messageText = null;
        function showMessage(text, color) {
            if (messageText) messageText.destroy();
            messageText = scene.add.text(400, 570, text, { fontFamily: 'Arial Black', fontSize: 20, color }).setOrigin(0.5).setDepth(100);
            scene.time.delayedCall(4000, () => { if (messageText && messageText.text === text) { messageText.destroy(); messageText = null; } });
        }


        // ANCRAGE DES DRAGONS, DU DÉPART ET DE L'ARRIVÉE
        //
        // Un dragon bloque un segment de fil compris entre deux "bornes" : deux intersections consécutives,
        // ou une intersection et une extrémité du fil (où se trouve un portail en jeu). Le départ et l'arrivée
        // sont eux aussi dans un segment, d'un côté ou de l'autre des dragons.
        // On retient donc pour chaque objet : sa ligne, ses deux bornes et sa position u (0..1) entre elles.
        // Une borne est identifiée par 'start', 'end' ou la clé de l'autre ligne (deux lignes droites ne se
        // croisent qu'une fois). Quand un fil bouge, l'objet est replacé entre ses bornes.
        // Si une borne disparaît, si une intersection apparaît entre les bornes (le segment est coupé)
        // ou si le segment devient nul, l'objet reste où il est et passe en rouge : c'est à l'auteur de décider.

        const EPSILON_T = 1e-6;
        const WARNING_TINT = 0xff3333;

        // Position relative d'un point sur une ligne : 0 = début, 1 = fin
        function paramOnLine(line, point) {
            const dx = line.geom.x2 - line.geom.x1;
            const dy = line.geom.y2 - line.geom.y1;
            const lengthSq = dx * dx + dy * dy;
            if (lengthSq === 0) return 0;
            const t = ((point.x - line.geom.x1) * dx + (point.y - line.geom.y1) * dy) / lengthSq;
            return Phaser.Math.Clamp(t, 0, 1);
        }

        // Bornes d'une ligne (extrémités et intersections), triées le long de la ligne
        function nodesOnLine(lineKey) {
            const line = scene.lines[lineKey];
            const nodes = [{ id: 'start', t: 0 }, { id: 'end', t: 1 }];
            scene.lines.forEach((other, otherKey) => {
                if (other && otherKey !== lineKey) {
                    const point = Phaser.Geom.Intersects.GetLineToLine(line.geom, other.geom);
                    if (point) nodes.push({ id: otherKey, t: paramOnLine(line, point) });
                }
            });
            return nodes.sort((n1, n2) => n1.t - n2.t);
        }

        // Calcule l'ancrage d'un objet qu'on vient de poser ou de déplacer à la main
        function setAnchor(object, lineKey, point) {
            const t = paramOnLine(scene.lines[lineKey], point);
            const nodes = nodesOnLine(lineKey);
            let i = 0;
            // Premier segment de longueur non nulle qui contient t
            while (i < nodes.length - 2 && (nodes[i + 1].t < t || nodes[i + 1].t - nodes[i].t < EPSILON_T)) i++;
            const prev = nodes[i], next = nodes[i + 1];
            const length = next.t - prev.t;
            object.anchor = {
                line: lineKey,
                prev: prev.id,
                next: next.id,
                u: length > EPSILON_T ? Phaser.Math.Clamp((t - prev.t) / length, 0, 1) : 0,
            };
            setWarning(object, false);
        }

        function setWarning(object, warning) {
            object.anchorWarning = warning;
            if (warning) object.setTint(WARNING_TINT); else object.clearTint();
        }

        function placeObject(object, x, y) {
            object.setPosition(x, y);
            if (object.handle) object.handle.setPosition(x, y);
        }

        // Replace un objet entre ses bornes, ou le signale si son segment n'existe plus tel quel
        function relocate(object) {
            const anchor = object.anchor;
            if (!anchor) return;
            const line = scene.lines[anchor.line];
            if (!line) return; // Ligne supprimée : l'objet est supprimé avec elle
            const nodes = nodesOnLine(anchor.line);
            const prev = nodes.find(n => n.id === anchor.prev);
            const next = nodes.find(n => n.id === anchor.next);
            const pointAt = t => ({
                x: line.geom.x1 + (line.geom.x2 - line.geom.x1) * t,
                y: line.geom.y1 + (line.geom.y2 - line.geom.y1) * t,
            });

            if (!prev || !next) {
                // Une borne a disparu : on garde la position actuelle, ramenée sur la ligne
                const p = pointAt(paramOnLine(line, object));
                placeObject(object, p.x, p.y);
                setWarning(object, true);
                return;
            }
            const p = pointAt(prev.t + anchor.u * (next.t - prev.t));
            placeObject(object, p.x, p.y);
            // Les bornes doivent rester voisines (aucune intersection entre elles) et distinctes
            const low = Math.min(prev.t, next.t), high = Math.max(prev.t, next.t);
            const between = nodes.filter(n => n !== prev && n !== next && n.t > low + EPSILON_T && n.t < high - EPSILON_T);
            setWarning(object, between.length > 0 || high - low < EPSILON_T);
        }

        // À appeler après toute modification du réseau : un fil déplacé déplace aussi les bornes des autres fils
        function relocateAll() {
            scene.dragons.forEach(dragon => { if (dragon) relocate(dragon); });
            if (scene.depart) relocate(scene.depart);
            if (scene.arrivee) relocate(scene.arrivee);
        }

        function countWarnings() {
            return [...scene.dragons, scene.depart, scene.arrivee].filter(o => o && o.anchorWarning).length;
        }

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
            relocateAll();
            if (scene.depart && scene.depart.lines_key.includes(key)) {
                scene.depart.del.destroy()
                delete scene.depart.del
                scene.depart.destroy()
                delete scene.depart
            }
            if (scene.arrivee && scene.arrivee.lines_key.includes(key)) {
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