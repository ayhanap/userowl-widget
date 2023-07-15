import {
  ErrorStackParser,
  StackFrame,
} from "@/js/console-proxy/error-stack-parser";
import { stringify } from "@/js/console-proxy/stringfy";

type UserowlLog = {
  time: string;
  level: "log" | "warn" | "error" | "debug" | "info";
  payload: string[];
  trace?: StackFrame[];
};

export type UserowlConsole = {
  defaultLoggers: {
    log: Console["log"];
    warn: Console["warn"];
    error: Console["error"];
    debug: Console["debug"];
    info: Console["info"];
  };
  logs: Array<UserowlLog>;
};

export const getConsoleLogs: () => UserowlLog[] = () => {
  return window.Userowl.console.logs;
};

export const bindConsoleLogProxy = (): Array<() => void> => {
  if (window.Userowl.console) return [];

  window.Userowl.console = {
    defaultLoggers: {
      log: undefined,
      warn: undefined,
      debug: undefined,
      error: undefined,
      info: undefined,
    },
    logs: [],
  };
  const cancelHandlers: Array<() => void> = [];

  window.Userowl.console.defaultLoggers.log = console.log.bind(console);
  console.log = function() {
    const payload = Array.from(arguments).map((s) => stringify(s));
    window.Userowl.console.defaultLoggers.log.apply(console, arguments);
    window.Userowl.console.logs.push({
      time: new Date().toISOString(),
      level: "log",
      payload,
    });
  };

  window.Userowl.console.defaultLoggers.error = console.error.bind(console);
  console.error = function() {
    const payload = Array.from(arguments).map((s) => stringify(s));
    window.Userowl.console.defaultLoggers.error.apply(console, arguments);
    window.Userowl.console.logs.push({
      time: new Date().toISOString(),
      level: "error",
      payload,
    });
  };

  const errorHandler = (event: ErrorEvent) => {
    const message = event.message,
      error = event.error as Error;
    const trace: StackFrame[] = ErrorStackParser.parse(error);
    const payload = [stringify(message, undefined)];
    window.Userowl.console.logs.push({
      time: new Date().toISOString(),
      level: "error",
      payload,
      trace,
    });
  };
  window.addEventListener("error", errorHandler);
  cancelHandlers.push(() => {
    window.removeEventListener("error", errorHandler);
  });

  const unhandledrejectionHandler = (event: PromiseRejectionEvent) => {
    let error: Error;
    let payload: string[];
    if (event.reason instanceof Error) {
      error = event.reason;
      payload = [
        stringify(`Uncaught (in promise) ${error.name}: ${error.message}`),
      ];
    } else {
      error = new Error();
      payload = [stringify("Uncaught (in promise)"), stringify(event.reason)];
    }
    const trace: StackFrame[] = ErrorStackParser.parse(error);
    //.map((stackFrame: StackFrame) => stackFrame.toString());
    window.Userowl.console.logs.push({
      time: new Date().toISOString(),
      level: "error",
      payload,
      trace,
    });
  };
  window.addEventListener("unhandledrejection", unhandledrejectionHandler);
  cancelHandlers.push(() => {
    window.removeEventListener("unhandledrejection", unhandledrejectionHandler);
  });

  window.Userowl.console.defaultLoggers.warn = console.warn.bind(console);
  console.warn = function() {
    const payload = Array.from(arguments).map((s) => stringify(s));
    window.Userowl.console.defaultLoggers.warn.apply(console, arguments);
    window.Userowl.console.logs.push({
      time: new Date().toISOString(),
      level: "warn",
      payload,
    });
  };

  window.Userowl.console.defaultLoggers.info = console.info.bind(console);
  console.info = function() {
    const payload = Array.from(arguments).map((s) => stringify(s));
    window.Userowl.console.defaultLoggers.info.apply(console, arguments);
    window.Userowl.console.logs.push({
      time: new Date().toISOString(),
      level: "info",
      payload,
    });
  };

  window.Userowl.console.defaultLoggers.debug = console.debug.bind(console);
  console.debug = function() {
    // default &  console.log()
    window.Userowl.console.defaultLoggers.debug.apply(console, arguments);
    // new & array data
    window.Userowl.console.logs.push({
      time: new Date().toISOString(),
      level: "debug",
      payload: Array.from(arguments),
    });
  };

  cancelHandlers.push(() => {
    Object.entries(window.Userowl.console.defaultLoggers)
      .filter(([key, value]) => value !== undefined)
      .forEach(([key, value]) => {
        // @ts-ignore
        console[key] = value;
      });
  });

  return cancelHandlers;
};
