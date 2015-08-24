var debug = require('debug')('Express:application');
var compileETag = require('./utils').compileETag;

// A module encapsulates related code into a single unit of code
var app = exports = module.exports = {};

// Proxy is an agent or substitute authorized to act for another person or a document which authorizes the agent so to act
// TODO: wtf does this actually do?
var trustProxyDefaultSymbol = '@@symbol:trust_proxy_default';


/**
 * Initialize the server.
 *
 *   - setup default configuration
 *   - setup default middleware
 *   - setup route reflection methods
 *
 * http://usejsdoc.org/tags-private.html
 * @private
 */

app.init = function init() {
  this.cache = {};
  this.engines = {};
  this.settings = {};

  this.defaultConfiguration();
};

/**
 * Initialize application configuration.
 * @private
 */

app.defaultConfiguration = function defaultConfiguration() {
  var env = process.env.NODE_ENV || 'development';

  // Specifies the technology (e.g. ASP.NET, PHP, JBoss) supporting the web application
  this.enable('x-powered-by');
  /*
  https://en.wikipedia.org/wiki/HTTP_ETag
  It is one of several mechanisms that HTTP provides for web cache validation, and which allows a
  client to make conditional requests. This allows caches to be more efficient, and saves bandwidth,
  as a web server does not need to send a full response if the content has not changed. ETags can
  also be used for optimistic concurrency control (multiple transactions can frequently complete
  without interfering with each other),[1] as a way to help prevent simultaneous updates of a
  resource from overwriting each other.
  An ETag is an opaque identifier assigned by a web server to a specific version of a resource found at
  a URL. If the resource representation at that URL ever changes, a new and different ETag is assigned.
  Used in this manner ETags are similar to fingerprints, and they can be quickly compared to determine
  whether two representations of a resource are the same.
  */
  /*
  https://en.wikipedia.org/wiki/HTTP_ETag#Strong_and_weak_validation
  "A weakly validating ETag match only indicates that the two representations are semantically equivalent,
  meaning that for practical purposes they are interchangeable and that cached copies can be used. However
  the resource representations are not necessarily byte-for-byte identical, and thus weak ETags are not
  suitable for byte-range requests. Weak ETags may be useful for cases in which strong ETags are impractical
  for a web server to generate, such as with dynamically-generated content."
  */
  this.set('etag', 'weak');
  this.set('env', env);
  // by default supports nesting and arrays, with a depth limit
  this.set('query parser', 'extended');
  // sets the req.subdomain property
  // "The number of dot-separated parts of the host to remove to access subdomain."
  // http://expressjs.com/api.html
  // "A subdomain is a domain that is part of a larger domain; the only domain that is not also a subdomain
  // is the root domain.[1] For example, west.example.com and east.example.com are subdomains of the
  // example.com domain, which in turn is a subdomain of the com top-level domain (TLD). A "subdomain"
  // expresses relative dependence, not absolute dependence: for example, wikipedia.org comprises a
  // subdomain of the org domain, and en.wikipedia.org comprises a subdomain of the domain wikipedia.org."
  // https://en.wikipedia.org/wiki/Subdomain
  this.set('subdomain offset', 2);
  // a server (a computer system or an application) that acts as an intermediary for requests
  // from clients seeking resources from other servers
  // Docs: http://expressjs.com/api.html#trust.proxy.options.table
  this.set('trust proxy', false);
};

/**
 * Assign `setting` to `val`, or return `setting`'s value.
 *
 *    app.set('foo', 'bar');
 *    app.get('foo');
 *    // => "bar"
 *
 * Mounted servers inherit their parent server's settings.
 *
 * @param {String} setting
 * @param {*} [val]
 * @return {Server} for chaining
 * @public
 */

app.set = function set(setting, val) {
  // If there is no value being assigned to the property, return the value currently assigned to that property
  if (arguments.length === 1) {
    // app.get(setting)
    return this.settings[setting];
  }

  debug('set "%s" to %o', setting, val);

  // set value
  this.settings[setting] = val;

  // trigger matched settings
  // for special settings that need extra care
  switch (setting) {
    case 'etag':
      this.set('etag fn', compileETag(val));
      break;
    case 'query parser':
      this.set('query parser fn', compileQueryParser(val));
      break;
    case 'trust proxy':
      this.set('trust proxy fn', compileTrust(val));

      // trust proxy inherit back-compat
      Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
        configurable: true,
        value: false
      });

      break;
  }

  return this;

};


