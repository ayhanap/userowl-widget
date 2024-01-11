import { getWidgetIframe } from "@/js/widget";
import { type User } from 'userowl';

export const identify = (user: User, hash?: string) => {
  user.identified = true;
  getWidgetIframe().contentWindow.postMessage({
    aud: "widget",
    type: "identify-user",
    user: user,
    hash: hash,
  });
};

export const clearUser = () => {
  getWidgetIframe().contentWindow.postMessage({
    aud: "widget",
    type: "clear-user",
  });
};
