import { CommentCircle } from "@/src/js/comment-circle";
import { Svg } from "@svgdotjs/svg.js";
import { Arrow } from "@userowl/svg.draw.js";

export class ExtendedSvg extends Svg {
  commentCircle: (circleOptions: object, number: number) => CommentCircle;
  arrow: () => Arrow;
}
