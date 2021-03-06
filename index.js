'use strict';

var head = document.head || document.getElementsByTagName('head')[0];

var extend = Object.assign;

function isObject(value) {
  return typeof value === 'object' && value !== null;
}
function isFunction(value) {
  return typeof value === 'function';
}
function isRegExp(value) {
  return isset(value) && value instanceof RegExp;
}
if (!Array.isArray) {
  var op2str = Object.prototype.toString;
  Array.isArray = function(a) {
    return op2str.call(a) === '[object Array]';
  };
}
function isArray(value) {
  return Array.isArray(value);//return isset(value) && value instanceof Array;
}
function isset(value) {
  return value !== undefined;
}
function result(object, key) {
  if (isObject(object)) {
    var value = object[key];
    return isFunction(value) ? object[key]() : value;
  }
}
function inherits(protoProps, staticProps) {
  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var _parent = this;
  var child;
  // The constructor function for the new subclass is either defined by you
  // (the 'constructor' property in your `extend` definition), or defaulted
  // by us to simply call the parent's constructor.
  if (isset(protoProps) && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function () {
      return _parent.apply(this, arguments);
    };
  }

  // Add static properties to the constructor function, if supplied.
  extend(child, _parent, staticProps);
  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  var Surrogate = function () {
    this.constructor = child;
  };
  Surrogate.prototype = _parent.prototype;
  child.prototype = new Surrogate();

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (isset(protoProps)) {
    extend(child.prototype, protoProps);
  }

  // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = _parent.prototype;

  return child;
}
function keys(o) {
  if (isObject(o)) {
    return Object.keys(o) || [];
  }
  return [];
}

function isFunction$1(value) {
  return typeof value === 'function';
}
if (!Array.isArray) {
  var op2str$1 = Object.prototype.toString;
  Array.isArray = function(a) {
    return op2str$1.call(a) === '[object Array]';
  };
}

var slice = Array.prototype.slice;
var Events = {
  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on: function (name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
      return this;
    }
    if (!this._events) {
      this._events = {};
    }
    var events = this._events[name] || (this._events[name] = []);
    events.push({
      callback: callback,
      context: context,
      ctx: context || this
    });
    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function (name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) {
      return this;
    }
    var self = this;
    var _once = once(function () {
      self.off(name, _once);
      callback.apply(this, arguments);
    });
    _once._callback = callback;
    return this.on(name, _once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function (name, callback, context) {
    var retain, ev, events, names, i, l, j, k;
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) {
      return this;
    }
    if (!name && !callback && !context) {
      this._events = {};
      return this;
    }
    names = name ? [name] : Object.keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      events = this._events[name];
      if (events) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
              (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) {
          delete this._events[name];
        }
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function (name) {
    if (!this._events) {
      return this;
    }
    var args = slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) {
      return this;
    }
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) {
      triggerEvents(events, args);
    }
    if (allEvents) {
      triggerEvents(allEvents, arguments);
    }
    return this;
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function (obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) {
      return this;
    }
    var remove = !name && !callback;
    if (!callback && typeof name === 'object') {
      callback = this;
    }
    if (obj) {
      (listeningTo = {})[obj._listenId] = obj;
    }
    for (var id in listeningTo) {
      obj = listeningTo[id];
      obj.off(name, callback, this);
      if (remove || !Object.keys(obj._events).length) {
        delete this._listeningTo[id];
      }
    }
    return this;
  }
};
// Regular expression used to split event strings.
var eventSplitter = /\s+/;
var listenMethods = {
  listenTo: 'on',
  listenToOnce: 'once'
};
var uniqueId = 0;
// Inversion-of-control versions of `on` and `once`. Tell *this* object to
// listen to an event in another object ... keeping track of what it's
// listening to.
var implementation;



for (var method in listenMethods) {
  implementation = listenMethods[method];
  Events[method] = function (obj, name, callback) {
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var id = obj._listenId || (obj._listenId = 'l_' + uniqueId++);
    listeningTo[id] = obj;
    if (!callback && typeof name === 'object') {
      callback = this;
    }
    obj[implementation](name, callback, this);
    return this;
  };
}

function once(func) {
  var ran,
    result;

  if (!isFunction$1(func)) {
    throw new TypeError();
  }
  return function () {
    if (ran) {
      return result;
    }
    ran = true;
    result = func.apply(this, arguments);

    // clear the `func` variable so the function may be garbage collected
    func = null;
    return result;
  };
}


// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
function eventsApi(obj, action, name, rest) {
  if (!name) {
    return true;
  }

  // Handle event maps.
  if (typeof name === 'object') {
    for (var key in name) {
      obj[action].apply(obj, [key, name[key]].concat(rest));
    }
    return false;
  }

  // Handle space separated event names.
  if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);
    for (var i = 0, l = names.length; i < l; i++) {
      obj[action].apply(obj, [names[i]].concat(rest));
    }
    return false;
  }

  return true;
}

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
function triggerEvents(events, args) {
  var ev,
    i = -1,
    l = events.length,
    a1 = args[0],
    a2 = args[1],
    a3 = args[2];
  switch (args.length) {
  case 0:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx);
    }
    return;
  case 1:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx, a1);
    }
    return;
  case 2:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx, a1, a2);
    }
    return;
  case 3:
    while (++i < l) {
      (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
    }
    return;
  default:
    while (++i < l) {
      (ev = events[i]).callback.apply(ev.ctx, args);
    }
  }
}

function Eventable(target) {
  return Object.assign(target, Events);
}

var body$1 = document.body;
var _window = self || window;
var head$1 = document.head || document.getElementsByTagName('head')[0];

var routeStripper = /^[#\/]|\s+$/g; // Cached regex for stripping a leading hash/slash and trailing space.
var rootStripper = /^\/+|\/+$/g; // Cached regex for stripping leading and trailing slashes.
var pathStripper = /#.*$/; // Cached regex for stripping urls of hash.
var isHistoryStarted = false; // Has the history handling already been started?
var atRootReg = /[^\/]$/;
var decodeFragmentReg = /%25/g;
var getSearchReplaceReg = /#.*/;
var getSearchMatchReg = /\?.+/;
var getHashReg = /#(.*)$/;
var _updateHashReg = /(javascript:|#).*$/;

function History() {
  // The default interval to poll for hash changes, if necessary, is
  // twenty times a second.
  this.interval = 50;
  this.checkUrl = this.checkUrl.bind(this);
  this.handlers = [];
  this.rand = Math.random();
  // Ensure that `History` can be used outside of the browser.
  if (typeof _window !== 'undefined') {
    this.location = location;
    this.history = _window.history;
  }
}

Object.assign(Eventable(History.prototype), {
  // Are we at the app root?
  atRoot() {
      var path = this.location.pathname.replace(atRootReg, '$&/');
      return path === this.root;
    },
    // Does the pathname match the root?
    matchRoot() {
      var path = this.decodeFragment(this.location.pathname);
      var root = path.slice(0, this.root.length - 1) + '/';
      return root === this.root;
    },

    // Unicode characters in `location.pathname` are percent encoded so they're
    // decoded for comparison. `%25` should not be decoded since it may be part
    // of an encoded parameter.
    decodeFragment(fragment) {
      return decodeURI(fragment.replace(decodeFragmentReg, '%2525'));
    },

    // In IE6, the hash fragment and search params are incorrect if the
    // fragment contains `?`.
    getSearch() {
      var match = this.location.href.replace(getSearchReplaceReg, '').match(getSearchMatchReg);
      return match ? match[0] : '';
    },
    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash(_window) {
      var match = (_window || this).location.href.match(getHashReg);
      return match ? match[1] : '';
    },

    // Get the pathname and search params, without the root.
    getPath() {
      var path = this.decodeFragment(
        this.location.pathname + this.getSearch()
      ).slice(this.root.length - 1);
      return path.charAt(0) === '/' ? path.slice(1) : path;
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment(fragment) {
      if (fragment === null || fragment === undefined) {
        if (this._hasPushState || !this._wantsHashChange) {
          fragment = this.getPath();
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start(options) {
      if (isHistoryStarted) {
        throw new Error('Backbone.history has already been started');
      }
      isHistoryStarted = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options = Object.assign({root: '/'}, this.options, options);
      this.root = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._hasHashChange = 'onhashchange' in _window && (document.documentMode === void 0 || document.documentMode > 7);
      this._useHashChange = this._wantsHashChange && this._hasHashChange;
      this._wantsPushState = !!this.options.pushState;
      this._hasPushState = !!(this.history && this.history.pushState);
      this._usePushState = this._wantsPushState && this._hasPushState;
      this.fragment = this.getFragment();

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          var root = this.root.slice(0, -1) || '/';
          this.location.replace(root + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

          // Or if we've started out with a hash-based route, but we're currently
          // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }
      }
      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
        var iframe = document.createElement('iframe');
        iframe.src = 'javascript:0';/*eslint no-script-url: 0*/
        iframe.style.display = 'none';
        iframe.tabIndex = -1;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        this.iframe = body$1.insertBefore(iframe, body$1.firstChild).contentWindow;
        this.iframe.document.open().close();
        this.iframe.location.hash = '#' + this.fragment;
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._usePushState) {
        _window.on('popstate', this.checkUrl);
      } else if (this._useHashChange && !this.iframe) {
        _window.on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      if (!this.options.silent) {
        return this.loadUrl();
      }
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop() {
      // Remove window listeners.
      if (this._usePushState) {
        _window.off('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        _window.off('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        body$1.removeChild(this.iframe.frameElement);
        this.iframe = null;
      }
      if (this._checkUrlInterval) {
        clearInterval(this._checkUrlInterval);
      }
      isHistoryStarted = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route(route, callback) {
      this.handlers.unshift({route, callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl( /*e*/ ) {
      var current = this.getFragment();
      // If the user pressed the back button, the iframe's hash will have
      // changed and we should use that for comparison.
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe.contentWindow);
      }
      if (current === this.fragment) {
        return false;
      }
      if (this.iframe) {
        this.navigate(current);
      }
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl(fragment) {
      // If the root doesn't match, no routes can match either.
      if (!this.matchRoot()) {
        return false;
      }
      fragment = this.fragment = this.getFragment(fragment);
      return this.handlers.some(handler => {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate(fragment, options) {
      if (!isHistoryStarted) {
        return false;
      }
      if (!options || options === true) {
        options = {
          trigger: !!options
        };
      }

      // Normalize the fragment.
      fragment = this.getFragment(fragment || '');

      // Don't include a trailing slash on the root.
      var root = this.root;
      if (fragment === '' || fragment.charAt(0) === '?') {
        root = root.slice(0, -1) || '/';
      }
      var url = root + fragment;

      // Strip the hash and decode for matching.
      fragment = this.decodeFragment(fragment.replace(pathStripper, ''));

      if (this.fragment === fragment) {
        return false;
      }
      this.fragment = fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._usePushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

        // If hash changes haven't been explicitly disabled, update the hash
        // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          var iWindow = this.iframe.contentWindow;
          if (!options.replace) {
            iWindow.document.open().close();
          }
          this._updateHash(iWindow.location, fragment, options.replace);
        }

        // If you've told us that you explicitly don't want fallback hashchange-
        // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) {
        return this.loadUrl(fragment);
      }
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash(_location, fragment, replace) {
      if (replace) {
        var href = _location.href.replace(_updateHashReg, '');
        _location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        _location.hash = '#' + fragment;
      }
    }
});

var HISTORY = new History();

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

function Router(options) {
  options = options || {};
  if (options.routes) {
    if (!this.routes) {
      this.routes = {};
    }
    Object.assign(this.routes, options.routes);
  }
  if (isFunction(this.init)) {
    this.init(options);
  }
  bindRoutes(this);
}

Object.assign(Eventable(Router.prototype), {
  // Manually bind a single named route to a callback. For example:
  //
  //     this.route('search/:query/p:num', 'search', function(query, num) {
  //       ...
  //     });
  //
  route (route, name/*, callback*/) {
    if (!isRegExp(route)) {
      route = routeToRegExp(route);
    }
    /*if (isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) {
      callback = this[name];
    }*/
    this.history.route(route, fragment => {
      var args = extractParameters(route, fragment);
      //if (this.execute(callback, args, name) !== false) {
        //this.trigger.apply(this, ['route:' + name].concat(args));
      this.trigger('route', name, args);
        //HISTORY.trigger('route', this, name, args);
      //}
    });
    return this;
  },

  // Execute a route handler with the provided parameters.  This is an
  // excellent place to do pre-route setup or post-route cleanup.
  execute (callback, args/*, name*/) {
    if (callback) {
      callback.apply(this, args);
    }
  },

  // Simple proxy to `HISTORY` to save a fragment into the history.
  navigate (fragment, options) {
    this.history.navigate(fragment, options);
    return this;
  },

  history: HISTORY

});
Router.assign = inherits;

// Bind all defined routes to `HISTORY`. We have to reverse the
// order of the routes here to support behavior where the most general
// routes can be defined at the bottom of the route map.
function bindRoutes (_this) {
  var routes = result(_this, 'routes');
  if (isset(routes)) {
    var route;
    var routeKeys = keys(routes);
    while ((route = routeKeys.pop()) !== undefined) {
      _this.route(route, routes[route]);
    }
  }
}

// Convert a route string into a regular expression, suitable for matching
// against the current location hash.
function routeToRegExp (route) {
  route = route
    .replace(escapeRegExp, '\\$&')
    .replace(optionalParam, '(?:$1)?')
    .replace(namedParam, (match, optional) => optional ? match : '([^/?]+)')
    .replace(splatParam, '([^?]*?)');
  return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
}

// Given a route, and a URL fragment that it matches, return the array of
// extracted decoded parameters. Empty or unmatched parameters will be
// treated as `null` to normalize cross-browser behavior.
function extractParameters (route, fragment) {
  return route.exec(fragment).slice(1).map(function (param, i) {
    if (isArray(param) && param.length === i + 1) { // Don't decode the search params.
      return param || null;
    }
    return param ? decodeURIComponent(param) : null;
  });
}

module.exports = Router;