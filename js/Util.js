Math.constrain = (value, min, max) => value < min ? min : value > max ? max : value;
Math.map = (value, min, max, newMin, newMax) => (value - min) / (max - min) * (newMax - newMin) + newMin;
Math.rad2deg = (angle) => 57.29577951 * angle;
Math.deg2rad = (angle) => 0.017453292 * angle;

function Vector(x = 0, y = 0) {
    this.x = x;
    this.y = y;
}

/**
 * Returns the magnitude of this vector
 */
Vector.prototype.magnitude = function () { return Math.sqrt(this.x * this.x + this.y * this.y) }

/**
 * Normalizes this vector
 * @returns this vector
 */
Vector.prototype.normalize = function () {
    if (this.x == 0 && this.y == 0) {
        return;
    }
    let magnitude = this.magnitude(); // Since the magnitude would change when changing either variable
    this.x /= magnitude;
    this.y /= magnitude;
    return this;
}

/**
 * Returns a new normalized vector without modifying the original
 */
Vector.prototype.normalized = function () { 
    if (this.x == 0 && this.y == 0) {
        return new Vector();
    }
    let magnitude = this.magnitude();
    return new Vector(this.x / magnitude, this.y / magnitude);
}

/**
 * Scales each vector component by {factor}
 * @param {number} factor 
 * @returns This vector after scaling
 */
Vector.prototype.scale = function (factor) {
    this.x *= factor;
    this.y *= factor;
    return this;
}
/**
 * Adds a specified amount to each vector component
 * @param {number} x X component to add
 * @param {number} y Y component to add
 */
Vector.prototype.add = function (x, y) {
    this.x += x;
    this.y += y;
    return this;
}
Vector.prototype.round = function (accuracy) {
    this.x = Math.floor(this.x / accuracy) * accuracy;
    this.y = Math.floor(this.y / accuracy) * accuracy;
}

/**
 * Returns a new vector with the same components
 */
Vector.prototype.get = function() { return new Vector(this.x, this.y)}

/**
 * Draws a hexagon with rounded corners
 * @param {object} p5Canvas Must receive the p5 canvas in order to render the object
 * @param {number} x X coordinate (center)
 * @param {number} y Y coordinate (center)
 * @param {number} a Apothem of the hexagon
 * @param {number} r Radius of the corners
 */
function hexagon(p5Canvas, x, y, a, r) {
    p5Canvas.beginShape();
    for (let i = 0; i < 6; i++) {
        let rot = Math.PI / 3 * i;
        let hexRadius = a / Math.cos(Math.PI / 6);
        //p5Canvas.point(x + Math.cos(rot) * hexRadius, y + Math.sin(rot) * hexRadius);
        //p5Canvas.line(x + Math.cos(rot) * hexRadius, y + Math.sin(rot) * hexRadius,
        //x + Math.cos(rot + Math.PI / 3) * hexRadius, y + Math.sin(rot + Math.PI / 3) * hexRadius);

        for (let j = 0; j < r * Math.PI / 3; j++) {
            let newRot = j / r;
            //applies rounded corners to the hexagon
            p5Canvas.vertex(x + Math.cos(rot) * (hexRadius - r * Math.PI * 3 / 8) + Math.cos(newRot - Math.PI / 6 + i * Math.PI / 3) * r,
                y + Math.sin(rot) * (hexRadius - r * Math.PI * 3 / 8) + Math.sin(newRot - Math.PI / 6 + i * Math.PI / 3) * r)
        }
    }
    p5Canvas.endShape(p5Canvas.CLOSE);
}