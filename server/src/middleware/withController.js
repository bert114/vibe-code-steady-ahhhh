// Attach a stable controller label to errors that reach the central handler.
export function withController(name, handler) {
  return function controllerWithContext(req, res, next) {
    req.errorContext = {
      ...req.errorContext,
      controller: name,
    };
    return handler(req, res, next);
  };
}
