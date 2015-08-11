// Nodejs path module, allows for access and manipulation of file paths
var path = require('path');
// "Return the directory name of a path. Similar to the Unix dirname command"
// https://nodejs.org/api/path.html#path_path_dirname_p
var dirname = path.dirname;
// "Return the last portion of a path. Similar to the Unix basename command."
// https://nodejs.org/api/path.html#path_path_basename_p_ext
var basename = path.basename;
// "Return the extension of the path, from the last '.' to end of string in the last
// portion of the path. If there is no '.' in the last portion of the path or the
// first character of it is '.', then it returns an empty string"
// https://nodejs.org/api/path.html#path_path_extname_p
var extname = path.extname;
// "Join all arguments together and normalize the resulting path."
// https://nodejs.org/api/path.html#path_path_join_path1_path2
var join = path.join;
// "If to isn't already absolute from arguments are prepended in right to left order,
// until an absolute path is found. If after using all from paths still no absolute
// path is found, the current working directory is used as well. The resulting path is
// normalized, and trailing slashes are removed unless the path gets resolved to the
// root directory. Non-string from arguments are ignored.
// Another way to think of it is as a sequence of cd commands in a shell"
// https://nodejs.org/api/path.html#path_path_resolve_from_to
var resolve = path.resolve;

var debug = require('debug')('express:view');
var fs = require('fs');

module.exports = View;

/**
 * Initialize a new `View` with the given `name`.
 *
 * Options:
 *
 *   - `defaultEngine` the default template engine name
 *   - `engines` template engine require() cache
 *   - `root` root path for view lookup
 *
 * @param {string} name
 * @param {object} options
 * @public
 */

function View(name, options) {
  // Options is an optional second param
  var opts = options || {};
  // Default view engine
  this.defaultEngine = opts.defaultEngine;
  // File extension name (.html, .ejs, ect)
  this.ext = extname(name);
  this.root = opts.root;

  // View engine does not know what type of file to render
  if (!this.ext && !this.defaultEngine) {
    throw new Error('No default engine was specified and no extension was provided.');
  }

  // Why not just use `name`?
  var fileName = name;

  if (!this.ext) {
    // Get extension from default engine name
    // If `defaultEngine` filename does not start with `.`, append a `.`
    this.ext = this.defaultEngine[0] !== '.'
      ? '.' + this.defaultEngine
      : this.defaultEngine;

    fileName += this.ext;
  }

  // If this type of view engine has not already been loaded
  if (!opts.engines[this.ext]) {
    // Load engine
    opts.engines[this.ext] = require(this.ext.substr(1)).__express;
  }

  // Store loaded engine
  // "view engine, the template engine to use. Eg: app.set('view engine', 'jade')"
  // http://expressjs.com/guide/using-template-engines.html
  // Useful - http://expressjs.com/advanced/developing-template-engines.html
  this.engine = opts.engines[this.ext];

  // Look up file path
  this.path = this.lookup(fileName);
};

/**
 * Lookup view by the given `name`
 *
 * @param {string} name
 * @private
 */

View.prototype.lookup = function lookup(name) {
  var path;
  var roots = [].concat(this.root);

  // Replace "%s" with name
  debug('looking up "%s"', name);

  // Search for filepath using set root of directory
  for(var i = 0; i < roots.length & !path; i++) {
    var root = roots[i];

    // Using `path.resolve`
    var loc = resolve(root, name);
    var dir = dirname(loc);
    var file = basename(loc);

    // Using `View.resolve`
    path = this.resolve(dir, file);
  }

  return path;
};

/**
 * Render with the given options.
 *
 * @param {object} options
 * @param {function} callback
 * @private
 */

View.prototype.render = function render(options, callback) {
  debug('render "%s"', this.path);
  // Render file with given options
  this.engine(this.path, options, callback);
};

/**
 * Resolve the file within the given directory.
 *
 * @param {string} dir
 * @param {string} file
 * @private
 */

View.prototype.resolve = function resolve(dir, file) {
  var ext = this.ext;

  // <path>.<ext>
  var path = join(dir, file);
  // Check if file exists in file system in <path>.<ext> form
  var stat = tryStat(path);

  if (stat && stat.isFile()) {
    return path;
  }

  // <path>/index.<ext>
  path = join(dir, basename(file, ext), 'index' + ext);
  // Check if file exists in file system in <path>/index.<ext> form
  stat = tryStat(path);

  if (stat && stat.isFile()) {
    return path;
  }
};

/**
 * Return a stat, maybe.
 *
 * @param {string} path
 * @return {fs.Stats}
 * @private
 */

function tryStat(path) {
  debug('stat "%s"', path);

  try {
    // Check for existence of a given file using its path
    // https://nodejs.org/api/fs.html#fs_class_fs_stats
    return fs.statSync(path);
  } catch (e) {
    return undefined;
  }
};
