import { getFeedbackFormIframe, getWidgetIframe } from "@/js/widget";

type AnyFunction = (...args: any[]) => any;

export const safeFNCall = <Func extends AnyFunction>(
  fn: Func
): ((...args: Parameters<Func>) => ReturnType<Func>) => {
  const wrappedFn = (...args: Parameters<Func>): ReturnType<Func> => {
    if (
      !getWidgetIframe().contentWindow ||
      !getFeedbackFormIframe().contentWindow
    ) {
      window.UserowlInternalQueue.push({ c: fn, a: args });
      return;
    }
    return fn(...args);
  };
  return wrappedFn;
};
