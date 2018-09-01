import prefix from 'prefix';
import VirtualScroll from 'virtual-scroll';

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

    var els = context.querySelectorAll(selector);
    return Array.prototype.slice.call(els, 0);
  },
  exportState: function exportState(currentState) {
    var state = _extends({}, currentState);
    var toExport = ['current', 'previous', 'target', 'width', 'height', 'bounding'];

    Object.keys(state).filter(function (key) {
      return !toExport.includes(key);
    }).forEach(function (key) {
      return delete state[key];
    });

    return state;
  }
};

var Parallax = function () {
  /**
   * The constructor.
   * @constructor
   * @param {object} context - The DOM context.
   * @param {object} options - Options of Rolly.
   */
  function Parallax(context, options) {
    classCallCheck(this, Parallax);

    this.options = options;

    this.transformPrefix = prefix('transform');

    this.state = { caching: false, cache: null };
    this.DOM = { context: context };
    this.DOM.els = utils.getElements(this.options.parallax.selector, context);
  }

  /**
   * Reload parallax elements with new options.
   * @param {object} options - Options of Rolly.
   */


  createClass(Parallax, [{
    key: 'reload',
    value: function reload(options) {
      this.options = options;
      this.DOM.els = utils.getElements(this.options.parallax.selector, this.DOM.context);
    }

    /**
     * Animation frame callback (called at every frames).
     * @param {object} rollyState - The state of Rolly instance.
     */

  }, {
    key: 'run',
    value: function run(rollyState) {
      var _this = this;

      this.DOM.els.forEach(function (el, index) {
        if (!_this.state.cache || _this.state.caching) return;
        var cache = _this.state.cache[index];
        var current = rollyState.current;

        if (!cache) return;

        // Set style for parallax element with type 'default'
        if (cache.type === 'default') {
          var _calc = _this.calc(cache, rollyState),
              inView = _calc.inView,
              transform = _calc.transform;

          if (inView) {
            el.style[_this.transformPrefix] = utils.getCSSTransform(transform, _this.options.direction);
          }
        } else {
          // Do other things for parallax element with other type
          try {
            _this.options.parallax[cache.type].run.call(_this, {
              cache: cache,
              state: rollyState
            });
          } catch (error) {
            var msg = 'rolly.options.parallax.' + cache.type + '.run: an error occured while calling run function for parallax elements with type';
            console.error(msg + ' \'' + cache.type + '\'', error);
          }
        }
      });
    }

    /**
     * Calculate usefull values for a parallax element.
     * @param {object} cache - The cache of the parallax element.
     * @param {object} rollyState - The state of Rolly instance.
     * @return {object} Values as follow:
     *   - transform: the transform value according to the element speed.
     *   - start: distance between the start of screen and start of
     *     element (top||left).
     *   - end: distance between the start of screen and end of
     *     element (bottom||right).
     *   - inView: boolean that indicates whether the element is in the viewport.
     */

  }, {
    key: 'calc',
    value: function calc(cache, rollyState) {
      var vertical = this.options.direction === 'vertical';
      var top = cache.top,
          right = cache.right,
          bottom = cache.bottom,
          left = cache.left,
          size = cache.size,
          speed = cache.speed;
      var width = rollyState.width,
          height = rollyState.height,
          current = rollyState.current;


      var transform = ((vertical ? top : left) + size / 2 - current) * speed;
      var start = Math.round((vertical ? top : left) + transform - current);
      var end = Math.round((vertical ? bottom : right) + transform - current);
      var inView = end > 0 && start < (vertical ? height : width);

      return { transform: transform, start: start, end: end, inView: inView };
    }

    /**
     * A promise to get cache for each parallax element.
     * The default cache object is as follow:
     *   - el: the DOM element.
     *   - top: distance between the top of the context element and the top of
     *     the element.
     *   - bottom: distance between the top of the context element and the bottom
     *     of the element.
     *   - left: distance between the left of the context element and the left of
     *     the element.
     *   - right: distance between the left of the context element and the right
     *     of the element.
     *   - size: height of the element (or width on horizontal mode).
     *   - speed: speed of the element.
     *   - type: type of the element (default or something specified in
     *     the 'data-parallax' attribute).
     * @param {object} rollyState - The state of Rolly instance.
     */

  }, {
    key: 'cache',
    value: function cache(rollyState) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.state.caching = true;
        _this2.state.cache = [];

        var isVertical = _this2.options.direction === 'vertical';
        var scrollOffset = rollyState.target;

        _this2.DOM.els.forEach(function (el, index) {
          el.style.display = null;
          var computedDisplay = window.getComputedStyle(el).display;
          if (computedDisplay === 'none') {
            _this2.state.cache.push(null);
            return;
          }

          if (computedDisplay === 'inline') {
            el.style.display = 'block';
          }
          el.style[_this2.transformPrefix] = 'none';

          var bounding = el.getBoundingClientRect();
          var cache = {
            el: el,
            top: isVertical ? bounding.top + scrollOffset : bounding.top,
            bottom: isVertical ? bounding.bottom + scrollOffset : bounding.bottom,
            left: isVertical ? bounding.left : bounding.left + scrollOffset,
            right: isVertical ? bounding.right : bounding.right + scrollOffset,
            size: isVertical ? bounding.height : bounding.width,
            speed: parseFloat(el.getAttribute('data-speed')) || -1,
            type: el.getAttribute('data-parallax') || 'default'
          };

          // Set default style for parallax element with type 'default'
          if (cache.type === 'default') {
            var _calc2 = _this2.calc(cache, rollyState),
                transform = _calc2.transform;

            el.style[_this2.transformPrefix] = utils.getCSSTransform(transform, _this2.options.direction);
          } else {
            // Do custom things for parallax elements with custom type
            if (_this2.options.parallax[cache.type]) {
              var getCache = _this2.options.parallax[cache.type].getCache;
              if (getCache) {
                var extend = getCache.call(_this2, { cache: cache, state: rollyState });
                cache = _extends({}, cache, extend);
              }
            }
          }

          _this2.state.cache.push(cache);
        });

        _this2.state.caching = false;
        resolve();
      });
    }
  }]);
  return Parallax;
}();

var Scenes = function () {
  /**
   * The constructor.
   * @constructor
   * @param {object} context - The DOM context.
   * @param {object} options - Options of Rolly.
   */
  function Scenes(context, options) {
    classCallCheck(this, Scenes);

    this.options = options;

    this.state = { caching: false, cache: null };
    this.DOM = { context: context };
    this.DOM.els = utils.getElements(this.options.scenes.selector, context);
  }

  /**
   * Reload scenes with new options.
   * @param {object} options - Options of Rolly.
   */


  createClass(Scenes, [{
    key: 'reload',
    value: function reload(options) {
      this.options = options;
      this.DOM.els = utils.getElements(this.options.scenes.selector, this.DOM.context);
    }

    /**
     * Animation frame callback (called at every frames).
     * @param {object} rollyState - The state of Rolly instance.
     */

  }, {
    key: 'run',
    value: function run(rollyState) {
      var _this = this;

      this.DOM.els.forEach(function (el, index) {
        if (!_this.state.cache || _this.state.caching) return;

        var current = rollyState.current;
        var rollySize = _this.options.direction === 'vertical' ? rollyState.height : rollyState.width;
        var cache = _this.state.cache[index];

        if (!cache) return;

        cache.progress = _this.getProgress(current, rollySize, cache);
        var inView = _this.checkInView(current, rollySize, cache);

        var sceneOptions = _this.options.scenes[cache.name] || {};

        // Check inView value changed
        if (cache.inView !== inView) {
          cache.inView = inView;

          if (inView) {
            if (sceneOptions.appear) {
              sceneOptions.appear.call(_this, cache, rollyState);
            }
          } else {
            if (sceneOptions.disappear) {
              sceneOptions.disappear.call(_this, cache, rollyState);
            }
          }
        }

        if (inView) {
          // Check is entering
          if (_this.checkEnter(cache.active, cache.progress)) {
            cache.active = true;
            if (sceneOptions.enter) {
              sceneOptions.enter.call(_this, cache, rollyState);
            }
          } else if (_this.checkLeave(cache.active, cache.progress)) {
            // Check is leaving
            cache.active = false;
            if (sceneOptions.leave) {
              sceneOptions.leave.call(_this, cache, rollyState);
            }
          }

          // Run
          if (sceneOptions.run) {
            sceneOptions.run.call(_this, cache, rollyState);
          }
        }
      });
    }

    /**
     * Get the progress position of the scenes in relation to the trigger
     * (default trigger position is 'middle').
     * @param {number} current - The current position of scroll.
     * @param {number} rollySize - The size of the context element.
     * @param {object} cache - The cache of the scene.
     * @return {number} The progress position.
     */

  }, {
    key: 'getProgress',
    value: function getProgress(current, pageSize, cache) {
      var vertical = this.options.direction === 'vertical';

      var offset = current;
      var trigger = cache.trigger;

      if (trigger && typeof trigger === 'string') {
        if (trigger === 'middle') offset += pageSize / 2;else if (trigger === 'end') offset += pageSize;
        // px from top
        else if (trigger.slice(-2) === 'px') offset += parseFloat(trigger);
          // percentage
          else if (trigger.slice(-1) === '%') {
              offset += pageSize * parseFloat(trigger) / 100;
            }
      }

      var progress = (offset - (vertical ? cache.top : cache.left)) / cache.size;
      if (progress < 0 || progress > 1) return -1;
      return progress;
    }

    /**
     * A promise to get cache for each scene.
     * The default cache object is as follow:
     *   - el: the DOM element.
     *   - name: the name of the scene.
     *   - size: the size of the size.
     *   - top: distance between the top of the context element and the top of
     *     the element.
     *   - bottom: distance between the top of the context element and the bottom
     *     of the element.
     *   - left: distance between the left of the context element and the left of
     *     the element.
     *   - right: distance between the left of the context element and the right
     *     of the element.
     *   - size: height of the element (or width on horizontal mode).
     *   - trigger: the trigger position
     *     (e.g: 'middle', 'bottom', '100px', '10%').
     *   - inView: whether the scene is into the viewport.
     *   - progress: the progress position of the scene related to the trigger.
     * @param {object} rollyState - The state of Rolly instance.
     */

  }, {
    key: 'cache',
    value: function cache(rollyState) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.state.caching = true;
        _this2.state.cache = [];

        var isVertical = _this2.options.direction === 'vertical';
        var scrollOffset = rollyState.target;

        _this2.DOM.els.forEach(function (el, index) {
          el.style.display = null;
          var computedDisplay = window.getComputedStyle(el).display;
          if (computedDisplay === 'none') {
            _this2.state.cache.push(null);
            return;
          }

          if (computedDisplay === 'inline') {
            el.style.display = 'block';
          }

          var bounding = el.getBoundingClientRect();
          var cache = {
            el: el,
            name: el.getAttribute('data-scene'),
            top: isVertical ? bounding.top + scrollOffset : bounding.top,
            bottom: isVertical ? bounding.bottom + scrollOffset : bounding.bottom,
            left: isVertical ? bounding.left : bounding.left + scrollOffset,
            right: isVertical ? bounding.right : bounding.right + scrollOffset,
            size: isVertical ? bounding.height : bounding.width,
            trigger: el.getAttribute('data-trigger') || _this2.options.scenes.trigger,
            inView: false,
            progress: 0
          };

          // Do custom things for scenes
          if (_this2.options.scenes[cache.name]) {
            var getCache = _this2.options.scenes[cache.name].getCache;
            if (getCache) {
              var extend = getCache.call(_this2, { cache: cache, state: rollyState });
              cache = _extends({}, cache, extend);
            }
          }

          _this2.state.cache.push(cache);
        });

        _this2.state.caching = false;
        resolve();
      });
    }

    /*
    ** Checkers
    */

    /**
     * Check if the scene is into the viewport.
     * @param {number} current - The current scroll position.
     * @param {number} rollySize - The size of the context element.
     * @param {object} cache - The cache of the scene.
     * @return {boolean} The result.
     */

  }, {
    key: 'checkInView',
    value: function checkInView(current, rollySize, cache) {
      var vertical = this.options.direction === 'vertical';
      var top = cache.top,
          right = cache.right,
          bottom = cache.bottom,
          left = cache.left,
          size = cache.size;


      var start = Math.round((vertical ? top : left) - current);
      var end = Math.round((vertical ? bottom : right) - current);
      return end > 0 && start < rollySize;
    }
    /*
    const top = Math.round(cache.top - current);
    const bottom = Math.round(cache.bottom - current);
    return bottom > 0 && top < height;
     */

    /**
     * Check if the trigger met the scene.
     * @param {boolean} active - Whether the scene is active.
     * @param {number} progress - The progress position of the scene related
     * to the trigger
     * @return {boolean} The result.
     */

  }, {
    key: 'checkEnter',
    value: function checkEnter(active, progress) {
      return !active && progress >= 0 && progress <= 1;
    }

    /**
     * Check if the trigger left the scene.
     * @param {boolean} active - Whether the scene is active.
     * @param {number} progress - The progress position of the scene related
     * to the trigger
     * @return {boolean} The result.
     */

  }, {
    key: 'checkLeave',
    value: function checkLeave(active, progress) {
      return active && progress === -1;
    }
  }]);
  return Scenes;
}();

// Bad perfs in firefox?
// Take a look at this ;)
// https://bugzilla.mozilla.org/show_bug.cgi?id=1427177

var Rolly = function () {
  /*
  ** Public methods
  */

  /**
   * The constructor.
   * @constructor
   * @param {object} options - Options of Rolly.
   */
  function Rolly() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, Rolly);

    this.boundFns = privated.getBoundFns.call(this);

    // Extend default options
    this.options = privated.extendOptions.call(this, options);

    this.transformPrefix = prefix('transform');

    this.DOM = {
      listener: this.options.listener,
      section: this.options.section
    };

    if (this.options.parallax) {
      this.parallax = new Parallax(this.DOM.section, this.options);
    }

    if (this.options.scenes) {
      this.scenes = new Scenes(this.DOM.section, this.options);
    }
  }

  /**
   * Initialize the Rolly instance.
   * - add DOM classes,
   * - create fake scroll bar or fake height depending on scroll type
   * (native|virtual),
   * - call {@link Rolly#on}.
   */


  createClass(Rolly, [{
    key: 'init',
    value: function init() {
      // Instantiate virtual scroll native option is falsy
      this.virtualScroll = this.options.native ? null : new VirtualScroll(this.options.virtualScroll);

      privated.initState.call(this);

      var type = this.options.native ? 'native' : 'virtual';
      var direction = this.options.direction === 'vertical' ? 'y' : 'x';

      this.DOM.listener.classList.add('is-' + type + '-scroll');
      this.DOM.listener.classList.add(direction + '-scroll');
      this.DOM.section.classList.add('rolly-section');

      this.options.preload && privated.preloadImages.call(this, this.boundFns.resize);
      this.options.native ? privated.addFakeScrollHeight.call(this) : !this.options.noSrollbar && privated.addFakeScrollBar.call(this);

      this.on();
    }

    /**
     * Enable the Rolly instance.
     * - start listening events (scroll and resize),
     * - request an animation frame if {@param rAF} is truthy.
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

      rAF && privated.rAF.call(this);

      privated.resize.call(this);
      window.addEventListener('resize', this.boundFns.resize);
    }

    /**
     * Disable the Rolly instance.
     * - stop listening events (scroll and resize),
     * - canceled any requested animation frame if {@param cAF} is truthy.
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

      cAF && privated.cAF.call(this);

      window.removeEventListener('resize', this.boundFns.resize);
    }

    /**
     * Destroy the Rolly instance.
     * - remove DOM classes,
     * - remove fake scroll bar or fake height depending on scroll type
     * (native|virtual),
     * - call {@link Rolly#off}.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      var type = this.options.native ? 'native' : 'virtual';
      var direction = this.options.direction === 'vertical' ? 'y' : 'x';

      this.DOM.listener.classList.remove('is-' + type + '-scroll');
      this.DOM.listener.classList.remove(direction + '-scroll');
      this.DOM.section.classList.remove('rolly-section');

      this.options.native ? privated.removeFakeScrollHeight.call(this) : !this.options.noSrollbar && privated.removeFakeScrollBar.call(this);

      // this.state.current = 0;

      this.virtualScroll && (this.virtualScroll.destroy(), this.virtualScroll = null);

      this.off();
    }

    /**
     * Reload the Rolly instance with new options.
     * @param {object} options - Options of Rolly.
     */

  }, {
    key: 'reload',
    value: function reload() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.destroy();

      this.boundFns = privated.getBoundFns.call(this);

      // Extend default options
      this.options = privated.extendOptions.call(this, options);

      this.DOM = {
        listener: this.options.listener,
        section: this.options.section
      };

      this.parallax && this.parallax.reload(options);
      this.scenes && this.scenes.reload(options);

      this.init();
    }

    /**
     * Scroll to a target (number|DOM element).
     * @param {number|object} target - The target to scroll.
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

      var isVertical = this.options.direction === 'vertical';
      var scrollOffset = this.state.current;
      var bounding = null;
      var newPos = scrollOffset + options.offset;

      if (typeof target === 'string') {
        target = document.querySelector(target);
      }

      switch (typeof target === 'undefined' ? 'undefined' : _typeof(target)) {
        case 'number':
          newPos = target;
          break;

        case 'object':
          if (!target) return;
          bounding = target.getBoundingClientRect();
          newPos += isVertical ? bounding.top : bounding.left;
          break;
      }

      switch (options.position) {
        case 'center':
          newPos -= isVertical ? this.state.height / 2 : this.state.width / 2;
          break;

        case 'end':
          newPos -= isVertical ? this.state.height : this.state.width;
          break;
      }

      if (options.callback) {
        this.state.scrollTo.callback = options.callback;
      }

      if (this.options.native) {
        this.options.direction === 'vertical' ? window.scrollTo(0, newPos) : window.scrollTo(newPos, 0);
      } else {
        privated.setTarget.call(this, newPos);
      }
    }

    /**
     * Update the states and re-setup all the cache of the Rolly instance.
     * Usefull if the width/height of the section has changed.
     * - call {@link Rolly#resize}.
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
   * Get all functions that needs to be bound with the Rolly's scope
   */
  getBoundFns: function getBoundFns() {
    var _this = this;

    var fns = {};
    ['resize', 'debounceScroll', 'virtualScroll', 'calcScroll', 'mouseDown', 'mouseMove', 'mouseUp'].map(function (fn) {
      return fns[fn] = privated[fn].bind(_this);
    });
    return fns;
  },


  /**
   * Initialize the state of the Rolly instance.
   */
  initState: function initState() {
    this.state = {
      // Global states
      current: 0,
      previous: 0,
      target: 0,
      width: window.innerWidht,
      height: window.innerHeight,
      bounding: 0,

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

      // Virtual scroll
      scrollbar: null
    };
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

    // If diff between target and current states is < 0.1,
    // stop running animation
    if (Math.abs(diff) < 0.1) {
      privated.cAF.call(this);
      delta = 0;
      this.state.current = this.state.target;
    } else {
      this.state.current += delta;
    }

    var exportedState = utils.exportState(this.state);

    if (Math.abs(diff) < 10 && this.state.scrollTo.callback) {
      this.state.scrollTo.callback(exportedState);
      this.state.scrollTo.callback = null;
    }

    // Set section position
    this.DOM.section.style[this.transformPrefix] = utils.getCSSTransform(-this.state.current, this.options.direction);

    // Set scrollbar thumb position
    if (!this.options.native && !this.options.noScrollbar) {
      var size = this.state.scrollbar.thumb.size;
      var bounds = this.options.direction === 'vertical' ? this.state.height : this.state.width;
      var value = Math.abs(this.state.current) / (this.state.bounding / (bounds - size)) + size / 0.5 - size;
      var clamp = Math.max(0, Math.min(value - size, value + size));
      this.DOM.scrollbarThumb.style[this.transformPrefix] = utils.getCSSTransform(clamp.toFixed(2), this.options.direction);
    }

    // Call custom run
    if (this.options.run) {
      this.options.run(exportedState);
    }

    // Parallax elements
    this.parallax && this.parallax.run(exportedState);

    // Scenes
    this.scenes && this.scenes.run(exportedState);

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


  /**
   * Calculate the target from scroll bar.
   * @param {object} e - The event data.
   */
  calcScroll: function calcScroll(e) {
    var client = this.options.direction == 'vertical' ? e.clientY : e.clientX;
    var bounds = this.options.direction == 'vertical' ? this.state.height : this.state.width;
    var delta = client * (this.state.bounding / bounds);

    privated.setTarget.call(this, delta);
    this.DOM.scrollbar && (this.state.scrollbar.thumb.delta = delta);
  },


  /*
  ** Events
  */

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
    var _this2 = this;

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
      _this2.state.debounceScroll.tick = false;
      _this2.DOM.listener.classList.remove('is-scrolling');
    }, 200);
  },


  /**
   * Resize event callback.
   * @param {object} e - The event data.
   */
  resize: function resize(e) {
    var prop = this.options.direction === 'vertical' ? 'height' : 'width';
    this.state.height = window.innerHeight;
    this.state.width = window.innerWidth;

    // Calc bounding
    var bounding = this.DOM.section.getBoundingClientRect();
    this.state.bounding = this.options.direction === 'vertical' ? bounding.height - (this.options.native ? 0 : this.state.height) : bounding.right - (this.options.native ? 0 : this.state.width);

    // Set scrollbar thumb height (according to section height)
    if (!this.options.native && !this.options.noSrollbar) {
      if (this.state.bounding <= 0) {
        this.state.scrollbar.thumb.size = 0;
        this.DOM.scrollbar.classList.add('is-hidden');
      } else {
        this.DOM.scrollbar.classList.remove('is-hidden');
        var size = this.state.height * (this.state.height / (this.state.bounding + this.state.height));
        // console.log('size', size);
        // console.log(this.state);
        // console.log(bounding);
        this.DOM.scrollbarThumb.style[prop] = size + 'px';
        this.state.scrollbar.thumb.size = size;
      }
    } else if (this.options.native) {
      this.DOM.scroll.style[prop] = this.state.bounding + 'px';
    }

    !this.options.native && privated.setTarget.call(this, this.state.target);

    // Get cache for parallax elements
    this.parallax && this.parallax.cache(this.state);

    // Get cache for scenes
    this.scenes && this.scenes.cache(this.state);
  },


  /**
   * Mouse down event callback.
   * @param {object} e - The event data.
   */
  mouseDown: function mouseDown(e) {
    e.preventDefault();
    e.which === 1 && (this.state.scrollbar.clicked = true);
    this.DOM.listener.classList.add('is-dragging');
  },


  /**
   * Mouse move event callback.
   * @param {object} e - The event data.
   */
  mouseMove: function mouseMove(e) {
    this.state.scrollbar.clicked && privated.calcScroll.call(this, e);
  },


  /**
   * Mouse up event callback.
   * @param {object} e - The event data.
   */
  mouseUp: function mouseUp(e) {
    this.state.scrollbar.clicked = false;
    this.DOM.listener.classList.remove('is-dragging');
  },


  /*
  ** Utils
  */

  /**
   * Extend options.
   * @param {object} options - The options to extend.
   * @return {object} The extended options.
   */
  extendOptions: function extendOptions(options) {
    var opts = this.options ? this.options : privated.getOptions.call(this);
    options.virtualScroll = _extends({}, opts.virtualScroll, options.virtualScroll);
    options.parallax = _extends({}, opts.parallax, options.parallax);
    options.scenes = _extends({}, opts.scenes, options.scenes);

    return _extends({}, opts, options);
  },


  /**
   * Preload images in the section of the Rolly instance.
   * Useful if the section contains images that might not have fully loaded
   * when the instance is created (because when an image is loaded, the
   * total height changes).
   * @param {function} callback - The function to run when images are loaded.
   */
  preloadImages: function preloadImages(callback) {
    var images = [].concat(toConsumableArray(this.DOM.listener.querySelectorAll('img')));

    images.forEach(function (image) {
      var img = document.createElement('img');
      img.onload = function (_) {
        images.splice(images.indexOf(image), 1);
        images.length === 0 && callback && callback();
      };

      img.src = image.getAttribute('src');
    });
  },


  /**
   * Add a fake scroll height.
   */
  addFakeScrollHeight: function addFakeScrollHeight() {
    var scroll = document.createElement('div');
    scroll.className = 'rolly-scroll-view';
    this.DOM.scroll = scroll;
    this.DOM.listener.appendChild(this.DOM.scroll);
  },


  /**
   * Remove a fake scroll height.
   */
  removeFakeScrollHeight: function removeFakeScrollHeight() {
    this.DOM.listener.removeChild(this.DOM.scroll);
  },


  /**
   * Add a fake scroll bar.
   */
  addFakeScrollBar: function addFakeScrollBar() {
    var scrollbar = document.createElement('div');
    scrollbar.className = 'rolly-scrollbar rolly-' + this.options.direction;
    this.DOM.scrollbar = scrollbar;

    var scrollbarThumb = document.createElement('div');
    scrollbarThumb.className = 'rolly-scrollbar-thumb';
    this.DOM.scrollbarThumb = scrollbarThumb;

    this.state.scrollbar = {
      clicked: false,
      x: 0,
      thumb: { delta: 0, height: 50 }
    };

    this.DOM.listener.appendChild(this.DOM.scrollbar);
    this.DOM.scrollbar.appendChild(this.DOM.scrollbarThumb);

    this.DOM.scrollbar.addEventListener('click', this.boundFns.calcScroll);
    this.DOM.scrollbar.addEventListener('mousedown', this.boundFns.mouseDown);

    document.addEventListener('mousemove', this.boundFns.mouseMove);
    document.addEventListener('mouseup', this.boundFns.mouseUp);
  },


  /**
   * Remove the fake scroll bar.
   */
  removeFakeScrollBar: function removeFakeScrollBar() {
    this.DOM.scrollbar.removeEventListener('click', this.boundFns.calcScroll);
    this.DOM.scrollbar.removeEventListener('mousedown', this.boundFns.mouseDown);

    document.removeEventListener('mousemove', this.boundFns.mouseMove);
    document.removeEventListener('mouseup', this.boundFns.mouseUp);

    this.DOM.listener.removeChild(this.DOM.scrollbar);
  },


  /*
  ** Getters and setters
  */

  /**
   * Get the default options for the Rolly instance.
   * @return {object} The default options.
   */
  getOptions: function getOptions() {
    return {
      direction: 'vertical',
      native: false,
      noScrollbar: false,
      ease: 0.075,
      preload: false,
      virtualScroll: {
        limitInertia: false,
        mouseMultiplier: 0.5,
        touchMultiplier: 1.5,
        firefoxMultiplier: 30,
        preventTouch: true
      },
      listener: document.body,
      section: document.querySelector('.rolly-section') || null,
      parallax: {
        selector: '[data-parallax]'
      },
      scenes: {
        selector: '[data-scene]',
        trigger: 'middle'
      },
      run: null
    };
  },


  /**
   * Get the node element on which will be attached the scroll event
   * listener (in case of native behavior).
   * @return {object} The node element.
   */
  getNodeListener: function getNodeListener() {
    return this.DOM.listener === document.body ? window : this.DOM.listener;
  },


  /**
   * Set the target position with auto clamping.
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
