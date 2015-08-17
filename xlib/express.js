var proto = require('./application');
// merge(destination, source)
// Redefines destination's descriptors with source's.
// merge(destination, source, false)
// Defines source's descriptors on destination if destination does not have a descriptor by the same name.
// From API docs - https://github.com/component/merge-descriptors
var mixin = require('merge-descriptors');

exports = module.exports = createApplication;

function createApplication() {
  var app = function(req, res, next) {
    app.handle(req, res, next);
  };

  mixin(app, proto, false);
};
