(function() {
  // const script = document.currentScript;

  var basePath = "https://app.userowl.com";
  if (window.UserowlSettings && window.UserowlSettings.basePath) {
    basePath = window.UserowlSettings.basePath;
  }

  async function getWidgetToken() {
    const widgetTokenName = `userowlWidgetToken-${window.UserowlSettings.appId}`;
    const widgetTokenInLocalStorage = localStorage.getItem(widgetTokenName);
    if (widgetTokenInLocalStorage) {
      const widgetToken = JSON.parse(widgetTokenInLocalStorage);
      const exp_date = new Date(widgetToken.exp_date);
      if (exp_date > new Date()) {
        return widgetToken.access_token;
      }
    }
    const widgetToken = await (
      await fetch(
        `${basePath}/projects/${window.UserowlSettings.appId}/widgetToken`
      )
    ).json();
    var now = new Date();
    now.setSeconds(now.getSeconds() + widgetToken.expires_in);
    widgetToken.exp_date = now.getTime();
    widgetToken.expires_in = undefined;
    localStorage.setItem(widgetTokenName, JSON.stringify(widgetToken));
    return widgetToken.access_token;
  }

  function getWidgetIdToken() {
    const widgetIdTokenName = `userowlWidgetIdToken-${window.UserowlSettings.appId}`;
    const widgetIdTokenInLocalStorage = localStorage.getItem(widgetIdTokenName);
    if (widgetIdTokenInLocalStorage) {
      const widgetIdToken = JSON.parse(widgetIdTokenInLocalStorage);
      const exp_date = new Date(widgetIdToken.exp_date);
      if (exp_date > new Date()) {
        return widgetIdToken.access_token;
      }
    }
    return undefined;
  }

  function setWidgetIdToken(access_token, expires_in) {
    const widgetIdTokenName = `userowlWidgetIdToken-${window.UserowlSettings.appId}`;
    var now = new Date();
    now.setSeconds(now.getSeconds() + expires_in);
    const widgetIdToken = {};
    widgetIdToken.access_token = access_token;
    widgetIdToken.exp_date = now.getTime();
    localStorage.setItem(widgetIdTokenName, JSON.stringify(widgetIdToken));
  }

  const createFeedbackButtonIframe = () => {
    const iframe = document.createElement("iframe");

    const iframeStyle = iframe.style;
    // iframeStyle.boxSizing = 'borderBox';
    iframeStyle.position = "static";
    iframeStyle.width = "100%";
    iframeStyle.height = "100%";
    iframeStyle.border = 0;
    iframeStyle.margin = 0;
    iframeStyle.padding = 0;

    const widgetUrl = `${basePath}/projects/${window.UserowlSettings.appId}/widget`;

    iframe.src = widgetUrl;
    return iframe;
  };

  const createFeedbackButtonDiv = () => {
    const feedbackButton = document.createElement("div");
    feedbackButton.classList.add("userowl-feedback-button");
    return feedbackButton;
  };

  const createFeedbackFormIframe = () => {
    const iframe = document.createElement("iframe");

    const iframeStyle = iframe.style;
    // iframeStyle.boxSizing = 'borderBox';
    iframeStyle.position = "static";
    iframeStyle.width = "100%";
    iframeStyle.height = "100%";
    iframeStyle.border = 0;
    iframeStyle.margin = 0;
    iframeStyle.padding = 0;

    const formUrl = `${basePath}/projects/${window.UserowlSettings.appId}/widgetForm`;

    iframe.src = formUrl;
    return iframe;
  };

  const createFeedbackFormDiv = () => {
    const feedbackForm = document.createElement("div");
    feedbackForm.classList.add("userowl-feedback-form");
    feedbackForm.setAttribute("data-is-open", "false");
    return feedbackForm;
  };

  const createFeedbackFormInnerDiv = () => {
    const feedbackFormInner = document.createElement("div");
    feedbackFormInner.classList.add("userowl-feedback-form-inner");
    return feedbackFormInner;
  };

  let isFormReady = false;
  let isWidgetReady = false;

  const handleMessage = (
    evt,
    feedbackButtonDiv,
    feedbackButtonIframe,
    feedbackFormDiv,
    feedbackFormIframe
  ) => {
    if ("aud" in evt.data && evt.data.aud === "parent" && "type" in evt.data) {
      if (evt.data.type === "css-variables") {
        const styleTag = document.getElementById("userowl-app-style-vars");
        var styles = `
${evt.data.cssVariables}
`;
        styleTag.innerHTML = "";

        styleTag.appendChild(document.createTextNode(styles));
      }
      if (evt.data.type === "form-ready") {
        isFormReady = true;
      }
      if (evt.data.type === "widget-ready") {
        isWidgetReady = true;
        getWidgetToken().then(widgetToken =>
          feedbackButtonIframe.contentWindow.postMessage(
            { aud: "widget", type: "widget-token", widgetToken: widgetToken },
            "*"
          )
        );
      }
      if (evt.data.type === "form-open") {
        if (evt.data.isOpen) {
          feedbackFormDiv.setAttribute("data-is-open", "true");
        } else {
          feedbackFormDiv.setAttribute("data-is-open", "false");
        }
      }
      if (evt.data.type === "widget-id-token") {
        setWidgetIdToken(evt.data.access_token, evt.data.expires_in);
      }
      if (evt.data.type === "request-screenshot") {
        const screenshotData = takeScreenshot();
        feedbackFormIframe.contentWindow.postMessage(
          {
            aud: "form",
            type: "screenshot-result",
            screenshot: screenshotData
          },
          "*"
        );
      }
      if (evt.data.type === "request-session-info") {
        const sessionInfo = getSessionInfo();
        feedbackFormIframe.contentWindow.postMessage(
          {
            aud: "form",
            type: "session-info-result",
            sessionInfo: sessionInfo
          },
          "*"
        );
      }
    }
    if ("aud" in evt.data && evt.data.aud === "widget" && "type" in evt.data) {
      if (evt.data.type === "form-variables") {
        isFormReady = true;
        evt.data.aud = "widget";
        feedbackButtonIframe.contentWindow.postMessage(evt.data, "*");
      } else {
        evt.data.aud = "widget";
        feedbackButtonIframe.contentWindow.postMessage(evt.data, "*");
      }
    }
  };

  const createAppDiv = () => {
    const appDiv = document.createElement("div");
    appDiv.classList.add("userowl-app");
    appDiv.ariaLive = "polite";

    const feedbackButtonDiv = createFeedbackButtonDiv();
    const feedbackButtonIframe = createFeedbackButtonIframe();

    feedbackButtonDiv.appendChild(feedbackButtonIframe);

    const feedbackFormDiv = createFeedbackFormDiv();
    const feedbackFormInnerDiv = createFeedbackFormInnerDiv();
    const feedbackFormIframe = createFeedbackFormIframe();
    feedbackFormInnerDiv.appendChild(feedbackFormIframe);
    feedbackFormDiv.appendChild(feedbackFormInnerDiv);

    //feedbackButtonIframe.addEventListener('load', () => {
    window.addEventListener("message", evt =>
      handleMessage(
        evt,
        feedbackButtonDiv,
        feedbackButtonIframe,
        feedbackFormDiv,
        feedbackFormIframe
      )
    );
    // });

    feedbackButtonIframe.addEventListener("load", () => {
      const fun = () => {
        if (!isWidgetReady) {
          feedbackButtonIframe.contentWindow.postMessage(
            {
              aud: "widget",
              type: "parent-listening",
              widgetIdToken: getWidgetIdToken()
            },
            "*"
          );
          window.setTimeout(fun, 500);
        }
      };
      fun();
    });

    feedbackFormIframe.addEventListener("load", () => {
      const fun = () => {
        if (!isFormReady) {
          feedbackFormIframe.contentWindow.postMessage(
            {
              aud: "form",
              type: "parent-listening",
              widgetIdToken: getWidgetIdToken()
            },
            "*"
          );
          window.setTimeout(fun, 500);
        }
      };
      fun();
    });

    appDiv.appendChild(feedbackFormDiv);
    appDiv.appendChild(feedbackButtonDiv);
    return appDiv;
  };

  const createVariableStyleTag = () => {
    var styles = `
    .userowl-app {
     
    }
    `;

    const css = document.createElement("style");
    css.type = "text/css";
    css.id = "userowl-app-style-vars";

    css.appendChild(document.createTextNode(styles));

    return css;
  };

  const createStyleTag = () => {
    var styles = `
    .userowl-app {
      position: fixed;
      z-index: 2147483601;
      width: 0;
      height: 0;
      --uowl-widget-button-width: 100%;
      --uowl-widget-button-height: 100%;
      --uowl-widget-button-transform: scale(0);
      --uowl-widget-form-width: 1000px;
      --uowl-widget-form-height: 1000px;
      --uowl-widget-form-top-plus-bottom: 0px;
    }
    .userowl-feedback-button {
      position: fixed;
      z-index: 2147483615;
      width: var(--uowl-widget-button-width);
      height: var(--uowl-widget-button-height);
      top: var(--uowl-widget-button-top);
      left: var(--uowl-widget-button-left);
      bottom: var(--uowl-widget-button-bottom);
      right: var(--uowl-widget-button-right);
      transform: var(--uowl-widget-button-transform);
    }
    .userowl-feedback-form {
      position: fixed;
      z-index: 2147483625;
      width: min(var(--uowl-widget-form-width), 100%);
      height: min(max(var(--uowl-widget-form-height), calc(100% - var(--uowl-widget-form-top-plus-bottom))), calc(100% - var(--uowl-widget-form-top-plus-bottom)));
      min-height: var(--uowl-widget-form-min-height);
      max-height: var(--uowl-widget-form-height);
      top: var(--uowl-widget-form-top);
      left: var(--uowl-widget-form-left);
      bottom: var(--uowl-widget-form-bottom);
      right: var(--uowl-widget-form-right);
      transform: var(--uowl-widget-form-transform) scale(1);
      padding-top: var(--uowl-widget-form-padding-top);
      padding-bottom: var(--uowl-widget-form-padding-bottom);
      transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
      transition-property: opacity, transform, z-index;
      transition-delay: 0s, 0s, 0.3s;
      transition-duration: 0s, 0s, 0s;

      opacity: 1;
    }
    .userowl-feedback-form-inner {
      width: 100%;
      height: 100%;
      box-shadow: 0px 10px 50px 0px rgba(0, 0, 0, 0.25);
      border-radius: var(--uowl-widget-form-border-radius);
      overflow: hidden;

      animation-duration: 0.3s;
      animation-fill-mode: both;
      animation-name: var(--uowl-widget-form-appear-anim);
      animation-timing-function: ease-out;

      opacity: 1;
      transform: scale(1);

    }
    .userowl-feedback-form[data-is-open="false"] {
      opacity: 0;
      transform: scale(0);
      transition-duration: 0s, 0s, 0s;
      transition-delay: 0.3s, 0.3s, 0s;
      pointer-events: none;
      z-index: 2147483614;
    }
    .userowl-feedback-form[data-is-open="false"] > .userowl-feedback-form-inner {
      #opacity: 0;
      #transform: scale(0);
      #animation-direction: reverse;
      animation-name: var(--uowl-widget-form-hide-anim);
    }
    
    @keyframes uowlAppearMinusY {
      from {
          transform: translate3d(0, 120%, 0px) scale(0);
          opacity: 0;
      }
      to {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
    }

    @keyframes uowlHidePlusY {
      from {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
      to {
          transform: translate3d(0, 120%, 0) scale(0);
          opacity: 0;
      }
    }

    @keyframes uowlAppearPlusY {
      from {
          transform: translate3d(0, -120%, 0px) scale(0);
          opacity: 0;
      }
      to {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
    }

    @keyframes uowlHideMinusY {
      from {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
      to {
          transform: translate3d(0, -120%, 0) scale(0);
          opacity: 0;
      }
    }

    @keyframes uowlAppearPlusX {
      from {
          transform: translate3d(-120%, 0, 0px) scale(0);
          opacity: 0;
      }
      to {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
    }

    @keyframes uowlHideMinusX {
      from {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
      to {
          transform: translate3d(-120%, 0, 0) scale(0);
          opacity: 0;
      }
    }

    
    @keyframes uowlAppearMinusX {
      from {
          transform: translate3d(120%, 0, 0px) scale(0);
          opacity: 0;
      }
      to {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
    }

    @keyframes uowlHidePlusX {
      from {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 1;
      }
      to {
          transform: translate3d(120%, 0, 0) scale(0);
          opacity: 0;
      }
    }

    @keyframes uowlFadeIn {
      from {
          opacity: 0;
      }
      to {
          opacity: 1;
      }
    }

    @keyframes uowlFadeOut {
      from {
        opacity: 1;
      }
      to {
          opacity: 0;
      }
    }


    @media (max-width: 640px) {
      
      .userowl-feedback-form {
        position: fixed;
        width: 100%;
        top: auto;
        left: 0;
        bottom: 0;
        right: 0;
        padding: 0;
        transform: none;
      }

      .userowl-feedback-form-inner {
        box-shadow: 0px 0px 50px 0px rgba(0, 0, 0, 0.25);
        border-radius: 0;

        animation-name: uowlAppearMinusY;
      }

      .userowl-feedback-form[data-is-open="false"] > .userowl-feedback-form-inner {
        animation-name: uowlHidePlusY;
      }
    
    }
    `;

    const css = document.createElement("style");
    css.type = "text/css";

    if (css.styleSheet) css.styleSheet.cssText = styles;
    else css.appendChild(document.createTextNode(styles));

    return css;
  };

  const loadWidget = () => {
    const userowlContainer = document.createElement("div");
    userowlContainer.classList.add("userowl-container");

    const containerStyle = userowlContainer.style;
    // containerStyle.display = 'none';
    // widgetStyle.boxSizing = 'border-box';
    containerStyle.width = "auto";
    containerStyle.height = "auto";
    // widgetStyle.top = '40px';
    // widgetStyle.right = '40px';

    // iframeStyle.width = '500px';

    const style = createStyleTag();

    userowlContainer.appendChild(style);
    userowlContainer.appendChild(createVariableStyleTag());

    userowlContainer.appendChild(createAppDiv());
    // const greeting = script.getAttribute("data-greeting");

    document.body.appendChild(userowlContainer);
  };

  const takeScreenshot = () => {
    const cloneDoc = document.documentElement.cloneNode(true);

    Array.from(cloneDoc.querySelectorAll("script", "noscript")).forEach(el =>
      el.remove()
    );

    Array.from(
      cloneDoc.getElementsByClassName("userowl-container")
    ).forEach(el => el.remove());

    const styleText = Array.from(cloneDoc.querySelectorAll("style"))
      .filter(styleElement => styleElement.innerText === "")
      .map(styleElement => {
        const rules = [];

        [...styleElement.sheet.cssRules].forEach(cssRule => {
          rules.push(cssRule.cssText);
        });

        return rules.join("\n");
      })
      .join("\n");

    const styleEl = document.createElement("style");
    styleEl.appendChild(document.createTextNode(styleText));

    var doctypeNode = document.doctype;
    var docType =
      "<!DOCTYPE " +
      doctypeNode.name +
      (doctypeNode.publicId ? ' PUBLIC "' + doctypeNode.publicId + '"' : "") +
      (!doctypeNode.publicId && doctypeNode.systemId ? " SYSTEM" : "") +
      (doctypeNode.systemId ? ' "' + doctypeNode.systemId + '"' : "") +
      ">";

    const currentBase = cloneDoc.querySelector("base");
    let currentBaseHref, baseUrl;
    let windowHref = window.location.href.substring(
      0,
      window.location.href.lastIndexOf("/")
    );

    if (currentBase) {
      currentBaseHref = currentBase.href;
      currentBase.remove();
    }

    if (currentBaseHref) {
      if (currentBaseHref.startsWith("http")) {
        baseUrl = currentBaseHref;
      } else {
        baseUrl = windowHref + currentBaseHref;
      }
    } else {
      baseUrl = windowHref;
    }
    if (!baseUrl.endsWith("/")) {
      baseUrl += "/";
    }
    const baseEl = document.createElement("base");
    baseEl.href = baseUrl;

    const head = cloneDoc.querySelector("head");
    head.insertBefore(styleEl, head.firstChild);
    head.insertBefore(baseEl, head.firstChild);
    let htmlString = "";
    htmlString += docType + "\n";
    // const childNodes = cloneDoc.childNodes;
    // for (var i = 0; i < childNodes.length; i++) {
    //   htmlString += childNodes[i].outerHTML;
    // }
    htmlString += cloneDoc.outerHTML;
    return {
      html: htmlString,
      windowSize: {
        x: window.innerWidth,
        y: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio,
      deviceType: "desktop"
    };
  };

  const getSessionInfo = () => {
    return {
      url: window.location.href,
      sessionInfo: {
        userAgent: navigator.userAgent,
        windowPosition: {
          x: window.screenLeft,
          y: window.screenTop
        },
        windowSize: {
          x: window.innerWidth,
          y: window.innerHeight
        },
        screenResolution: {
          x: window.screen.width,
          y: window.screen.height
        },
        colorDepth: window.screen.colorDepth,
        devicePixelRatio: window.devicePixelRatio
      }
    };
  };

  if (document.readyState === "complete") {
    loadWidget();
  } else {
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "complete") {
        loadWidget();
      }
    });
  }
})();
