// Un cas particulier doit être ajouté : Si on se retrouve dans a zone d'influence d'un Magnet, il prend le pas sur tous les autres calculs. En particulier le calcul de proximité avec les Line, qui sont pour l'instant prioritaires lorsque la distance avec la Line est inférieure à la distance avec le Magnet.

export class Magnetize {

    constructor(scene, magnets) {
        scene.graphics_dragon_debug = scene.add.graphics();
        scene.graphics_magnetize_debug = scene.add.graphics();
        magnets.forEach((magnet, index) => {
            magnet.debug_text = scene.add.text(magnet.x, magnet.y + 10, "pouet", {}).setAlign('center').setOrigin(0.5);
            scene.graphics_magnetize_debug[index] = scene.add.graphics();
        });
    }

    magnetize = function (scene, drawingLine, magnets, pointer, dist, moving_end_point, debug = false) {
        magnets = magnets.filter( magnet => {
            return magnet !== undefined;
        });
        let dists = magnets.map((magnet, index) => {
            let lineToMagnet
            if (moving_end_point == "end") {
                lineToMagnet = new Phaser.Geom.Line(drawingLine.geom.x1, drawingLine.geom.y1, magnet.x, magnet.y);
            } else {
                lineToMagnet = new Phaser.Geom.Line(drawingLine.geom.x2, drawingLine.geom.y2, magnet.x, magnet.y);
            }
            let nearest = Phaser.Geom.Line.GetNearestPoint(lineToMagnet, pointer);
            let lineToNearest
            if (moving_end_point == "end") {
                lineToNearest = new Phaser.Geom.Line(drawingLine.geom.x1, drawingLine.geom.y1, nearest.x, nearest.y);
            } else {
                lineToNearest = new Phaser.Geom.Line(drawingLine.geom.x2, drawingLine.geom.y2, nearest.x, nearest.y);
            }
            let shortest_distance = Phaser.Geom.Line.GetShortestDistance(lineToMagnet, pointer);
            let ne = Math.round(Phaser.Math.Distance.BetweenPoints(pointer, nearest));
            let sh = Math.round(shortest_distance);
            let pi = Math.round(Phaser.Math.Distance.BetweenPoints(pointer, magnet));
            let il = Phaser.Geom.Intersects.PointToLine(magnet, lineToNearest)
            let nl = Phaser.Geom.Intersects.PointToLine(nearest, lineToMagnet)
            let nil = il// || nl
            if (debug) {
                scene.graphics_magnetize_debug[index].clear();
                scene.graphics_magnetize_debug[index].fillPointShape(nearest, 5);
                scene.graphics_magnetize_debug[index].lineBetween(lineToMagnet.x1, lineToMagnet.y1, lineToMagnet.x2, lineToMagnet.y2);
                let text = "SH : " + sh + "\n" + "NE : " + ne + "\n" + "PI : " + pi + "\n" + "IL : " + il + "\n" + "NL : " + nl + "\n" + "NIL : " + nil;
                magnet.debug_text.setText(text);   
            }
            return {
                magnet,
                shortest_distance,
                nearest,
                direction_is_ok: nil
            }
        });
        if (dists.length > 0) {
            let d = dists.reduce((prev, current) => (prev && prev.shortest_distance < current.shortest_distance) ? prev : current);
            if (Phaser.Math.Distance.BetweenPoints(pointer, d.magnet) < dist) {
                if (moving_end_point == "end") {
                    drawingLine.setTo(drawingLine.geom.x1, drawingLine.geom.y1, d.magnet.x, d.magnet.y)
                } else {
                    drawingLine.setTo(d.magnet.x, d.magnet.y, drawingLine.geom.x2, drawingLine.geom.y2)
                }
                return {magnet: d.magnet, x: d.magnet.x, y: d.magnet.y}
            }
            if (d.direction_is_ok && d.shortest_distance < dist) {
                if (Phaser.Math.Distance.BetweenPoints(pointer, d.magnet) < dist) {
                    if (moving_end_point == "end") {
                        drawingLine.setTo(drawingLine.geom.x1, drawingLine.geom.y1, d.magnet.x, d.magnet.y)
                    } else {
                        drawingLine.setTo(d.magnet.x, d.magnet.y, drawingLine.geom.x2, drawingLine.geom.y2)
                    }
                    return {x: d.magnet.x, y: d.magnet.y}
                } else {
                    if (moving_end_point == "end") {
                        drawingLine.setTo(drawingLine.geom.x1, drawingLine.geom.y1, d.nearest.x, d.nearest.y)
                    } else {
                        drawingLine.setTo(d.nearest.x, d.nearest.y, drawingLine.geom.x2, drawingLine.geom.y2)
                    }
                    return {x: d.nearest.x, y: d.nearest.y}
                }
            } else {
                if (moving_end_point == "end") {
                    drawingLine.setTo(drawingLine.geom.x1, drawingLine.geom.y1, pointer.x, pointer.y)
                } else {
                    drawingLine.setTo(pointer.x, pointer.y, drawingLine.geom.x2, drawingLine.geom.y2)
                }
                return {x: pointer.x, y: pointer.y}
            }
        } else {
            if (moving_end_point == "end") {
                drawingLine.setTo(drawingLine.geom.x1, drawingLine.geom.y1, pointer.x, pointer.y)
            } else {
                drawingLine.setTo(pointer.x, pointer.y, drawingLine.geom.x2, drawingLine.geom.y2)
            }
            return {x: pointer.x, y: pointer.y}
        }
    }

    magnetizeDragon = function (scene, lines, pointer, debug = false) {
        if (!lines || lines.length == 0) {
            return pointer;
        }
        let dists = lines.map((line, index) => {
            let geomLine = new Phaser.Geom.Line(line.geom.x1, line.geom.y1, line.geom.x2, line.geom.y2);
            let shortest_distance = Phaser.Geom.Line.GetShortestDistance(geomLine, pointer);
            let nearest_point = Phaser.Geom.Line.GetNearestPoint(geomLine, pointer);

            // Si le point le plus proche de la ligne n'est pas sur le segment, prendre l'extrémité la plus proche
            if (!Phaser.Geom.Intersects.PointToLine(nearest_point, geomLine)) {
                let pointA = new Phaser.Geom.Point(line.geom.x1, line.geom.y1)
                let pointB = new Phaser.Geom.Point(line.geom.x2, line.geom.y2)
                let distA = Phaser.Math.Distance.BetweenPoints(nearest_point, pointA)
                let distB = Phaser.Math.Distance.BetweenPoints(nearest_point, pointB)
                
                if (distA < distB) {
                    nearest_point = {
                        x: pointA.x,
                        y: pointA.y,
                    }
                } else {
                    nearest_point = {
                        x: pointB.x,
                        y: pointB.y,
                    }
                }
            }
            
            return {
                line_key: index,
                line,
                shortest_distance,
                nearest_point
            }
        });
        let min = dists.reduce((prev, current) => (prev && prev.shortest_distance < current.shortest_distance) ? prev : current );
        
        return min
    }

}