import VirtualScroll from 'virtual-scroll';
import prefix from 'prefix';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var utils = {
  getCSSTransform: function getCSSTransform(value, direction) {
    return direction === 'vertical' ? 'translate3d(0, ' + value + 'px, 0)' : 'translate3d(' + value + 'px, 0, 0)';
  },
  getElements: function getElements(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    return [].concat(toConsumableArray(context.querySelectorAll(selector)));
  },
  exportState: function exportState(currentState, toExport) {
    var state = _extends({}, currentState);

    Object.keys(state).filter(function (key) {
      return !toExport.includes(key);
    }).forEach(function (key) {
      return delete state[key];
    });

    return state;
  }
};

var Scene = function () {
  /**
   * The constructor.
   * @constructor
   * @param {object} context - The DOM context.
   * @param {object} options - Options of rolly.
   */
  function Scene(context, options) {
    classCallCheck(this, Scene);

    this.options = options;

    this.state = {
      caching: false,
      cache: null,
      inView: false,
      active: false,
      progress: 0,
      progressInView: 0
    };

    this.DOM = { context: context };
  }

  /**
   * A promise to get cache for the scene.
   * The default cache object is as follow:
   *   - context: the DOM element of the scene.
   *   - type: the type of the scene.
   *   - top: distance between the top of the view and the top of the scene at the initial state.
   *   - bottom: distance between the top of the view and the bottom of the scene at the initial state.
   *   - left: distance between the left of the view and the left of the scene at the initial state.
   *   - right: distance between the left of the view and the right of the scene at the initial state.
   *   - size: height of the scene (or width on horizontal mode).
   *   - speed: the speed of the scene.
   *   - trigger: the trigger position (e.g.: 'middle', 'bottom', '100px', '10%').
   *
   * The cache of the scene is extendable by providing a method in options: `options.scenes.${sceneType}.cache`.
   * This method gives an object that contains:
   *   - cache: the computed cache so far.
   *   - state: the state of the scene.
   *   - globalState: the state of the rolly instance
   * Simply return new properties in an object to extend the cache.
   *
   * @param {object} globalState - The state of the rolly instance.
   */


  createClass(Scene, [{
    key: 'cache',
    value: function cache(globalState) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.state.caching = true;

        var vertical = _this.options.direction === 'vertical';
        // TODO: see when we need this
        // const scrollOffset = globalState.target;
        var scrollOffset = 0;

        var viewSize = vertical ? globalState.height : globalState.width;

        var context = _this.DOM.context;

        context.style.display = null;
        var computedStyle = window.getComputedStyle(context);
        if (computedStyle.display === 'none') {
          return _this.state.cache = null;
        }

        if (computedStyle.display === 'inline') {
          context.style.display = 'block';
        }

        context.style[globalState.transformPrefix] = null;

        var bounding = context.getBoundingClientRect();

        var type = context.getAttribute('data-scene');

        var options = _this.options.scenes;
        var sceneOptions = options[type] || {};

        var cache = {
          context: context,
          type: type,
          top: vertical ? bounding.top + scrollOffset : bounding.top,
          bottom: vertical ? bounding.bottom + scrollOffset : bounding.bottom,
          left: vertical ? bounding.left : bounding.left + scrollOffset,
          right: vertical ? bounding.right : bounding.right + scrollOffset,
          size: vertical ? bounding.height : bounding.width,
          speed: parseFloat(context.getAttribute('data-speed')) || sceneOptions.speed || options.speed,
          trigger: context.getAttribute('data-trigger') || sceneOptions.trigger || options.trigger
        };

        var _cache = cache,
            trigger = _cache.trigger;


        var triggerOffset = 0;
        if (trigger === 'middle') triggerOffset = viewSize / 2;else if (trigger === 'end') triggerOffset = viewSize;
        // px from top
        else if (trigger.slice(-2) === 'px') triggerOffset = parseFloat(trigger);
          // percentage
          else if (trigger.slice(-1) === '%') {
              triggerOffset = viewSize * parseFloat(trigger) / 100;
            }

        cache.triggerOffset = triggerOffset;

        var start = vertical ? cache.top + cache.size / 2 - globalState.height / 2 : cache.left + cache.size / 2 - globalState.width / 2;
        cache.offset = start - start * cache.speed;

        // Cache for custom scenes
        var getCache = sceneOptions.cache || options.cache;
        if (getCache) {
          if (getCache) {
            var extendedCache = getCache.call(_this, {
              cache: cache,
              globalState: globalState,
              sceneState: _this.state
            });

            cache = _extends({}, cache, extendedCache);
          }
        }

        _this.state.cache = cache;
        _this.state.caching = false;
        resolve();
      });
    }

    /**
     * Animation frame callback (called at every frames).
     * @param {object} globalState - The state of the rolly instance.
     */

  }, {
    key: 'run',
    value: function run(globalState) {
      if (!this.state.cache || this.state.caching) return false;

      var viewSize = this.options.direction === 'vertical' ? globalState.height : globalState.width;
      var _state = this.state,
          cache = _state.cache,
          active = _state.active;

      var _calc = this.calc(globalState),
          inView = _calc.inView,
          transform = _calc.transform,
          start = _calc.start;

      this.state.progress = this.getProgress(transform);
      this.state.progressInView = this.getProgressInView(start, viewSize);

      var _options$scenes = this.options.scenes,
          sceneOptions = _options$scenes[cache.type],
          options = objectWithoutProperties(_options$scenes, [cache.type]);


      if (!sceneOptions) {
        sceneOptions = {};
      }

      // The data we send to every custom functions
      var data = { globalState: globalState, sceneState: this.state, transform: transform };

      // Check if inView value changed
      if (this.state.inView !== inView) {
        // Trigger appear/disappear callbacks
        var action = inView ? 'appear' : 'disappear';
        if (sceneOptions[action]) sceneOptions[action].call(this, data);else if (options[action]) options[action].call(this, data);

        this.state.inView = inView;
      }

      // Check and then trigger callbacks
      if (inView) {
        this.DOM.context.style.willChange = 'transform';
        this.DOM.context.style.visibility = null;

        // Run
        if (sceneOptions.run) sceneOptions.run.call(this, data);else if (options.run) options.run.call(this, data);

        // Enter
        if (this.checkEnter(active, this.state.progress)) {
          this.state.active = true;
          if (sceneOptions.enter) sceneOptions.enter.call(this, data);else if (options.enter) options.enter.call(this, data);
        }

        // Leave
        else if (this.checkLeave(active, this.state.progress)) {
            this.state.active = false;
            if (sceneOptions.leave) sceneOptions.leave.call(this, data);else if (options.leave) options.leave.call(this, data);
          }

        // Transform
        if (sceneOptions.transform) sceneOptions.transform.call(this, data);else if (options.transform) options.transform.call(this, data);else {
          this.DOM.context.style[globalState.transformPrefix] = utils.getCSSTransform(transform, this.options.direction);
        }
      } else {
        this.DOM.context.style.visibility = 'hidden';
        this.DOM.context.style.willChange = null;
      }
    }

    /**
     * Computes useful values for the scene.
     * @param {object} globalState - The state of the rolly instance
     * @return {object} Values as follow:
     * - transform: the transform value according to the speed
     * - start: distance between the start position of the view and the start position of the scene context (top|left)
     * - end: distance between the end position of the view and the end position of the scene context (bottom|right)
     * - inView: whether the scene is in the viewport
     */

  }, {
    key: 'calc',
    value: function calc(globalState) {
      var vertical = this.options.direction === 'vertical';
      var _state$cache = this.state.cache,
          top = _state$cache.top,
          right = _state$cache.right,
          bottom = _state$cache.bottom,
          left = _state$cache.left,
          speed = _state$cache.speed,
          offset = _state$cache.offset;
      var width = globalState.width,
          height = globalState.height,
          current = globalState.current;


      var transform = current * -speed - offset;

      var start = Math.round((vertical ? top : left) + transform);
      var end = Math.round((vertical ? bottom : right) + transform);
      var inView = end > 0 && start < (vertical ? height : width);

      return { transform: transform, start: start, end: end, inView: inView };
    }

    /**
     * Gets the progress of the scene in relation to its trigger (default trigger position is 'middle').
     * @param {number} transform - The transform position of the scene.
     * @return {number} The progress position.
     */

  }, {
    key: 'getProgress',
    value: function getProgress(transform) {
      var vertical = this.options.direction === 'vertical';
      var cache = this.state.cache;
      var triggerOffset = cache.triggerOffset;


      var position = -transform + triggerOffset;

      var progress = (position - (vertical ? cache.top : cache.left)) / cache.size;

      if (progress < 0 || progress > 1) return -1;
      return progress;
    }

    /**
     * Gets the progress of the scene in relation to the viewport.
     * @param {number} start - The distance between the start position of the view and the start.
     * @param {*} viewSize - The size of the view.
     */

  }, {
    key: 'getProgressInView',
    value: function getProgressInView(start, viewSize) {
      return (viewSize - start) / (viewSize + this.state.cache.size);
    }

    /**
     * Checks if the trigger met the scene.
     * @param {boolean} active - Whether the scene is active.
     * @param {number} progress - The progress position of the scene related to the trigger
     * @return {boolean} The result.
     */

  }, {
    key: 'checkEnter',
    value: function checkEnter(active, progress) {
      return !active && progress >= 0 && progress <= 1;
    }

    /**
     * Checks if the trigger left the scene.
     * @param {boolean} active - Whether the scene is active.
     * @param {number} progress - The progress position of the scene related to the trigger
     * @return {boolean} The result.
     */

  }, {
    key: 'checkLeave',
    value: function checkLeave(active, progress) {
      return active && progress === -1;
    }
  }]);
  return Scene;
}();

var ScrollBar = function () {
  /**
   * The constructor.
   * @constructor
   * @param {object} parent - The parent DOM of the scroll bar.
   * @param {object} globalState - The state of the rolly instance.
   * @param {function} setTarget - The {@link Rolly#setTarget} method.
   * @param {object} options - Options of rolly.
   */
  function ScrollBar(parent, globalState, setTarget, options) {
    classCallCheck(this, ScrollBar);

    this.options = options;

    this.DOM = this.render(parent);

    this.state = {
      clicked: false,
      thumb: { size: 0 }
    };

    this.cache(globalState);

    this.setTarget = setTarget;
  }

  /**
   * Sets cache for scroll bar.
   * @param {object} globalState - The state of the rolly instance.
   */


  createClass(ScrollBar, [{
    key: 'cache',
    value: function cache(globalState) {
      this.state.cache = {
        bounding: globalState.bounding,
        viewSize: this.options.direction === 'vertical' ? globalState.height : globalState.width
      };
      this.updateThumbSize();
    }

    /**
     * Animation frame callback (called at every frames).
     * @param {object} globalState - The state of the rolly instance.
     */

  }, {
    key: 'run',
    value: function run(_ref) {
      var current = _ref.current,
          transformPrefix = _ref.transformPrefix;
      var _state$cache = this.state.cache,
          bounding = _state$cache.bounding,
          viewSize = _state$cache.viewSize;

      var value = Math.abs(current) / (bounding / (viewSize - this.thumbSize)) + this.thumbSize / 0.5 - this.thumbSize;
      var clamp = Math.max(0, Math.min(value - this.thumbSize, value + this.thumbSize));
      this.DOM.thumb.style[transformPrefix] = utils.getCSSTransform(clamp.toFixed(2), this.options.direction);
    }

    /**
     * Computes the target value from the scroll bar (based on event client viewport position).
     * @param {number} client - The client position.
     * @return {number} The target.
     */

  }, {
    key: 'calc',
    value: function calc(client) {
      return client * (this.state.cache.bounding / this.state.cache.viewSize);
    }

    /**
     * Renders the scroll bar.
     * @param {object} parent - The parent DOM of the scroll bar.
     * @return {object} - The list of DOM elements (parent, context, thumb).
     */

  }, {
    key: 'render',
    value: function render(parent) {
      var context = document.createElement('div');
      context.className = 'rolly-scroll-bar rolly-' + this.options.direction;

      var thumb = document.createElement('div');
      thumb.className = 'rolly-scroll-bar-thumb';

      context.appendChild(thumb);
      parent.appendChild(context);

      return { parent: parent, context: context, thumb: thumb };
    }

    /**
     * Starts listening events (mouse interactions).
     */

  }, {
    key: 'on',
    value: function on() {
      this.boundFns = {
        click: this.click.bind(this),
        mouseDown: this.mouseDown.bind(this),
        mouseMove: this.mouseMove.bind(this),
        mouseUp: this.mouseUp.bind(this)
      };

      this.DOM.context.addEventListener('click', this.boundFns.click);
      this.DOM.context.addEventListener('mousedown', this.boundFns.mouseDown);

      document.addEventListener('mousemove', this.boundFns.mouseMove);
      document.addEventListener('mouseup', this.boundFns.mouseUp);
    }

    /**
     * Stops listening events (mouse interactions).
     */

  }, {
    key: 'off',
    value: function off() {
      if (!this.boundFns) return false;
      this.DOM.context.removeEventListener('click', this.boundFns.click);
      this.DOM.context.removeEventListener('mousedown', this.boundFns.mouseDown);

      document.removeEventListener('mousemove', this.boundFns.mouseMove);
      document.removeEventListener('mouseup', this.boundFns.mouseUp);
      delete this.boundFns;
    }

    /**
     * Click event callback.
     * @param {object} event - The event data.
     */

  }, {
    key: 'click',
    value: function click(event) {
      var value = this.calc(this.options.direction == 'vertical' ? event.clientY : event.clientX);
      this.setTarget(value);
    }

    /**
     * Mouse down event callback.
     * @param {object} event - The event data.
     */

  }, {
    key: 'mouseDown',
    value: function mouseDown(event) {
      event.preventDefault();
      if (event.which === 1) {
        this.state.clicked = true;
      }
      this.DOM.parent.classList.add('is-dragging-scroll-bar');
    }

    /**
     * Mouse move event callback.
     * @param {object} event - The event data.
     */

  }, {
    key: 'mouseMove',
    value: function mouseMove(event) {
      if (this.state.clicked) {
        var value = this.calc(this.options.direction == 'vertical' ? event.clientY : event.clientX);
        this.setTarget(value);
      }
    }

    /**
     * Mouse up event callback.
     * @param {object} event - The event data.
     */

  }, {
    key: 'mouseUp',
    value: function mouseUp(event) {
      this.state.clicked = false;
      this.DOM.parent.classList.remove('is-dragging');
    }

    /**
     * Gets the size of the thumb (heigh or width on horizontal mode).
     * @return {number} - The size of the thumb.
     */

  }, {
    key: 'updateThumbSize',


    /**
     * Updates the size of the thumb.
     * This method is called when the content changes or on a resize for instance.
     */
    value: function updateThumbSize() {
      var bounding = this.state.cache.bounding;

      if (bounding <= 0) {
        this.DOM.context.classList.add('is-hidden');
        return this.thumbSize = 0;
      }

      this.DOM.context.classList.remove('is-hidden');
      var viewSize = this.state.cache.viewSize;

      return this.thumbSize = viewSize * (viewSize / (bounding + viewSize));
    }

    /**
     * Destroy the scroll bar.
     * - removes from the DOM.
     * - calls {@link ScrollBar#off}.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.off();
      this.DOM.parent.removeChild(this.DOM.context);
    }
  }, {
    key: 'thumbSize',
    get: function get$$1() {
      return this.state.thumb.size;
    }

    /**
     * Sets the size of the thumb (heigh or width on horizontal mode).
     * @param {number} - The size of the thumb.
     */
    ,
    set: function set$$1(size) {
      this.state.thumb.size = size;
      var prop = this.options.direction === 'vertical' ? 'height' : 'width';
      this.DOM.thumb.style[prop] = size + 'px';
    }
  }]);
  return ScrollBar;
}();

var Rolly = function () {
  /*
   ** Public methods
   */

  /**
   * The constructor.
   * @constructor
   * @param {object} options - Options of rolly.
   */
  function Rolly() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, Rolly);

    this.boundFns = privated.getBoundFns.call(this);

    // Extend default options
    this.options = privated.extendOptions.call(this, options);

    this.DOM = {
      listener: this.options.listener,
      view: this.options.view
    };

    privated.initScenes.call(this);
  }

  /**
   * Initializes the rolly instance.
   * - adds DOM classes.
   * - if native, adds fake height.
   * - else if `options.noScrollBar` is false, adds a fake scroll bar.
   * - calls {@link Rolly#on}.
   */


  createClass(Rolly, [{
    key: 'init',
    value: function init() {
      var _this = this;

      // Instantiate virtual scroll native option is false
      this.virtualScroll = this.options.native ? null : new VirtualScroll(this.options.virtualScroll);

      privated.initState.call(this);

      var type = this.options.native ? 'native' : 'virtual';
      var direction = this.options.direction === 'vertical' ? 'y' : 'x';

      this.DOM.listener.classList.add('is-' + type + '-scroll');
      this.DOM.listener.classList.add(direction + '-scroll');
      this.DOM.view.classList.add('rolly-view');

      this.options.native ? privated.addFakeScrollHeight.call(this) : !this.options.noScrollBar && privated.addFakeScrollBar.call(this);

      if (this.options.preload) privated.preloadImages.call(this, function () {
        _this.state.preLoaded = true;
        _this.boundFns.resize();
        privated.ready.call(_this);
      });

      this.on();
    }

    /**
     * Enables the rolly instance.
     * - starts listening events (scroll and resize),
     * - requests an animation frame if {@param rAF} is true.
     * @param {boolean} rAF - whether to request an animation frame.
     */

  }, {
    key: 'on',
    value: function on() {
      var rAF = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (this.options.native) {
        var listener = privated.getNodeListener.call(this);
        listener.addEventListener('scroll', this.boundFns.debounceScroll);
      } else if (this.virtualScroll) {
        this.virtualScroll.on(this.boundFns.virtualScroll);
      }

      if (this.scrollBar) {
        this.scrollBar.on();
      }

      rAF && privated.rAF.call(this);

      privated.resize.call(this);
      window.addEventListener('resize', this.boundFns.resize);

      this.state.ready = true;
      privated.ready.call(this);
    }

    /**
     * Disables the rolly instance.
     * - stops listening events (scroll and resize),
     * - cancels any requested animation frame if {@param cAF} is true.
     * @param {boolean} cAF - whether to cancel a requested animation frame.
     */

  }, {
    key: 'off',
    value: function off() {
      var cAF = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (this.options.native) {
        var listener = privated.getNodeListener.call(this);
        listener.removeEventListener('scroll', this.boundFns.debounceScroll);
      } else if (this.virtualScroll) {
        this.virtualScroll.off(this.boundFns.virtualScroll);
      }

      if (this.scrollBar) {
        this.scrollBar.off();
      }

      cAF && privated.cAF.call(this);

      window.removeEventListener('resize', this.boundFns.resize);
      this.state.ready = false;
    }

    /**
     * Destroys the rolly instance.
     * - removes DOM classes.
     * - if native, removes the fake height for scroll.
     * - else if `options.noScrollBar` is false, removes the fake scroll bar.
     * - calls {@link Rolly#off}.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      var type = this.options.native ? 'native' : 'virtual';
      var direction = this.options.direction === 'vertical' ? 'y' : 'x';

      this.DOM.listener.classList.remove('is-' + type + '-scroll');
      this.DOM.listener.classList.remove(direction + '-scroll');
      this.DOM.view.classList.remove('rolly-view');

      this.virtualScroll && (this.virtualScroll.destroy(), this.virtualScroll = null);

      this.off();

      this.options.native ? privated.removeFakeScrollHeight.call(this) : !this.options.noScrollBar && privated.removeFakeScrollBar.call(this);
    }

    /**
     * Reloads the rolly instance with new options.
     * @param {object} options - Options of rolly.
     */

  }, {
    key: 'reload',
    value: function reload() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.options;

      this.destroy();

      this.boundFns = privated.getBoundFns.call(this);

      // Extend default options
      this.options = privated.extendOptions.call(this, options);

      var DOM = this.DOM;

      this.DOM = _extends({}, DOM, {
        listener: this.options.listener,
        view: this.options.view
      });

      privated.initScenes.call(this);

      this.init();
    }

    /**
     * Scrolls to a target (number|DOM element).
     * @param {number|object} target - The target to scroll to.
     * @param {object} options - Options.
     */

  }, {
    key: 'scrollTo',
    value: function scrollTo(target, options) {
      var defaultOptions = {
        offset: 0,
        position: 'start',
        callback: null
      };
      options = _extends({}, defaultOptions, options);

      var vertical = this.options.direction === 'vertical';
      var scrollOffset = this.state.current;
      var bounding = null;
      var newPos = scrollOffset + options.offset;

      if (typeof target === 'string') {
        target = utils.getElements(target)[0];
      }

      switch (typeof target === 'undefined' ? 'undefined' : _typeof(target)) {
        case 'number':
          newPos = target;
          break;

        case 'object':
          if (!target) return;
          bounding = target.getBoundingClientRect();
          newPos += vertical ? bounding.top : bounding.left;
          break;
      }

      switch (options.position) {
        case 'center':
          newPos -= vertical ? this.state.height / 2 : this.state.width / 2;
          break;

        case 'end':
          newPos -= vertical ? this.state.height : this.state.width;
          break;
      }

      if (options.callback) {
        this.state.scrollTo.callback = options.callback;
      }

      // FIXME: if the scrollable element is not the body, this won't work
      if (this.options.native) {
        this.options.direction === 'vertical' ? window.scrollTo(0, newPos) : window.scrollTo(newPos, 0);
      } else {
        privated.setTarget.call(this, newPos);
      }
    }

    /**
     * Updates the states and re-setup all the cache of the rolly instance.
     * Useful if the width/height of the view changed.
     * - calls {@link Rolly#resize}.
     */

  }, {
    key: 'update',
    value: function update() {
      privated.resize.call(this);
    }
  }]);
  return Rolly;
}();

/*
 ** Private methods
 */


var privated = {
  /**
   * Gets all functions that needs to be bound with the rolly's scope
   */
  getBoundFns: function getBoundFns() {
    var _this2 = this;

    var fns = {};
    ['resize', 'debounceScroll', 'virtualScroll'].map(function (fn) {
      return fns[fn] = privated[fn].bind(_this2);
    });
    return fns;
  },


  /**
   * Initializes the state of the rolly instance.
   */
  initState: function initState() {
    this.state = {
      // Global states
      current: 0,
      previous: 0,
      target: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      bounding: 0,
      ready: false,
      preLoaded: false,

      // Animation frame
      rAF: undefined,
      /*
       * It seems that under heavy load, Firefox will still call the RAF
       * callback even though the RAF has been canceled. To prevent
       * that we set a flag to prevent any callback to be executed when
       * RAF is removed.
       */
      isRAFCanceled: false,

      // Native scroll
      debounceScroll: { timer: null, tick: false },

      // Scroll to
      scrollTo: {},

      // The transform property to use
      transformPrefix: prefix('transform')
    };
  },


  /**
   * Initializes scenes
   */
  initScenes: function initScenes() {
    var _this3 = this;

    this.scenes = [];

    utils.getElements(this.options.scenes.selector, this.DOM.view).forEach(function (scene) {
      return _this3.scenes.push(new Scene(scene, _this3.options));
    });
  },


  /*
   ** Animation frame methods
   */

  /**
   * Animation frame callback (called at every frames).
   * Automatically stops when |target - current| < 0.1.
   */
  run: function run() {
    if (this.state.isRAFCanceled) return;
    privated.rAF.call(this);

    var diff = this.state.target - this.state.current;
    var delta = diff * this.options.ease;

    // If diff between target and current states is < 0.1, stop running animation
    if (Math.abs(diff) < 0.1) {
      privated.cAF.call(this);
      delta = 0;
      this.state.current = this.state.target;
    } else {
      this.state.current += delta;
    }

    var exportedState = utils.exportState(this.state, ['current', 'previous', 'target', 'width', 'height', 'bounding', 'ready', 'preLoaded', 'transformPrefix']);

    if (Math.abs(diff) < 10 && this.state.scrollTo.callback) {
      this.state.scrollTo.callback(exportedState);
      this.state.scrollTo.callback = null;
    }

    // Set scroll bar thumb position
    if (this.scrollBar) {
      this.scrollBar.run(this.state);
    }

    // Call custom run
    if (this.options.run) {
      this.options.run(exportedState);
    }

    this.scenes.forEach(function (scene) {
      return scene.run(exportedState);
    });

    this.state.previous = this.state.current;
  },


  /**
   * Request an animation frame.
   */
  rAF: function rAF() {
    this.state.isRAFCanceled = false;
    this.state.rAF = requestAnimationFrame(privated.run.bind(this));
  },


  /**
   * Cancel a requested animation frame.
   */
  cAF: function cAF() {
    this.state.isRAFCanceled = true;
    this.state.rAF = cancelAnimationFrame(this.state.rAF);
  },


  /*
   ** Events
   */

  /**
   * Checks if rolly is ready.
   */
  ready: function ready() {
    if (this.state.ready && (this.options.preload ? this.state.preLoaded : true)) {
      if (this.options.ready) {
        this.options.ready(this.state);
      }
      return true;
    }
    return false;
  },


  /**
   * Virtual scroll event callback.
   * @param {object} e - The event data.
   */
  virtualScroll: function virtualScroll(e) {
    if (this.state.scrollTo.callback) return;
    var delta = this.options.direction === 'horizontal' ? e.deltaX : e.deltaY;
    privated.setTarget.call(this, this.state.target + delta * -1);
  },


  /**
   * Native scroll event callback.
   * @param {object} e - The event data.
   */
  debounceScroll: function debounceScroll(e) {
    var _this4 = this;

    if (this.state.scrollTo.callback) return;
    var isWindow = this.DOM.listener === document.body;

    var target = this.options.direction === 'vertical' ? isWindow ? window.scrollY || window.pageYOffset : this.DOM.listener.scrollTop : isWindow ? window.scrollX || window.pageXOffset : this.DOM.listener.scrollLeft;

    privated.setTarget.call(this, target);

    clearTimeout(this.state.debounceScroll.timer);

    if (!this.state.debounceScroll.tick) {
      this.state.debounceScroll.tick = true;
      this.DOM.listener.classList.add('is-scrolling');
    }

    this.state.debounceScroll.timer = setTimeout(function () {
      _this4.state.debounceScroll.tick = false;
      _this4.DOM.listener.classList.remove('is-scrolling');
    }, 200);
  },


  /**
   * Resize event callback.
   * @param {object} e - The event data.
   */
  resize: function resize(e) {
    var _this5 = this;

    var prop = this.options.direction === 'vertical' ? 'height' : 'width';
    this.state.height = window.innerHeight;
    this.state.width = window.innerWidth;

    // Calc bounding
    var bounding = this.DOM.view.getBoundingClientRect();
    this.state.bounding = this.options.direction === 'vertical' ? bounding.height - (this.options.native ? 0 : this.state.height) : bounding.right - (this.options.native ? 0 : this.state.width);

    // Set scroll bar thumb height (according to view height)
    if (this.scrollBar) {
      this.scrollBar.cache(this.state);
    } else if (this.options.native) {
      console.log(this.DOM);
      this.DOM.scroll.style[prop] = this.state.bounding + 'px';
    }

    privated.setTarget.call(this, this.state.target);

    // Get cache for scenes
    this.scenes.forEach(function (scene) {
      return scene.cache(_this5.state);
    });
  },


  /*
   ** Utils
   */

  /**
   * Extends options.
   * @param {object} options - The options to extend.
   * @return {object} The extended options.
   */
  extendOptions: function extendOptions(options) {
    var opts = this.options ? this.options : privated.getDefaults.call(this);
    options.virtualScroll = _extends({}, opts.virtualScroll, options.virtualScroll);
    options.scenes = _extends({}, opts.scenes, options.scenes);

    return _extends({}, opts, options);
  },


  /**
   * Preload images in the view of the rolly instance.
   * Useful if the view contains images that might not have fully loaded when the instance is created (because when an image is loaded, the total height changes).
   * @param {function} callback - The function to run when images are loaded.
   */
  preloadImages: function preloadImages(callback) {
    var images = utils.getElements('img', this.DOM.listener);

    if (!images.length) {
      if (callback) callback();
      return;
    }

    images.forEach(function (image) {
      var img = document.createElement('img');
      img.onload = function () {
        images.splice(images.indexOf(image), 1);
        if (images.length === 0) callback();
      };

      img.src = image.getAttribute('src');
    });
  },


  /**
   * Adds a fake scroll height.
   */
  addFakeScrollHeight: function addFakeScrollHeight() {
    var scroll = document.createElement('div');
    scroll.className = 'rolly-scroll-view';
    console.log('add fake scroll height');
    this.DOM.scroll = scroll;
    this.DOM.listener.appendChild(this.DOM.scroll);
  },


  /**
   * Removes a fake scroll height.
   */
  removeFakeScrollHeight: function removeFakeScrollHeight() {
    this.DOM.listener.removeChild(this.DOM.scroll);
  },


  /**
   * Adds a fake scroll bar.
   */
  addFakeScrollBar: function addFakeScrollBar() {
    this.scrollBar = new ScrollBar(this.DOM.listener, this.state, privated.setTarget.bind(this), this.options);
  },


  /**
   * Removes the fake scroll bar.
   */
  removeFakeScrollBar: function removeFakeScrollBar() {
    this.scrollBar.destroy();
  },


  /*
   ** Getters and setters
   */

  /**
   * Gets the default options for the rolly instance.
   * @return {object} The default options.
   */
  getDefaults: function getDefaults() {
    return {
      direction: 'vertical',
      listener: document.body,
      view: utils.getElements('.rolly-view')[0] || null,
      native: false,
      preload: true,
      ready: null,
      run: null,
      ease: 0.075,
      virtualScroll: {
        limitInertia: false,
        mouseMultiplier: 0.5,
        touchMultiplier: 1.5,
        firefoxMultiplier: 30,
        preventTouch: true
      },
      noScrollBar: false,
      scenes: {
        selector: '[data-scene]',
        speed: 1,
        trigger: 'middle'
      }
    };
  },


  /**
   * Gets the node element on which will be attached the scroll event listener (in case of native behavior).
   * @return {object} The node element.
   */
  getNodeListener: function getNodeListener() {
    return this.DOM.listener === document.body ? window : this.DOM.listener;
  },


  /**
   * Sets the target position with auto clamping.
   */
  setTarget: function setTarget(target) {
    this.state.target = Math.round(Math.max(0, Math.min(target, this.state.bounding)));
    !this.state.rAF && privated.rAF.call(this);
  }
};

var rolly = function rolly(options) {
  return new Rolly(options);
};

export default rolly;
