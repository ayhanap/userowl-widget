/* eslint-disable no-unused-vars */
import { closeOpenCommentPopups } from "./comment-circle";
import { clearDrawing, deleteLastDrawElement, draww, hasElement } from "./main";

declare global {
  interface Window {
    UserowlSettings: {
      basePath: string;
      appId: string;
    };
  }
}

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

  type WidgetIdToken = {
    access_token: string;
    exp_date: number;
  };

  function getWidgetIdToken(): WidgetIdToken {
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

  function setWidgetIdToken(access_token: string, expires_in: number) {
    const widgetIdTokenName = `userowlWidgetIdToken-${window.UserowlSettings.appId}`;
    var now = new Date();
    now.setSeconds(now.getSeconds() + expires_in);
    const widgetIdToken: WidgetIdToken = {
      access_token,
      exp_date: now.getTime()
    };
    localStorage.setItem(widgetIdTokenName, JSON.stringify(widgetIdToken));
  }

  const createFeedbackButtonIframe = () => {
    const iframe = document.createElement("iframe");

    const iframeStyle = iframe.style;
    // iframeStyle.boxSizing = 'borderBox';
    iframeStyle.position = "static";
    iframeStyle.width = "100%";
    iframeStyle.height = "100%";
    iframeStyle.border = "0";
    iframeStyle.margin = "0";
    iframeStyle.padding = "0";

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
    iframeStyle.border = "0";
    iframeStyle.margin = "0";
    iframeStyle.padding = "0";

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

  let feedbackButtonDiv: HTMLDivElement,
    feedbackButtonIframe: HTMLIFrameElement,
    feedbackFormDiv: HTMLDivElement,
    feedbackFormInnerDiv: HTMLDivElement,
    feedbackFormIframe: HTMLIFrameElement;

  const handleMessage = (evt: MessageEvent) => {
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
      if (evt.data.type === "request-screen-annotate") {
        lockDocumentBody();
        hideWidgetButton();
        feedbackFormDiv.setAttribute("data-is-open", "false");

        const screenAnnotateDiv = createScreenAnnotateToolDiv();
        const userowlAppDiv = document.getElementById("userowl-app");
        userowlAppDiv.appendChild(screenAnnotateDiv);
        draww.addTo("#uowl-sat-canvas");
        draww.on("drawdone.apaydin", e => {
          document
            .querySelector(".uowl-sat-button-bar-undo-button")
            .classList.remove("uowl-sat-button-bar-button-disabled");
        });

        draww.on("beforedrag.apaydin", e => {
          document
            .querySelector(".uowl-sat-button-bar-frame")
            .classList.add("uowl-hidden");
        });
        draww.on("dragend.apaydin", e => {
          document
            .querySelector(".uowl-sat-button-bar-frame")
            .classList.remove("uowl-hidden");
        });

        draww.on("pointerdown.apaydin", e => {
          document
            .querySelector(".uowl-sat-button-bar-frame")
            .classList.add("uowl-hidden");
        });
        draww.on("pointerup.apaydin", e => {
          document
            .querySelector(".uowl-sat-button-bar-frame")
            .classList.remove("uowl-hidden");
        });

        // draww.on("touchstart.apaydin", (e) => {
        //   document
        //     .querySelector(".uowl-sat-button-bar-frame")
        //     .classList.add("uowl-hidden");
        // });
        // draww.on("touchend.apaydin", (e) => {
        //   document
        //     .querySelector(".uowl-sat-button-bar-frame")
        //     .classList.remove("uowl-hidden");
        // });
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

  const hideWidgetButton = () => {
    feedbackButtonIframe.contentWindow.postMessage(
      { aud: "widget", type: "widget-visibility", isVisible: false },
      "*"
    );
  };

  const showWidgetButton = () => {
    feedbackButtonIframe.contentWindow.postMessage(
      { aud: "widget", type: "widget-visibility", isVisible: true },
      "*"
    );
  };

  const createAppDiv = () => {
    const appDiv = document.createElement("div");
    appDiv.classList.add("userowl-app");
    appDiv.id = "userowl-app";
    appDiv.ariaLive = "polite";

    feedbackButtonDiv = createFeedbackButtonDiv();
    feedbackButtonIframe = createFeedbackButtonIframe();

    feedbackButtonDiv.appendChild(feedbackButtonIframe);

    feedbackFormDiv = createFeedbackFormDiv();
    feedbackFormInnerDiv = createFeedbackFormInnerDiv();
    feedbackFormIframe = createFeedbackFormIframe();
    feedbackFormInnerDiv.appendChild(feedbackFormIframe);
    feedbackFormDiv.appendChild(feedbackFormInnerDiv);

    //feedbackButtonIframe.addEventListener('load', () => {
    window.addEventListener("message", evt => handleMessage(evt));
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
      font-size: 16px;
    }
    .userowl-app *,:after,:before {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
      border-color: #e8e6ea;
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
      user-select: none;
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

    .uowl-sat-frame {
      top: 0px;
      left: 0px;
      width: 100%;
      height: 100%;
      position: fixed;
      border: 4px solid #6d33e8;
      z-index: 2147483605;
      box-sizing: border-box;
      pointer-events: none;
    }

    .uowl-sat-button-bar-button svg {
      width: 1.5em;
      height: 1.5em;
    }

    .uowl-sat-close-button {
      top: 0px;
      right: 0px;
      cursor: pointer;
      position: fixed;
      width: 36px;
      height: 36px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #6d33e8;
      z-index: 2147483636;
      border-bottom-left-radius: 4px;
    }

    .uowl-sat-close-button:hover {
      background-color: #5D2CC6;
    }

    .uowl-sat-close-button-icon {
      width: 1em;
      height: 1em;
      stroke: #ffffff;
    }

    .uowl-sat-button-bar-frame{
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      position: fixed;
      z-index: 2147483635;
      width: max-content;
      padding: 0.5em; 
      background-color: #ffffff; 
      border-radius: 0.375em; 
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s;
    }

    .uowl-sat-button-bar{
      display: grid; 
      grid-template-columns: repeat(8, minmax(0, 1fr)) auto; 
      gap: 0.5em; 
    }

    .uowl-sat-button-bar-button{
      cursor: pointer;
      display: flex; 
      padding-top: 0.5em;
      padding-bottom: 0.5em; 
      padding-left: 0.5em;
      padding-right: 0.5em; 
      justify-content: center; 
      align-items: center; 
      border-radius: 0.375em; 
      border-width: 1px; 
    }

    .uowl-sat-button-bar-button-disabled{
      opacity: 0.35;
      cursor: not-allowed;
    }

    .uowl-sat-button-bar-button:not(.uowl-sat-button-bar-button--selected){
      background-color: #ffffff;
      border-color: #E8E6EA; 
      color: #1C0849;
    }

    .uowl-sat-button-bar-button:hover:not(.uowl-sat-button-bar-button-disabled, .uowl-sat-button-bar-button--selected){
      background-color: #F4F3F5;
    }

    .uowl-sat-button-bar-button--selected{
      border-color: transparent; 
      background-color: #6d33e8;
      color: #ffffff;
    }

    .uowl-sat-button-bar-button--selected:hover{
      background-color: #5D2CC6;
    }


    .uowl-sat-button-bar-color-picker{
      position: relative;
      cursor: pointer;
      width: 1.75em;
      height: 1.75em;
      border-radius: 9999px; 
      border-width: 1px; 
      background-color: #3a21ce;
      align-self: center;
      justify-self: center;
    }

    .uowl-sat-button-bar-color-picker[data-open="true"]>.uowl-sat-button-bar-color-picker-popup{
      visibility: visible;
    }

    .uowl-sat-button-bar-color-picker[data-open="false"]>.uowl-sat-button-bar-color-picker-popup{
      visibility: hidden;
    }

    .uowl-sat-button-bar-color-picker-popup{
      top: 45px;
      left: 50%;
      transform: translateX(-50%);
      position: absolute;
      z-index: 2147483635;
      width: max-content;
      padding: 0.5em; 
      background-color: #ffffff; 
      border-radius: 0.375em; 
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    .uowl-sat-button-bar-color-picker-popup>div{
      display: grid; 
      grid-template-columns: repeat(6, minmax(0, 1fr)); 
      gap: 0.5em; 
    }

    .uowl-sat-button-bar-color-picker-popup-button{
      cursor: pointer;
      width: 1.75em;
      height: 1.75em;
      border-radius: 9999px; 
      border-width: 1px; 
      background-color: #ff0000;
      align-self: center;
      justify-self: center;
    }


    .uowl-sat-canvas {
      top: 0px;
      left: 0px;
      width: 100%;
      height: 100%;
      position: fixed;
      z-index: 2147483606;
      box-sizing: border-box;
      cursor: crosshair;
    }

    .uowl-sat-button-bar-next-button-frame{
      display:flex;
      justify-content: center;
      align-items: center;
    }

    .uowl-sat-button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      border-radius: 0.375em;
      padding-top: 0.5em;
      padding-bottom: 0.5em;
      padding-left: 0.75em;
      padding-right: 0.75em;
      font-weight: 600;
      line-height: 1.25em;
      background-color: #6d33e8;
      color: #ffffff;
      cursor: pointer;
      user-select: none;
    }
    .uowl-sat-button:hover {
      background-color: #5D2CC6;
    }


    .uowl-sat-comment-popup{
      width: 400px;
      height: 225px;
      visibility: hidden;
      cursor: auto;
    }

    .uowl-sat-comment-group {
      cursor: pointer;
      user-select: none;
    }

    .uowl-sat-comment-group.uowl-sat-comment-group-open > .uowl-sat-comment-popup {
      visibility: visible;
    }

    .uowl-sat-comment-popup > div {
      padding: 1.25em; 
      width: 100%; 
      height: 100%; 
      cursor: auto; 
    }

    .uowl-sat-comment-popup > div > div {
      background-color: #ffffff; 
      height: 100%; 
      border-radius: 0.375em; 
      box-shadow: 0 0 0 1px #0000000D, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
    }

    .uowl-sat-comment-popup > div > div > div {
      display: flex; 
      padding-left: 0.75em;
      padding-right: 0.75em; 
      padding-top: 1em;
      padding-bottom: 1em; 
      flex-direction: column; 
      height: 100%; 
    }


    .uowl-sat-comment-popup > div > div > div > div {
      display: flex; 
      margin-top: 1.25rem; 
      justify-content: space-between; 
    }

    .uowl-sat-comment-textarea {
      display: block; 
      padding-top: 0.375em;
      padding-bottom: 0.375em; 
      padding-left: 0.75em;
      padding-right: 0.75em; 
      color: #111827; 
      font-size: 0.875em;
      line-height: 1.5em; 
      width: 100%; 
      height: 100%; 
      border-radius: 0.375em; 
      border-width: 0; 
      border-color: #D1D5DB; 
      resize: none; 
      box-shadow: inset 0 0 0 1px #D1D5DB, 0 1px 2px 0 rgba(0, 0, 0, 0.05); 
    }

    .uowl-sat-comment-done {
      display: flex;
      align-items: flex-end;
      width: auto;
      justify-content: center;
      border-radius: 0.375em;
      --tw-bg-opacity: 1;
      background-color: #6d33e8;
      padding-left: 0.75em;
      padding-right: 0.75em;
      margin-left: 0.75em;
      padding-top: 0.5em;
      padding-bottom: 0.5em;
      font-size: 0.875em;
      line-height: 1.25em;
      font-weight: 600;
      color: #ffffff;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
    .uowl-sat-comment-done:hover {
      background-color: #5D2CC6;
    }

    .uowl-sat-comment-done:focus-visible {
      outline-style: solid;
      outline-width: 2px;
      outline-offset: 2px;
      outline-color: #6d33e8;
    }

    .uowl-sat-comment-delete {
      color: #786c89;
    }

    .uowl-sat-comment-delete:hover {
      color: #EF4444;
    }

    .uowl-sat-comment-delete > svg {
      width: 1em; 
      height: 1em; 
    }

    .uowl-sat-comment-textarea:focus {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: inset 0 0 0 2px #6d33e8;
    }


    .uowl-sat-comment-textarea::-moz-placeholder {
      color: #a7a0b1;
    }

    .uowl-sat-comment-textarea::placeholder {
      color: #a7a0b1;
    }

    .uowl-hidden {
      opacity: 0;
      visibility: hidden;
    }

    body.uowl-locked {
      overflow: hidden;
    }

    
    .uowl-draggable-svg:not(.uowl-sat-comment-group) {
      cursor: move; /* fallback if grab cursor is unsupported */
      cursor: grab;
      cursor: -moz-grab;
      cursor: -webkit-grab;
    }
  
    /* (Optional) Apply a "closed-hand" cursor during drag operation. */
    .uowl-draggable-svg:active {
      cursor: grabbing;
      cursor: -moz-grabbing;
      cursor: -webkit-grabbing;
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

      .uowl-sat-button-bar-next-button-frame {
        grid-row-start: 2;
        grid-column: 5 / span 2;
        justify-content: end;
      }
      .uowl-sat-button-bar {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
      .uowl-sat-button-bar-color-picker-popup {
        left: -16px;
        transform: none;
      }
    
    }
    `;

    const css = document.createElement("style");
    css.type = "text/css";

    css.appendChild(document.createTextNode(styles));

    return css;
  };

  const createRectIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    icon.setAttribute("fill", "none");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke", "currentColor");

    const iconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    iconPath.setAttribute("stroke-linecap", "round");
    iconPath.setAttribute("stroke-linejoin", "round");
    iconPath.setAttribute(
      "d",
      "M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"
    );

    icon.appendChild(iconPath);
    return icon;
  };

  const createArrowIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    icon.setAttribute("fill", "none");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke", "currentColor");

    const iconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    iconPath.setAttribute("stroke-linecap", "round");
    iconPath.setAttribute("stroke-linejoin", "round");
    iconPath.setAttribute("d", "M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25");

    icon.appendChild(iconPath);
    return icon;
  };

  const createHighlighIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    icon.setAttribute("viewBox", "-19.2 -19.2 1958.40 1958.40");
    icon.setAttribute("stroke-width", "30");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("fill", "currentColor");

    const iconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    iconPath.setAttribute("stroke-linecap", "round");
    iconPath.setAttribute("stroke-linejoin", "round");
    iconPath.setAttribute(
      "d",
      "M1809.888 1806.674V1920H110v-113.326h1699.888Zm-1332.35-415.453 143.471 95.647-60.29 93.154H326.816l150.724-188.8ZM616.817 921.94l389.954 260.196-32.75 51.45c-15.753 27.085-46.011 41.364-75.25 36.038-72.754-12.92-146.19 18.359-187.667 80.801l-27.991 41.704-138.825-92.7 27.879-41.818c41.59-62.33 42.497-142.564 2.266-204.213-16.205-24.932-14.506-58.476 3.627-82.388l38.757-49.07Zm678.595-803.027L1537.93 280.74c16.092 10.766 20.399 33.318 11.106 49.523L1067.627 1086.6 687.419 832.864l556.77-703.187c12.466-16.66 35.018-21.532 51.223-10.766ZM312.65 1693.348h309.833l123.186-190.727 59.722-89.414c16.433-24.592 45.104-37.398 72.642-32.185 76.495 14.28 154.123-22.098 192.654-88.394l575.242-903.547c40.344-69.696 20.626-158.657-44.99-202.627l-242.744-161.83c-65.616-43.63-155.37-27.764-203.533 35.585L488.53 901.654c-47.71 62.782-51.336 148.683-8.953 213.506 15.3 23.685 14.62 54.963-1.7 79.668l-58.249 87.26-190.16 238.438c-25.84 32.298-30.712 75.475-12.807 112.646 17.906 37.058 54.737 60.176 95.987 60.176Z"
    );

    icon.appendChild(iconPath);
    return icon;
  };

  const createPenIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    icon.setAttribute("fill", "none");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke", "currentColor");

    const iconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    iconPath.setAttribute("stroke-linecap", "round");
    iconPath.setAttribute("stroke-linejoin", "round");
    iconPath.setAttribute(
      "d",
      "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
    );

    icon.appendChild(iconPath);
    return icon;
  };

  const createUndoIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    icon.setAttribute("fill", "none");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke", "currentColor");

    const iconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    iconPath.setAttribute("stroke-linecap", "round");
    iconPath.setAttribute("stroke-linejoin", "round");
    iconPath.setAttribute("d", "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3");

    icon.appendChild(iconPath);
    return icon;
  };

  const createMaskIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    icon.setAttribute("fill", "none");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke", "currentColor");

    const iconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    iconPath.setAttribute("stroke-linecap", "round");
    iconPath.setAttribute("stroke-linejoin", "round");
    iconPath.setAttribute(
      "d",
      "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
    );

    icon.appendChild(iconPath);
    return icon;
  };

  const createCommentIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    icon.setAttribute("fill", "none");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke", "currentColor");

    const iconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    iconPath.setAttribute("stroke-linecap", "round");
    iconPath.setAttribute("stroke-linejoin", "round");
    iconPath.setAttribute(
      "d",
      "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
    );

    icon.appendChild(iconPath);
    return icon;
  };

  const createSATColorPickerButton = (color: string) => {
    const cpButton = document.createElement("div");
    cpButton.classList.add("uowl-sat-button-bar-color-picker-popup-button");
    cpButton.setAttribute("data-color", color);
    cpButton.setAttribute("style", `background-color : ${color}`);
    return cpButton;
  };

  const createSATButtonBarColorPickerPopup = () => {
    const cpPopupFrame = document.createElement("div");
    cpPopupFrame.classList.add("uowl-sat-button-bar-color-picker-popup");

    const cpPopupGrid = document.createElement("div");
    // cpPopupGrid.classList.add("uowl-sat-button-bar");

    const colorPickerSelectOnClick = (ev: MouseEvent | TouchEvent) => {
      const currentTarget = ev.currentTarget as HTMLElement;

      const colorPicker = document.querySelector(
        ".uowl-sat-button-bar-color-picker"
      );

      colorPicker.setAttribute(
        "style",
        `background-color : ${currentTarget.dataset.color}`
      );
      colorPicker.setAttribute("data-color", currentTarget.dataset.color);
    };

    const colors = [
      "#f71108",
      "#f5b108",
      "#17bb84",
      "#1e6be5",
      "#3a21ce",
      "#cccccc"
    ];
    colors
      .map(color => createSATColorPickerButton(color))
      .map(cb => {
        cb.addEventListener("click", colorPickerSelectOnClick);
        return cb;
      })
      .forEach(cb => cpPopupGrid.appendChild(cb));

    cpPopupFrame.appendChild(cpPopupGrid);

    return cpPopupFrame;
  };

  const createSATButtonBarColorPicker = () => {
    const satBBButton = document.createElement("div");
    satBBButton.classList.add("uowl-sat-button-bar-color-picker");
    satBBButton.setAttribute("data-open", "false");
    satBBButton.setAttribute("data-color", "#3a21ce");
    return satBBButton;
  };

  const createSATNextButton = () => {
    const nextButtonParentDiv = document.createElement("div");
    nextButtonParentDiv.classList.add("uowl-sat-button-bar-next-button-frame");

    const nextButton = document.createElement("div");
    nextButton.classList.add("uowl-sat-button");
    const nextButtonSpan = document.createElement("span");
    nextButtonSpan.textContent = "Next";
    nextButton.appendChild(nextButtonSpan);
    nextButton.addEventListener("click", () => {
      unlockDocumentBody();
      closeOpenCommentPopups();
      showWidgetButton();
      feedbackFormDiv.setAttribute("data-is-open", "true");
      document
        .querySelector(".uowl-screen-annotate-tool")
        .setAttribute("style", "visibility: hidden");
      feedbackFormIframe.contentWindow.postMessage(
        {
          aud: "form",
          type: "screen-annotate-result",
          complete: true
        },
        "*"
      );
    });
    nextButtonParentDiv.appendChild(nextButton);
    return nextButtonParentDiv;
  };

  const createSATButtonBarButton = (
    type: "rect" | "arrow" | "highlight" | "pen" | "mask" | "comment" | "undo"
  ) => {
    const satBBButton = document.createElement("div");
    satBBButton.classList.add("uowl-sat-button-bar-button");
    satBBButton.setAttribute("data-type", type);
    return satBBButton;
  };
  const createSATButtonBarFrame = () => {
    const satBBFrame = document.createElement("div");
    satBBFrame.classList.add("uowl-sat-button-bar-frame");

    const satBB = document.createElement("div");
    satBB.classList.add("uowl-sat-button-bar");

    const buttonBarButtonOnClick = (ev: MouseEvent | TouchEvent) => {
      closeOpenCommentPopups();
      document.querySelectorAll(".uowl-sat-button-bar-button").forEach(el => {
        el.classList.remove("uowl-sat-button-bar-button--selected");
      });
      (ev.currentTarget as HTMLElement).classList.add(
        "uowl-sat-button-bar-button--selected"
      );
    };

    const buttonBarUndoOnClick = (ev: MouseEvent | TouchEvent) => {
      closeOpenCommentPopups();
      if (
        !(ev.currentTarget as HTMLElement).classList.contains(
          "uowl-sat-button-bar-button-disabled"
        )
      ) {
        deleteLastDrawElement();
        if (!hasElement()) {
          (ev.currentTarget as HTMLElement).classList.add(
            "uowl-sat-button-bar-button-disabled"
          );
        }
      }
    };

    const colorPickerOnClick = (ev: MouseEvent | TouchEvent) => {
      const currentTarget = ev.currentTarget as HTMLElement;
      closeOpenCommentPopups();
      const isOpen = currentTarget.dataset.open;
      if (isOpen === "false") {
        currentTarget.setAttribute("data-open", "true");
      } else {
        currentTarget.setAttribute("data-open", "false");
      }
    };

    const rectButton = createSATButtonBarButton("rect");
    rectButton.classList.add("uowl-sat-button-bar-button--selected");
    rectButton.appendChild(createRectIcon());
    rectButton.addEventListener("click", buttonBarButtonOnClick);

    const arrowButton = createSATButtonBarButton("arrow");
    arrowButton.appendChild(createArrowIcon());
    arrowButton.addEventListener("click", buttonBarButtonOnClick);

    const highlightButton = createSATButtonBarButton("highlight");
    highlightButton.appendChild(createHighlighIcon());
    highlightButton.addEventListener("click", buttonBarButtonOnClick);

    const penButton = createSATButtonBarButton("pen");
    penButton.appendChild(createPenIcon());
    penButton.addEventListener("click", buttonBarButtonOnClick);

    const maskButton = createSATButtonBarButton("mask");
    maskButton.appendChild(createMaskIcon());
    maskButton.addEventListener("click", buttonBarButtonOnClick);

    const commentButton = createSATButtonBarButton("comment");
    commentButton.appendChild(createCommentIcon());
    commentButton.addEventListener("click", buttonBarButtonOnClick);

    const undoButton = createSATButtonBarButton("undo");
    undoButton.appendChild(createUndoIcon());
    undoButton.classList.add("uowl-sat-button-bar-button-disabled");
    undoButton.classList.add("uowl-sat-button-bar-undo-button");
    undoButton.addEventListener("click", buttonBarUndoOnClick);

    const colorPicker = createSATButtonBarColorPicker();
    colorPicker.appendChild(createSATButtonBarColorPickerPopup());
    colorPicker.addEventListener("click", colorPickerOnClick);

    satBB.appendChild(rectButton);
    satBB.appendChild(arrowButton);
    satBB.appendChild(highlightButton);
    satBB.appendChild(penButton);
    satBB.appendChild(maskButton);
    satBB.appendChild(commentButton);
    satBB.appendChild(colorPicker);
    satBB.appendChild(undoButton);
    satBB.appendChild(createSATNextButton());

    satBBFrame.appendChild(satBB);

    return satBBFrame;
  };

  const satCloseFN = () => {
    unlockDocumentBody();
    closeOpenCommentPopups();
    document
      .querySelectorAll(".uowl-screen-annotate-tool")
      .forEach(el => el.remove());
    clearDrawing();
    showWidgetButton();
    feedbackFormDiv.setAttribute("data-is-open", "true");
    // draww.clear();
    feedbackFormIframe.contentWindow.postMessage(
      {
        aud: "form",
        type: "screen-annotate-result",
        complete: false
      },
      "*"
    );
  };

  const satEscapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      // escape key maps to keycode `27`
      satCloseFN();
    }
  };

  const lockDocumentBody = () => {
    document.body.classList.add("uowl-locked");
  };

  const unlockDocumentBody = () => {
    document.body.classList.remove("uowl-locked");
    document.removeEventListener("keyup", satEscapeHandler);
  };

  const createScreenAnnotateToolDiv = () => {
    const screenAnnotateDiv = document.createElement("div");
    screenAnnotateDiv.classList.add("uowl-screen-annotate-tool");
    screenAnnotateDiv.ariaLive = "assertive";

    const satFrame = document.createElement("div");
    satFrame.classList.add("uowl-sat-frame");

    const satCanvas = document.createElement("div");
    satCanvas.id = "uowl-sat-canvas";
    satCanvas.classList.add("uowl-sat-canvas");
    document.addEventListener("keyup", satEscapeHandler);

    const satCloseButton = document.createElement("div");
    satCloseButton.classList.add("uowl-sat-close-button");
    satCloseButton.addEventListener("click", satCloseFN);

    const satCloseButtonIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    satCloseButtonIcon.classList.add("uowl-sat-close-button-icon");

    satCloseButtonIcon.setAttribute("fill", "none");
    satCloseButtonIcon.setAttribute("viewBox", "0 0 24 24");
    satCloseButtonIcon.setAttribute("stroke-width", "3");
    satCloseButtonIcon.setAttribute("stroke", "currentColor");

    const satCloseButtonIconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    satCloseButtonIconPath.setAttribute("stroke-linecap", "round");
    satCloseButtonIconPath.setAttribute("stroke-linejoin", "round");
    satCloseButtonIconPath.setAttribute("d", "M6 18L18 6M6 6l12 12");

    satCloseButtonIcon.appendChild(satCloseButtonIconPath);
    satCloseButton.appendChild(satCloseButtonIcon);

    screenAnnotateDiv.appendChild(satFrame);
    screenAnnotateDiv.appendChild(satCanvas);
    screenAnnotateDiv.appendChild(satCloseButton);
    screenAnnotateDiv.appendChild(createSATButtonBarFrame());

    return screenAnnotateDiv;
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
    // @ts-ignore
    const cloneDoc: HTMLElement = document.documentElement.cloneNode(true);
    clearDrawing();
    document
      .querySelectorAll(".uowl-screen-annotate-tool")
      .forEach(el => el.remove());

    Array.from(cloneDoc.querySelectorAll("script, noscript")).forEach(el =>
      el.remove()
    );

    const screenAnnotateTool = cloneDoc.querySelector(
      ".uowl-screen-annotate-tool"
    );

    let commentMap: { number: number; value: string }[];

    if (screenAnnotateTool) {
      screenAnnotateTool.setAttribute("style", "visibility: visible");
      commentMap = Array.from(
        screenAnnotateTool.querySelectorAll(".uowl-sat-comment-group")
      )
        .map(el => el as HTMLElement)
        .map(commentGroupEl => {
          const number = +commentGroupEl.dataset.number;
          const value = (commentGroupEl.querySelector(
            ".uowl-sat-comment-textarea"
          ) as HTMLTextAreaElement).value;
          return {
            number,
            value
          };
        });
    }

    cloneDoc
      .querySelectorAll(
        ".userowl-feedback-form, .userowl-feedback-button, .uowl-screen-annotate-tool>:not(.uowl-sat-canvas)"
      )
      .forEach(el => el.remove());

    // cloneDoc
    // .querySelectorAll(
    //   ".uowl-sat-comment-group"
    // ).map((el) => {
    //   const number = el.g
    // })

    const styleText = Array.from(cloneDoc.querySelectorAll("style"))
      .filter(styleElement => styleElement.innerText === "")
      .map(styleElement => {
        const rules: string[] = [];

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
      commentMap: commentMap,
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
