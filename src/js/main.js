/*! svg.draw.js - v2.0.3 - 2017-06-19
 * https://github.com/svgdotjs/svg.draw.js
 * Copyright (c) 2017 Ulrich-Matthias Schäfer; Licensed MIT */

import {
  SVG,
  Shape,
  Container,
  Rect,
  nodeOrNew,
  extend
} from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draw.js";
import "@svgdotjs/svg.draggable.js";

const draww = SVG()
  .addTo("#drawing")
  .size("100%", "100%");
//draww(draw);
const shapes = [];
let index = 0;
let shape;

const getDrawObject = () => {
  shape = document.getElementById("shape").value;
  const color = document.getElementById("color").value;
  const option = {
    stroke: color,
    "stroke-width": 2,
    "fill-opacity": 0
  };
  const markerOption = {
    fill: color
  };

  switch (shape) {
    case "mouse paint":
      return draww.polyline().attr(option);
    case "ellipse":
      return draww.ellipse().attr(option);
    case "rect":
      return draww.rect().attr(option);
    case "arrow":
      var arrow = draww.arrow();
      arrow.reference("marker-end").attr(markerOption);
      return arrow.attr(option);
    case "rounded-rect":
      return draww.rounded().attr(option);
  }
  return null;
};

draww.on("mousedown", event => {
  const shape = getDrawObject();
  shapes[index] = shape;
  shape.draw(event);
});

draww.on("touchstart", event => {
  const shape = getDrawObject();
  shapes[index] = shape;
  shape.draw(event);
});

draww.on("mousemove", event => {
  if (shape === "mouse paint" && shapes[index]) {
    shapes[index].draw("point", event);
  }
});

draww.on("touchmove", event => {
  if (shape === "mouse paint" && shapes[index]) {
    shapes[index].draw("point", event);
  }
});

draww.on("mouseup", event => {
  if (shape === "mouse paint") {
    shapes[index].draw("stop", event);
    shapes[index].draw("done");
  } else {
    shapes[index].draw(event);
  }
  index++;
});

draww.on("touchend", event => {
  if (shape === "mouse paint") {
    shapes[index].draw("stop", event);
    shapes[index].draw("done");
  } else {
    shapes[index].draw(event);
  }
  index++;
});

class IPoint extends Shape {
  constructor(node) {
    super(nodeOrNew("circle", node), node);
    this.fill({ color: "yellow", opacity: 0.5 })
      .stroke({ color: "black", opacity: "1" })
      .attr({ r: 20 });
  }
  setPos(x, y) {
    return this.attr({ cx: x, cy: y });
  }
}
extend(Container, {
  iPoint: function(x, y) {
    return this.put(new IPoint())
      .setPos(x, y)
      .draggable();
  }
});

class Rounded extends Rect {
  constructor(node) {
    super(nodeOrNew("circle", node), node);
    this.fill({ color: "yellow", opacity: 0.5 })
      .stroke({ color: "black", opacity: "1" })
      .attr({ r: 20 });
  }
  // Create method to proportionally scale the rounded corners
  size(width, height) {
    return this.attr({
      width: width,
      height: height,
      rx: height / 5,
      ry: height / 5
    });
  }
}

// Add a method to create a rounded rect
extend(Container, {
  // Create a rounded element
  rounded: function(width, height) {
    return this.put(new Rounded()).size(width, height);
  }
});

/*
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
*/

// This is custom extension of line, polyline, polygon which doesn't draw the circle on the line.
/*
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
      var x, y;
      if (e.changedTouches && e.changedTouches.length) {
          x = e.changedTouches[0].clientX;
          y = e.changedTouches[0].clientY;
      } else {
          x = e.clientX;
          y = e.clientY;
      }
      
      var p = this.transformPoint(x, y);
      arr.push(this.snapToGrid([p.x, p.y]));
    }

    this.el.plot(arr);

  },

  point:function(e){

    if (this.el.type.indexOf('poly') > -1) {

      var x, y;
      if (e.changedTouches && e.changedTouches.length) {
          x = e.changedTouches[0].clientX;
          y = e.changedTouches[0].clientY;
      } else {
          x = e.clientX;
          y = e.clientY;
      }

      // Add the new Point to the point-array
      var p = this.transformPoint(x, y),
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
*/
