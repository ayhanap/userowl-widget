import { ExtendedSvg } from "@/src/js/ExtendedSvg";
import {
  Placement,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import "@svgdotjs/svg.filter.js";
import {
  Circle,
  Container,
  Filter,
  G,
  LinkedHTMLElement,
  SVG,
  Svg,
  Text,
  extend,
} from "@svgdotjs/svg.js";

export class CommentCircle extends G {
  number: number;
  moved: boolean;
  beforeDragPos: { x: number; y: number };
  initialized: boolean;
  textEl: Text;
  constructor(number: number) {
    super();
    this.number = number;
    this.data("number", number);
    this.moved = false;
    this.beforeDragPos = { x: 0, y: 0 };
    this.initialized = false;
  }
  getValue() {
    return this.number;
  }
  setValue(number: number) {
    this.number = number;
    this.textEl.text(number.toString());
    this.data("number", number);
  }
  setTextElement(textEl: Text) {
    this.textEl = textEl;
  }
  setMoved(moved: boolean) {
    this.moved = moved;
  }
  isMoved() {
    return this.moved;
  }
  setBeforeDragPos(x: number, y: number) {
    this.beforeDragPos = { x, y };
  }
  getBeforeDragPos() {
    return this.beforeDragPos;
  }
  setInitialized(initialized: boolean) {
    this.initialized = initialized;
  }
  isInitialized() {
    return this.initialized;
  }
}

let shadowFilter: Filter;

export const closeOpenCommentPopups = () => {
  const openCommentCircles = document.querySelectorAll(
    ".uowl-sat-comment-group.uowl-sat-comment-group-open"
  );
  if (openCommentCircles.length > 0) {
    openCommentCircles.forEach((el) =>
      el.classList.remove("uowl-sat-comment-group-open")
    );
    return true;
  }
  return false;
};

const repositionPopupWithEvent: EventListener = (e: CustomEvent) => {
  if (e.type === "dragmove") {
    e.preventDefault();
  }

  const mouseEvent = e.detail.event;
  var x, y;
  if (mouseEvent.changedTouches && mouseEvent.changedTouches.length) {
    x = mouseEvent.changedTouches[0].clientX;
    y = mouseEvent.changedTouches[0].clientY;
  } else {
    x = mouseEvent.clientX;
    y = mouseEvent.clientY;
  }
  const target = e.target as LinkedHTMLElement;
  const currentTarget = e.currentTarget as LinkedHTMLElement;

  // e.detail.handler.el.translate(0, 0);
  const commentCircleInstance = target.instance as CommentCircle;
  commentCircleInstance.transform({
    translate: [x, y],
  });

  if (e.type !== "drawstart") {
    const distance = Math.sqrt(
      (x - commentCircleInstance.getBeforeDragPos().x) ** 2 +
        (y - commentCircleInstance.getBeforeDragPos().y) ** 2
    );
    if (distance >= 1) {
      commentCircleInstance.setMoved(true);
      closeOpenCommentPopups();
    }
  }

  const button = currentTarget.querySelector(".uowl-sat-comment-button");
  const popup = currentTarget.querySelector(
    ".uowl-sat-comment-popup"
  ) as HTMLElement;
  popup.setAttribute("width", "100%");
  const popupRootDiv = popup.children[0] as HTMLElement;
  const popupRootDivStyle = getComputedStyle(popupRootDiv);
  const options = {
    placement: "bottom" as Placement,
  };
  computePosition(button, popupRootDiv, {
    ...options,
    middleware: [offset(-5), shift(), flip()],
  }).then(({ x, y }) => {
    const buttonRect = button.getBoundingClientRect();
    popup.setAttribute(
      "x",
      (x - (buttonRect.x + buttonRect.width / 2)).toString()
    );
    popup.setAttribute(
      "y",
      (y - (buttonRect.y + buttonRect.height / 2)).toString()
    );
    popup.setAttribute("width", popupRootDivStyle.width);
    popup.setAttribute("height", popupRootDivStyle.height);
  });
  // events are still bound e.g. dragend will fire anyway
};

const addDragEvents = (svg: Svg, commentCircle: CommentCircle) => {
  commentCircle.on("beforedrag", (e: CustomEvent) => {
    if (
      e.detail.event.currentTarget
        .querySelector(".uowl-sat-comment-popup")
        .contains(e.detail.event.target)
    ) {
      e.detail.event.stopPropagation();
      e.preventDefault();
      return;
    }
    const mouseEvent = e.detail.event;
    var x, y;
    if (mouseEvent.changedTouches && mouseEvent.changedTouches.length) {
      x = mouseEvent.changedTouches[0].clientX;
      y = mouseEvent.changedTouches[0].clientY;
    } else {
      x = mouseEvent.clientX;
      y = mouseEvent.clientY;
    }
    commentCircle.setBeforeDragPos(x, y);
    commentCircle.setMoved(false);
    svg.fire("beforedrag");
  });
  commentCircle.on("dragstart", (e) => {
    // eslint-disable-next-line no-console
    console.log("dragstart", e);
  });
  commentCircle.on("dragmove", (e) => {
    // eslint-disable-next-line no-console
    console.log("dragmove", e);
  });
  commentCircle.on("dragend", (e) => {
    // eslint-disable-next-line no-console
    console.log("dragend", e);
    svg.fire("dragend", e);
  });
  commentCircle.on("dragmove", repositionPopupWithEvent);
};

extend(Container, {
  commentCircle: function(circleOptions: object, number: number) {
    const thiz = this as ExtendedSvg;
    if (!shadowFilter)
      shadowFilter = thiz.filter(function(add) {
        add.dropShadow(add.$source, 0, 0, 3);
        // this.size("2500%", "2000%").move("-1250%", "-1250%");
        add.node.setAttribute("filterUnits", "userSpaceOnUse");
        /* var blur = add.offset(20, 20).gaussianBlur(5)
      
        add.blend(add.$source, blur)
      
        this.size('200%','200%').move('-50%', '-50%')
        */
      });

    const group = new CommentCircle(number);
    // group.translate(x, y);
    const circle = new Circle({ r: 15 });
    circle.attr(circleOptions);
    circle.addClass("uowl-sat-comment-button");
    circle.filterWith(shadowFilter);
    const radiusAnimation = SVG(
      '<animate attributeName="r" from="14" to="25" dur="1.5s" begin="0s" repeatCount="indefinite"></animate>'
    );

    const opacityAnimation = SVG(
      '<animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite"></animate>'
    );

    const commentDiv = SVG(
      `<foreignObject x="20" y="20" class="uowl-sat-comment-popup">
            <div xmlns="http://www.w3.org/1999/xhtml" >
                <div>
                    <div>
                        <textarea name="comment" class="uowl-sat-comment-textarea" id="comment" placeholder="Enter a comment"></textarea>
                        <div>
                            <div class="uowl-sat-comment-delete"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path></svg><span class="sr-only">Delete attachment</span></div>
                            <div class="uowl-sat-comment-done">Done</div>
                        </div>
                    </div>
                </div>
            </div>
        </foreignObject>`
    );
    const animatedCircle = new Circle({ r: 15 });
    animatedCircle.attr(circleOptions);
    animatedCircle.put(radiusAnimation);
    animatedCircle.put(opacityAnimation);
    // Element.animate;
    // animatedCircle
    //   .animate(1.5)
    //   //   .attr("r", 14)
    //   .attr("r", 25)
    //   .loop()
    //   .active();

    const text = new Text();
    text.plain(number.toString());

    group.setTextElement(text);
    text.css("userSelect", "none");
    text.attr({
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-family": "Inter",
      "font-size": 16,
      fill: "white",
    });
    group.put(animatedCircle);
    group.put(circle);
    group.put(text);
    group.put(commentDiv);
    addDragEvents(this, group);
    group.addClass("uowl-sat-comment-group");
    group.addClass("uowl-sat-comment-group-open");

    group.on("drawstart.self", repositionPopupWithEvent);

    const onClickFN = (e: MouseEvent) => {
      group.front();
      if (!group.isMoved()) {
        if (group.hasClass("uowl-sat-comment-group-open")) {
          group.removeClass("uowl-sat-comment-group-open");
        } else {
          closeOpenCommentPopups();
          group.addClass("uowl-sat-comment-group-open");
          setTimeout(() => {
            const commentTextArea = commentDiv.node.querySelector(
              ".uowl-sat-comment-textarea"
            ) as HTMLElement;
            commentTextArea.focus();
          }, 100);
        }
      }
    };

    circle.click(onClickFN);
    text.click(onClickFN);
    circle.touchend(onClickFN); //svg.js draggable plugin prevents touchstart in dragstart so click event doesnt trigger
    text.touchend(onClickFN);

    commentDiv.node
      .querySelector(".uowl-sat-comment-done")
      .addEventListener("click", onClickFN);

    this.put(group);

    setTimeout(() => {
      const textArea = commentDiv.node.querySelector(
        ".uowl-sat-comment-textarea"
      ) as HTMLElement;
      textArea.focus();
    }, 100);
    group.setInitialized(true);

    return group;
  },
} as ExtendedSvg);
