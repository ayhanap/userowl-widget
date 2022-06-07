/*! svg.draw.js - v2.0.3 - 2017-06-19
* https://github.com/svgdotjs/svg.draw.js
* Copyright (c) 2017 Ulrich-Matthias Schäfer; Licensed MIT */

require('svg.js');
require('./svg.draw.js');

const draw = SVG('drawing');
const shapes = [];
let index = 0;
let shape;

const getDrawObject = () => {
  shape = document.getElementById('shape').value;
  const color = document.getElementById('color').value;
  const option = {
    stroke: color,
    'stroke-width': 2,
    'fill-opacity': 0,
  };

  switch (shape) {
    case 'mouse paint':
      return draw.polyline().attr(option);
    case 'ellipse':
      return draw.ellipse().attr(option);
    case 'rect':
      return draw.rect().attr(option);
    case 'arrow':
      return draw.arrow().attr(option);
      case 'rounded-rect':
        return draw.rounded().attr(option);
  }
  return null;
}


draw.on('mousedown', event => {
  const shape = getDrawObject();
  shapes[index] = shape;
  shape.draw(event);
});

draw.on('touchstart', event => {
  const shape = getDrawObject();
  shapes[index] = shape;
  shape.draw(event);
});

draw.on('mousemove', event => {
  if (shape === 'mouse paint' && shapes[index]) {
    shapes[index].draw('point', event);
  }
})
draw.on('mouseup', event => {
  if (shape === 'mouse paint') {
    shapes[index].draw('stop', event);
    shapes[index].draw('done');
  } else {
    shapes[index].draw(event);
  }
  index++;
})

draw.on('touchend', event => {
  if (shape === 'mouse paint') {
    shapes[index].draw('stop', event);
    shapes[index].draw('done');
  } else {
    shapes[index].draw(event);
  }
  index++;
})

class IPoint extends SVG.Shape {
    constructor(node) {
        super(SVG.nodeOrNew("circle", node), node);
        this.fill({color: "yellow", opacity: 0.5})
            .stroke({color: 'black', opacity: '1'})
            .attr({r: 20});
    }
    setPos(x, y){
         return this.attr({cx: x, cy: y});
    }
}
SVG.extend(SVG.Container, {
    iPoint: function (x, y) {
        return this.put(new IPoint).setPos(x, y).draggable();
    }
});

class Rounded extends SVG.Rect {
  constructor(node) {
    super(SVG.nodeOrNew("circle", node), node);
    this.fill({color: "yellow", opacity: 0.5})
        .stroke({color: 'black', opacity: '1'})
        .attr({r: 20});
  }
  // Create method to proportionally scale the rounded corners
  size(width, height) {
    return this.attr({
      width:  width
    , height: height
    , rx:     height / 5
    , ry:     height / 5
    })
  }
}

// Add a method to create a rounded rect
SVG.extend(SVG.Container,  {
  // Create a rounded element
  rounded: function(width, height) {
    return this.put(new Rounded).size(width, height)
  }
});


SVG.Element.prototype.draw.extend('arrow', {
  init:function(e){
    var p = this.startPoint;
    
    this.el.attr({ x: p.x, y: p.y, height: 0, width: 0 });
  },
  calc:function (e) {
    var rect = {
      x: this.startPoint.x,
      y: this.startPoint.y
  },  p = this.transformPoint(e.clientX, e.clientY);

  rect.width = p.x - rect.x;
  rect.height = p.y - rect.y;

  // Snap the params to the grid we specified
  this.snapToGrid(rect);

  // When width is less than zero, we have to draw to the left
  // which means we have to move the start-point to the left
  if (rect.width < 0) {
      rect.x = rect.x + rect.width;
      rect.width = -rect.width;
  }

  // ...same with height
  if (rect.height < 0) {
      rect.y = rect.y + rect.height;
      rect.height = -rect.height;
  }

  // draw the element
  this.el.attr(rect);
  },
  clean:function(){
  }
});

// This is custom extension of line, polyline, polygon which doesn't draw the circle on the line. 
SVG.Element.prototype.draw.extend('line polyline polygon', {

  init:function(e){
    // When we draw a polygon, we immediately need 2 points.
    // One start-point and one point at the mouse-position

    this.set = new Set();

    var p = this.startPoint,
        arr = [
          [p.x, p.y],
          [p.x, p.y]
        ];

    this.el.plot(arr);
  },

  // The calc-function sets the position of the last point to the mouse-position (with offset ofc)
  calc:function (e) {
    var arr = this.el.array().valueOf();
    arr.pop();

    if (e) {
      var p = this.transformPoint(e.clientX, e.clientY);
      arr.push(this.snapToGrid([p.x, p.y]));
    }

    this.el.plot(arr);

  },

  point:function(e){

    if (this.el.type.indexOf('poly') > -1) {
      // Add the new Point to the point-array
      var p = this.transformPoint(e.clientX, e.clientY),
          arr = this.el.array().valueOf();

      arr.push(this.snapToGrid([p.x, p.y]));

      this.el.plot(arr);

      // Fire the `drawpoint`-event, which holds the coords of the new Point
      this.el.fire('drawpoint', {event:e, p:{x:p.x, y:p.y}, m:this.m});

      return;
    }

    // We are done, if the element is no polyline or polygon
    this.stop(e);

  },

  clean:function(){

    // Remove all circles
    this.set.forEach(function () {
      this.remove();
    });

    this.set.clear();

    delete this.set;

  },
});