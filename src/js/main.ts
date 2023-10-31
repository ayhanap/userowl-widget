/*! svg.draw.js - v2.0.3 - 2017-06-19
 * https://github.com/svgdotjs/svg.draw.js
 * Copyright (c) 2017 Ulrich-Matthias Schäfer; Licensed MIT */
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.filter.js";
import "@userowl/svg.draw.js";
import { registerPlugin } from "@userowl/svg.draw.js";
// import "./comment-circle";
import { ExtendedSvg } from "@/src/js/ExtendedSvg";
import { Element, LinkedHTMLElement, SVG } from "@svgdotjs/svg.js";
import { CommentCircle, closeOpenCommentPopups } from "./comment-circle";

export const draww = SVG().size("100%", "100%") as ExtendedSvg;
//draww(draw);

const shapes: Element[] = [];
let index = 0;
let commentIndex = 1;
let shape: string;

export const deleteLastDrawElement = () => {
  const el = shapes.pop();
  if (el instanceof CommentCircle) {
    commentIndex--;
  }
  el.remove();
  index--;
};

export const clearDrawing = () => {
  draww.clear();
  shapes.splice(0, shapes.length);
  index = 0;
  commentIndex = 1;
};

export const hasElement = () => {
  return shapes.length > 0;
};

const shadowFilter = draww.filter(function(add) {
  add.dropShadow(add.$source, 0, 0, 3);
  // this.size("2500%", "2000%").move("-1250%", "-1250%");
  add.node.setAttribute("filterUnits", "userSpaceOnUse");
  /* var blur = add.offset(20, 20).gaussianBlur(5)

  add.blend(add.$source, blur)

  this.size('200%','200%').move('-50%', '-50%')
  */
});

const getDrawObject = () => {
  shape = (document.querySelector(
    ".uowl-sat-button-bar-button--selected"
  ) as HTMLElement).dataset.type;
  const color = (document.querySelector(
    ".uowl-sat-button-bar-color-picker"
  ) as HTMLElement).dataset.color;
  // shape = document.getElementById("shape").value;
  // const color = document.getElementById("color").value;
  // const color = "#ff0000";
  const option = {
    stroke: color,
    "stroke-width": 6,
    "fill-opacity": 0,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    opacity: 0.6,
  };

  const maskOption = {
    stroke: color,
    fill: color,
    "stroke-width": 6,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    opacity: 0.6,
  };

  const optionHighlighter = {
    stroke: color,
    "stroke-width": 16,
    "fill-opacity": 0,
    // "stroke-linecap": "round",
    // "stroke-linejoin": "round",
    opacity: 0.5,
  };

  const optionComment = {
    fill: color,
  };
  const markerOption = {
    fill: color,
  };

  var drawObject: Element;
  switch (shape) {
    case "pen":
      drawObject = draww.polyline().attr(option);
      break;
    case "highlight":
      drawObject = draww.polyline().attr(optionHighlighter);
      break;
    case "ellipse":
      drawObject = draww.ellipse().attr(option);
      break;
    case "rect":
      drawObject = draww.rect().attr(option);
      break;
    case "mask":
      drawObject = draww.rect().attr(maskOption);
      break;
    case "arrow":
      drawObject = draww.arrow().attr(option);
      drawObject.reference("marker-end").attr(markerOption);
      break;
    // case "rounded-rect":
    //   drawObject = draww.rounded().attr(option);
    //   break;
    case "comment":
      drawObject = draww.commentCircle(optionComment, commentIndex);
      drawObject.node
        .querySelector(".uowl-sat-comment-delete")
        .addEventListener("click", (e) => {
          const itemIndex = shapes.indexOf(drawObject);
          shapes.splice(itemIndex, 1);
          shapes
            .filter((el) => el instanceof CommentCircle)
            .map((el) => el as CommentCircle)
            .filter(
              (commentCircle) =>
                commentCircle.getValue() >
                (drawObject as CommentCircle).getValue()
            )
            .forEach((commentCircle) =>
              commentCircle.setValue(commentCircle.getValue() - 1)
            );
          drawObject.remove();
          // if (!hasElement()) {
          //   ev.currentTarget.classList.add("uowl-sat-button-bar-button-disabled");
          // }
          index--;
          commentIndex--;
        });
      commentIndex++;
      break;
  }
  drawObject.draggable();
  if (!(drawObject instanceof CommentCircle)) {
    drawObject.on("beforedrag", (e) => {
      closeOpenCommentPopups();
      draww.fire("beforedrag", e);
    });
    drawObject.on("dragend", (e) => {
      draww.fire("dragend", e);
    });
  }

  drawObject.on("drawdone.apaydin", (e) => {
    const target = e.target as LinkedHTMLElement;
    if (shape !== "highlight") {
      target.instance.attr({ opacity: 1 });
    }
    target.instance.off("drawdone.apaydin");
    // eslint-disable-next-line no-unused-vars
    if (shape !== "comment") {
      drawObject.on("mouseover.apaydin", (e) => {
        drawObject.filterWith(shadowFilter);
      });
    }
    drawObject.addClass("uowl-draggable-svg");

    draww.fire("drawdone");
  });

  // eslint-disable-next-line no-unused-vars
  drawObject.on("mouseup.apaydin", (e) => {
    // console.log(e);
  });
  // eslint-disable-next-line no-unused-vars
  drawObject.on("mouseout.apaydin", (e) => {
    drawObject.unfilter();
  });
  return drawObject;
};

let drawing;

draww.on("mousedown", (event) => {
  const target = event.target as LinkedHTMLElement;
  if (
    !(target.parentNode as HTMLElement).classList.contains("uowl-sat-canvas")
  ) {
    return;
  }
  if (closeOpenCommentPopups()) {
    return;
  }
  const shape = getDrawObject();
  shapes[index] = shape;
  shape.draw(event);
  drawing = true;
});

draww.on(
  "touchstart",
  (event: TouchEvent) => {
    event.preventDefault();
    const target = event.target as LinkedHTMLElement;

    if (
      !(target.parentNode as HTMLElement).classList.contains("uowl-sat-canvas")
    ) {
      return;
    }
    if (event.touches.length > 1) {
      //the event is multi-touch
      //you can then prevent the behavior
      event.preventDefault();
      return;
    }

    if (closeOpenCommentPopups()) {
      return;
    }
    const shape = getDrawObject();
    shapes[index] = shape;
    shape.draw(event);
    drawing = true;
  },
  undefined,
  { passive: false }
);

draww.on("mousemove", (event) => {
  if ((shape === "pen" || shape === "highlight") && shapes[index]) {
    shapes[index].draw("point", event);
  }
});

draww.on(
  "touchmove",
  (event: TouchEvent) => {
    if ((shape === "pen" || shape === "highlight") && shapes[index]) {
      shapes[index].draw("point", event);
    }
  },
  undefined,
  { passive: true }
);

draww.on("mouseup", (event) => {
  if (shapes[index]) {
    if (shape === "pen" || shape === "highlight" || shape === "comment") {
      // shapes[index].draw("stop", event);
      shapes[index].draw("done", event);
    } else {
      shapes[index].draw(event);
    }
    index++;
  }
});

draww.on(
  "touchend",
  (event: TouchEvent) => {
    if (shapes[index]) {
      if (shape === "pen" || shape === "highlight") {
        // shapes[index].draw("stop", event);
        shapes[index].draw("done");
      } else {
        shapes[index].draw(event);
      }
      index++;
    }
  },
  undefined,
  { passive: true }
);

// class IPoint extends Shape {
//   constructor(node) {
//     super(nodeOrNew("circle", node), node);
//     this.fill({ color: "yellow", opacity: 0.5 })
//       .stroke({ color: "black", opacity: "1" })
//       .attr({ r: 20 });
//   }
//   setPos(x, y) {
//     return this.attr({ cx: x, cy: y });
//   }
// }
// extend(Container, {
//   iPoint: function(x, y) {
//     return this.put(new IPoint())
//       .setPos(x, y)
//       .draggable();
//   },
// });

// class Rounded extends Rect {
//   constructor(node) {
//     super(nodeOrNew("circle", node), node);
//     this.fill({ color: "yellow", opacity: 0.5 })
//       .stroke({ color: "black", opacity: "1" })
//       .attr({ r: 20 });
//   }
//   // Create method to proportionally scale the rounded corners
//   size(width, height) {
//     return this.attr({
//       width: width,
//       height: height,
//       rx: height / 5,
//       ry: height / 5,
//     });
//   }
// }

// Add a method to create a rounded rect
// extend(Container, {
//   // Create a rounded element
//   rounded: function(width, height) {
//     return this.put(new Rounded()).size(width, height);
//   },
// });

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

registerPlugin("line polyline polygon", {
  // eslint-disable-next-line no-unused-vars
  init: function(e: MouseEvent | TouchEvent) {
    // When we draw a polygon, we immediately need 2 points.
    // One start-point and one point at the mouse-position

    this.set = new Set();

    var p = this.startPoint,
      arr = [
        [p.x, p.y],
        [p.x, p.y],
      ];

    this.el.plot(arr);
  },

  // The calc-function sets the position of the last point to the mouse-position (with offset ofc)
  calc: function(e: MouseEvent | TouchEvent) {
    var arr = this.el.array().valueOf();
    arr.pop();

    if (e) {
      var x, y;
      if (e instanceof TouchEvent) {
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

  point: function(e: MouseEvent | TouchEvent) {
    if (this.el.type.indexOf("poly") > -1) {
      var x, y;
      if (e instanceof TouchEvent) {
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
      this.el.fire("drawpoint", { event: e, p: { x: p.x, y: p.y }, m: this.m });

      return;
    }

    // We are done, if the element is no polyline or polygon
    this.stop(e);
    this.el.fire("drawdone");
  },

  clean: function() {
    // Remove all circles
    this.set.forEach(function() {
      this.remove();
    });

    this.set.clear();

    delete this.set;
  },
});
