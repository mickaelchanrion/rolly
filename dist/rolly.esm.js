/*!
    * rolly.js v0.4.0
    * (c) 2020 Mickael Chanrion
    * Released under the MIT license
    */
  
import VirtualScroll from 'virtual-scroll';
import prefix from 'prefix';

var utils = {
  getCSSTransform: function getCSSTransform(value, vertical) {
    return vertical
      ? ("translate3d(0, " + value + "px, 0)")
      : ("translate3d(" + value + "px, 0, 0)");
  },

  getElements: function getElements(selector, context) {
    if ( context === void 0 ) context = document;

    return Array.from(context.querySelectorAll(selector));
  },
};

function objectWithoutProperties (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

var Scene = function Scene(context, options) {
  this.options = options;

  this.state = {
    caching: false,
    cache: null,
    inView: false,
    active: false,
    progress: 0,
    progressInView: 0,
  };

  this.DOM = { context: context };
};

/**
 * A promise to get cache for the scene.
 * The default cache object is as follow:
 * - context: the DOM element of the scene.
 * - type: the type of the scene.
 * - top: distance between the top of the view and the top of the scene at the initial state.
 * - bottom: distance between the top of the view and the bottom of the scene at the initial
 * state.
 * - left: distance between the left of the view and the left of the scene at the initial state.
 * - right: distance between the left of the view and the right of the scene at the initial state.
 * - size: height of the scene (or width on horizontal mode).
 * - speed: the speed of the scene.
 * - trigger: the trigger position (e.g.: 'middle', 'bottom', '100px', '10%').
 *
 * The cache of the scene is extendable by providing a method in options: `options.scenes.${sceneType}.cache`.
 * This method gives an object that contains:
 * - cache: the computed cache so far.
 * - state: the state of the scene.
 * - globalState: the state of the rolly instance
 * Simply return new properties in an object to extend the cache.
 *
 * @param {object} globalState - The state of the rolly instance.
 */
Scene.prototype.cache = function cache (globalState) {
    var this$1 = this;

  return new Promise(function (resolve, reject) {
    this$1.state.caching = true;

    var ref = this$1.options;
      var vertical = ref.vertical;
    // TODO: see when we need this
    // const scrollOffset = globalState.target;
    var scrollOffset = 0;

    var viewSize = vertical ? globalState.height : globalState.width;

    var ref$1 = this$1.DOM;
      var context = ref$1.context;
    context.style.display = null;
    var computedStyle = window.getComputedStyle(context);
    if (computedStyle.display === 'none') {
      this$1.state.cache = null;
      resolve(this$1.state.cache);
    }

    if (computedStyle.display === 'inline') {
      context.style.display = 'block';
    }

    context.style[globalState.transformPrefix] = null;

    var bounding = context.getBoundingClientRect();

    var type = context.getAttribute('data-scene');

    var options = this$1.options.scenes;
    var sceneOptions = options[type] || {};

    var cache = {
      context: context,
      type: type,
      top: vertical ? bounding.top + scrollOffset : bounding.top,
      bottom: vertical ? bounding.bottom + scrollOffset : bounding.bottom,
      left: vertical ? bounding.left : bounding.left + scrollOffset,
      right: vertical ? bounding.right : bounding.right + scrollOffset,
      size: vertical ? bounding.height : bounding.width,
      speed:
        parseFloat(context.getAttribute('data-speed'))
        || sceneOptions.speed
        || options.speed,
      trigger:
        context.getAttribute('data-trigger')
        || sceneOptions.trigger
        || options.trigger,
    };

    var trigger = cache.trigger;

    var triggerOffset = 0;
    if (trigger === 'middle') { triggerOffset = viewSize / 2; }
    else if (trigger === 'end') { triggerOffset = viewSize; }
    // px from top
    else if (trigger.slice(-2) === 'px') { triggerOffset = parseFloat(trigger); }
    // percentage
    else if (trigger.slice(-1) === '%') {
      triggerOffset = (viewSize * parseFloat(trigger)) / 100;
    }

    cache.triggerOffset = triggerOffset;

    var start = vertical
      ? cache.top + cache.size / 2 - globalState.height / 2
      : cache.left + cache.size / 2 - globalState.width / 2;
    cache.offset = start - start * cache.speed;

    // Cache for custom scenes
    var getCache = sceneOptions.cache || options.cache;
    if (getCache) {
      if (getCache) {
        var extendedCache = getCache.call(this$1, {
          cache: cache,
          globalState: globalState,
          sceneState: this$1.state,
        });

        cache = Object.assign({}, cache, extendedCache);
      }
    }

    this$1.state.cache = cache;
    this$1.state.caching = false;
    resolve(this$1.state.cache);
  });
};

/**
 * Animation frame callback (called at every frames).
 * @param {object} globalState - The state of the rolly instance.
 */
Scene.prototype.change = function change (globalState) {
  if (!this.state.cache || this.state.caching) { return false; }

  var viewSize = this.options.vertical
    ? globalState.height
    : globalState.width;
  var ref = this.state;
    var cache = ref.cache;
    var active = ref.active;

  var ref$1 = this.calc(globalState);
    var inView = ref$1.inView;
    var transform = ref$1.transform;
    var start = ref$1.start;
  this.state.progress = this.getProgress(transform);
  this.state.progressInView = this.getProgressInView(start, viewSize);

  var ref$2 = this.options.scenes;
    var sceneOptions = ref$2[cache.type];
    var rest = objectWithoutProperties( ref$2, [cache.type] );
    var options = rest; // eslint-disable-line prefer-const

  if (!sceneOptions) {
    sceneOptions = {};
  }

  // The data we send to every custom functions
  var data = { globalState: globalState, sceneState: this.state, transform: transform };

  // Check if inView value changed
  if (this.state.inView !== inView) {
    // Trigger appear/disappear callbacks
    var action = inView ? 'appear' : 'disappear';
    if (sceneOptions[action]) { sceneOptions[action].call(this, data); }
    else if (options[action]) { options[action].call(this, data); }

    this.state.inView = inView;
  }

  // Check and then trigger callbacks
  if (inView) {
    this.DOM.context.style.willChange = 'transform';

    // Run
    if (sceneOptions.change) { sceneOptions.change.call(this, data); }
    else if (options.change) { options.change.call(this, data); }

    // Enter
    if (this.checkEnter(active, this.state.progress)) {
      this.state.active = true;
      if (sceneOptions.enter) {
        sceneOptions.enter.call(this, data);
      } else if (options.enter) {
        options.enter.call(this, data);
      }
    } else if (this.checkLeave(active, this.state.progress)) {
      // Leave
      this.state.active = false;
      if (sceneOptions.leave) {
        sceneOptions.leave.call(this, data);
      } else if (options.leave) {
        options.leave.call(this, data);
      }
    }

    // Transform
    if (sceneOptions.transform) { sceneOptions.transform.call(this, data); }
    else if (options.transform) { options.transform.call(this, data); }
    else {
      this.DOM.context.style[
        globalState.transformPrefix
      ] = utils.getCSSTransform(transform, this.options.vertical);
    }
  } else {
    this.DOM.context.style[
      globalState.transformPrefix
    ] = utils.getCSSTransform(Math.max(globalState.bounding, viewSize + 50), this.options.vertical);
    this.DOM.context.style.willChange = null;
  }

  return true;
};

/**
 * Computes useful values for the scene.
 * @param {object} globalState - The state of the rolly instance
 * @return {object} Values as follow:
 * - transform: the transform value according to the speed
 * - start: distance between the start position of the view and the start position of the scene context (top|left)
 * - end: distance between the end position of the view and the end position of the scene context (bottom|right)
 * - inView: whether the scene is in the viewport
 */
Scene.prototype.calc = function calc (globalState) {
  var ref = this.options;
    var vertical = ref.vertical;
  var ref$1 = this.state.cache;
    var top = ref$1.top;
    var right = ref$1.right;
    var bottom = ref$1.bottom;
    var left = ref$1.left;
    var speed = ref$1.speed;
    var offset = ref$1.offset;
  var width = globalState.width;
    var height = globalState.height;
    var current = globalState.current;

  var transform = current * -speed - offset;

  var start = Math.round((vertical ? top : left) + transform);
  var end = Math.round((vertical ? bottom : right) + transform);
  var inView = end > 0 && start < (vertical ? height : width);

  return {
    transform: transform, start: start, end: end, inView: inView,
  };
};

/**
 * Gets the progress of the scene in relation to its trigger (default trigger position is 'middle').
 * @param {number} transform - The transform position of the scene.
 * @return {number} The progress position.
 */
Scene.prototype.getProgress = function getProgress (transform) {
  var ref = this.options;
    var vertical = ref.vertical;
  var ref$1 = this.state;
    var cache = ref$1.cache;
  var triggerOffset = cache.triggerOffset;

  var position = -transform + triggerOffset;

  var progress = (position - (vertical ? cache.top : cache.left)) / cache.size;

  if (progress < 0 || progress > 1) { return -1; }
  return progress;
};

/**
 * Gets the progress of the scene in relation to the viewport.
 * @param {number} start - The distance between the start position of the view and the start.
 * @param {*} viewSize - The size of the view.
 */
Scene.prototype.getProgressInView = function getProgressInView (start, viewSize) {
  return (viewSize - start) / (viewSize + this.state.cache.size);
};

/**
 * Checks if the trigger met the scene.
 * @param {boolean} active - Whether the scene is active.
 * @param {number} progress - The progress position of the scene related to the trigger
 * @return {boolean} The result.
 */
Scene.prototype.checkEnter = function checkEnter (active, progress) {
  return !active && progress >= 0 && progress <= 1;
};

/**
 * Checks if the trigger left the scene.
 * @param {boolean} active - Whether the scene is active.
 * @param {number} progress - The progress position of the scene related to the trigger
 * @return {boolean} The result.
 */
Scene.prototype.checkLeave = function checkLeave (active, progress) {
  return active && progress === -1;
};

var ScrollBar = function ScrollBar(parent, globalState, setTarget, options) {
  this.options = options;

  this.DOM = this.render(parent);

  this.state = {
    clicked: false,
    thumb: { size: 0 },
  };

  this.cache(globalState);

  this.setTarget = setTarget;
};

var prototypeAccessors = { thumbSize: { configurable: true } };

/**
 * Sets cache for scroll bar.
 * @param {object} globalState - The state of the rolly instance.
 */
ScrollBar.prototype.cache = function cache (globalState) {
  this.state.cache = {
    bounding: globalState.bounding,
    viewSize: this.options.vertical ? globalState.height : globalState.width,
  };
  this.updateThumbSize();
};

/**
 * Animation frame callback (called at every frames).
 * @param {object} globalState - The state of the rolly instance.
 */
ScrollBar.prototype.change = function change (ref) {
    var current = ref.current;
    var transformPrefix = ref.transformPrefix;

  var ref$1 = this.state.cache;
    var bounding = ref$1.bounding;
    var viewSize = ref$1.viewSize;
  var ref$2 = this;
    var thumbSize = ref$2.thumbSize;
  var value = Math.abs(current) / (bounding / (viewSize - thumbSize))
    + thumbSize / 0.5
    - thumbSize;

  var clamp = Math.max(0, Math.min(value - thumbSize, value + thumbSize));
  this.DOM.thumb.style[transformPrefix] = utils.getCSSTransform(
    clamp.toFixed(2),
    this.options.vertical
  );
};

/**
 * Computes the target value from the scroll bar (based on event client viewport position).
 * @param {number} client - The client position.
 * @return {number} The target.
 */
ScrollBar.prototype.calc = function calc (client) {
  return client * (this.state.cache.bounding / this.state.cache.viewSize);
};

/**
 * Renders the scroll bar.
 * @param {object} parent - The parent DOM of the scroll bar.
 * @return {object} - The list of DOM elements (parent, context, thumb).
 */
ScrollBar.prototype.render = function render (parent) {
  var context = document.createElement('div');
  var direction = this.options.vertical ? 'y' : 'x';
  context.className = "rolly-scroll-bar " + direction + "-scroll";

  var thumb = document.createElement('div');
  thumb.className = 'rolly-scroll-bar-thumb';

  context.appendChild(thumb);
  parent.appendChild(context);

  return { parent: parent, context: context, thumb: thumb };
};

/**
 * Starts listening events (mouse interactions).
 */
ScrollBar.prototype.on = function on () {
  this.boundFns = {
    click: this.click.bind(this),
    mouseDown: this.mouseDown.bind(this),
    mouseMove: this.mouseMove.bind(this),
    mouseUp: this.mouseUp.bind(this),
  };

  this.DOM.context.addEventListener('click', this.boundFns.click);
  this.DOM.context.addEventListener('mousedown', this.boundFns.mouseDown);

  document.addEventListener('mousemove', this.boundFns.mouseMove);
  document.addEventListener('mouseup', this.boundFns.mouseUp);
};

/**
 * Stops listening events (mouse interactions).
 */
ScrollBar.prototype.off = function off () {
  if (!this.boundFns) { return false; }
  this.DOM.context.removeEventListener('click', this.boundFns.click);
  this.DOM.context.removeEventListener('mousedown', this.boundFns.mouseDown);

  document.removeEventListener('mousemove', this.boundFns.mouseMove);
  document.removeEventListener('mouseup', this.boundFns.mouseUp);
  delete this.boundFns;
  return true;
};

/**
 * Click event callback.
 * @param {object} event - The event data.
 */
ScrollBar.prototype.click = function click (event) {
  var value = this.calc(this.options.vertical ? event.clientY : event.clientX);
  this.setTarget(value);
};

/**
 * Mouse down event callback.
 * @param {object} event - The event data.
 */
ScrollBar.prototype.mouseDown = function mouseDown (event) {
  event.preventDefault();
  if (event.which === 1) {
    this.state.clicked = true;
  }
  this.DOM.parent.classList.add('is-dragging-scroll-bar');
};

/**
 * Mouse move event callback.
 * @param {object} event - The event data.
 */
ScrollBar.prototype.mouseMove = function mouseMove (event) {
  if (this.state.clicked) {
    var value = this.calc(this.options.vertical ? event.clientY : event.clientX);
    this.setTarget(value);
  }
};

/**
 * Mouse up event callback.
 * @param {object} event - The event data.
 */
ScrollBar.prototype.mouseUp = function mouseUp (event) {
  this.state.clicked = false;
  this.DOM.parent.classList.remove('is-dragging-scroll-bar');
};

/**
 * Gets the size of the thumb (heigh or width on horizontal mode).
 * @return {number} - The size of the thumb.
 */
prototypeAccessors.thumbSize.get = function () {
  return this.state.thumb.size;
};

/**
 * Sets the size of the thumb (heigh or width on horizontal mode).
 * @param {number} - The size of the thumb.
 */
prototypeAccessors.thumbSize.set = function (size) {
  this.state.thumb.size = size;
  var prop = this.options.vertical ? 'height' : 'width';
  this.DOM.thumb.style[prop] = size + "px";
};

/**
 * Updates the size of the thumb.
 * This method is called when the content changes or on a resize for instance.
 */
ScrollBar.prototype.updateThumbSize = function updateThumbSize () {
  var ref = this.state.cache;
    var bounding = ref.bounding;
  if (bounding <= 0) {
    this.DOM.context.classList.add('is-hidden');
    this.thumbSize = 0;
    return;
  }

  this.DOM.context.classList.remove('is-hidden');
  var ref$1 = this.state.cache;
    var viewSize = ref$1.viewSize;
  this.thumbSize = viewSize * (viewSize / (bounding + viewSize));
};

/**
 * Destroy the scroll bar.
 * - removes from the DOM.
 * - calls {@link ScrollBar#off}.
 */
ScrollBar.prototype.destroy = function destroy () {
  this.off();
  this.DOM.parent.removeChild(this.DOM.context);
};

Object.defineProperties( ScrollBar.prototype, prototypeAccessors );

/*
 ** Private methods
 */
var privated = {
  /**
   * Gets all functions that needs to be bound with the rolly's scope
   */
  getBoundFns: function getBoundFns() {
    var this$1 = this;

    var fns = {};
    ['resize', 'debounceScroll', 'virtualScroll'].map(
      function (fn) { return (fns[fn] = privated[fn].bind(this$1)); } // eslint-disable-line no-return-assign
    );
    return fns;
  },

  /**
   * Initializes the state of the rolly instance.
   */
  initState: function initState() {
    this.state = {
      current: 0,
      previous: 0,
      target: null,
      width: window.innerWidth,
      height: window.innerHeight,
      bounding: 0,
      ready: false,
      preLoaded: false,
      changing: false,
      // The transform property to use
      transformPrefix: prefix('transform'),
    };

    this.privateState = {
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

      scrollTo: {},
    };
  },

  /**
   * Initializes scenes
   */
  initScenes: function initScenes() {
    var this$1 = this;

    this.scenes = [];

    utils
      .getElements(this.options.scenes.selector, this.DOM.view)
      .forEach(function (scene) { return this$1.scenes.push(new Scene(scene, this$1.options)); });
  },

  /*
   ** Animation frame methods
   */

  /**
   * Animation frame callback (called at every frames).
   * Automatically stops when |target - current| < 0.1.
   */
  change: function change() {
    var this$1 = this;

    if (this.privateState.isRAFCanceled) { return; }
    privated.rAF.call(this);

    var diff = this.state.target - this.state.current;
    var delta = diff * this.options.ease;

    // If diff between target and current states is < 0.1, stop running animation
    if (Math.abs(diff) < 0.1) {
      privated.cAF.call(this);
      delta = 0;
      this.state.current = this.state.target;
      if (this.state.changing) {
        this.state.changing = false;
        this.options.changeEnd(this.state);
      }
    } else {
      this.state.current += delta;
      if (!this.state.changing) {
        this.state.changing = true;
        this.options.changeStart(this.state);
      }
    }

    if (Math.abs(diff) < 10 && this.privateState.scrollTo.callback) {
      this.privateState.scrollTo.callback(this.state);
      this.privateState.scrollTo.callback = null;
    }

    // Set scroll bar thumb position
    if (this.scrollBar) {
      this.scrollBar.change(this.state);
    }

    // Call custom change
    this.options.change(this.state);

    this.scenes.forEach(function (scene) { return scene.change(this$1.state); });

    this.state.previous = this.state.current;
  },

  /**
   * Request an animation frame.
   */
  rAF: function rAF() {
    this.privateState.isRAFCanceled = false;
    this.privateState.rAF = requestAnimationFrame(privated.change.bind(this));
  },

  /**
   * Cancel a requested animation frame.
   */
  cAF: function cAF() {
    this.privateState.isRAFCanceled = true;
    this.privateState.rAF = cancelAnimationFrame(this.privateState.rAF);
  },

  /*
   ** Events
   */

  /**
   * Checks if rolly is ready.
   */
  ready: function ready() {
    if (
      this.state.ready
      && (this.options.preload ? this.state.preLoaded : true)
    ) {
      this.options.ready(this.state);
      return true;
    }
    return false;
  },

  /**
   * Virtual scroll event callback.
   * @param {object} e - The event data.
   */
  virtualScroll: function virtualScroll(e) {
    if (this.privateState.scrollTo.callback) { return; }
    var delta = this.options.vertical ? e.deltaY : e.deltaX;
    privated.setTarget.call(this, this.state.target + delta * -1);
  },

  /**
   * Native scroll event callback.
   * @param {object} e - The event data.
   */
  debounceScroll: function debounceScroll(e) {
    var this$1 = this;

    if (this.privateState.scrollTo.callback) { return; }
    var isWindow = this.DOM.listener === document.body;

    var target;

    if (this.options.vertical) {
      target = isWindow
        ? window.scrollY || window.pageYOffset
        : this.DOM.listener.scrollTop;
    } else {
      target = isWindow
        ? window.scrollX || window.pageXOffset
        : this.DOM.listener.scrollLeft;
    }

    privated.setTarget.call(this, target);

    clearTimeout(this.privateState.debounceScroll.timer);

    if (!this.privateState.debounceScroll.tick) {
      this.privateState.debounceScroll.tick = true;
      this.DOM.listener.classList.add('is-scrolling');
    }

    this.privateState.debounceScroll.timer = setTimeout(function () {
      this$1.privateState.debounceScroll.tick = false;
      this$1.DOM.listener.classList.remove('is-scrolling');
    }, 200);
  },

  /**
   * Resize event callback.
   * @param {object} e - The event data.
   */
  resize: function resize(e) {
    var this$1 = this;

    var prop = this.options.vertical ? 'height' : 'width';
    this.state.height = window.innerHeight;
    this.state.width = window.innerWidth;

    // Calc bounding
    var ref = this.options;
    var native = ref.native;
    var vertical = ref.vertical;
    var bounding = this.DOM.view.getBoundingClientRect();
    this.state.bounding = vertical
      ? bounding.height - (native ? 0 : this.state.height)
      : bounding.right - (native ? 0 : this.state.width);

    // Set scroll bar thumb height (according to view height)
    if (this.scrollBar) {
      this.scrollBar.cache(this.state);
    } else if (native) {
      this.DOM.scroll.style[prop] = (this.state.bounding) + "px";
    }

    privated.setTarget.call(this, this.state.target);

    // Get cache for scenes
    this.scenes.forEach(function (scene) { return scene.cache(this$1.state); });
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
    options.virtualScroll = Object.assign({}, opts.virtualScroll, options.virtualScroll);
    options.scenes = Object.assign({}, opts.scenes, options.scenes);

    return Object.assign({}, opts, options);
  },

  /**
   * Preload images in the view of the rolly instance.
   * Useful if the view contains images that might not have fully loaded when the instance is created (because when an
   * image is loaded, the total height changes).
   * @param {function} callback - The function to run when images are loaded.
   */
  preloadImages: function preloadImages(callback) {
    var images = utils.getElements('img', this.DOM.listener);

    if (!images.length) {
      if (callback) { callback(); }
      return;
    }

    images.forEach(function (image) {
      var img = document.createElement('img');
      img.onload = function () {
        images.splice(images.indexOf(image), 1);
        if (images.length === 0) { callback(); }
      };

      img.src = image.currentSrc || image.src;
    });
  },

  /**
   * Adds a fake scroll height.
   */
  addFakeScrollHeight: function addFakeScrollHeight() {
    var scroll = document.createElement('div');
    scroll.className = 'rolly-scroll-view';
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
    this.scrollBar = new ScrollBar(
      this.DOM.listener,
      this.state,
      privated.setTarget.bind(this),
      this.options
    );
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
      vertical: true,
      listener: document.body,
      view: utils.getElements('.rolly-view')[0] || null,
      native: true,
      preload: true,
      autoUpdate: true,
      ready: function () { },
      change: function () { },
      changeStart: function () { },
      changeEnd: function () { },
      ease: 0.075,
      virtualScroll: {
        limitInertia: false,
        mouseMultiplier: 0.5,
        touchMultiplier: 1.5,
        firefoxMultiplier: 30,
        preventTouch: true,
      },
      noScrollBar: false,
      scenes: {
        selector: '[data-scene]',
        speed: 1,
        trigger: 'middle',
      },
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
    // if (target === null) return;
    this.state.target = Math.round(
      Math.max(0, Math.min(target, this.state.bounding))
    );
    !this.privateState.rAF && privated.rAF.call(this);
  },
};

var Rolly = function Rolly(options) {
  if ( options === void 0 ) options = {};

  this.boundFns = privated.getBoundFns.call(this);

  // Extend default options
  this.options = privated.extendOptions.call(this, options);

  this.DOM = {
    listener: this.options.listener,
    view: this.options.view,
  };

  privated.initScenes.call(this);
};

/**
 * Initializes the rolly instance.
 * - adds DOM classes.
 * - if native, adds fake height.
 * - else if `options.noScrollBar` is false, adds a fake scroll bar.
 * - calls {@link Rolly#on}.
 */
Rolly.prototype.init = function init () {
    var this$1 = this;

  // Instantiate virtual scroll native option is false
  this.virtualScroll = this.options.native
    ? null
    : new VirtualScroll(this.options.virtualScroll);

  privated.initState.call(this);

  var type = this.options.native ? 'native' : 'virtual';
  var direction = this.options.vertical ? 'y' : 'x';

  this.DOM.listener.classList.add(("is-" + type + "-scroll"));
  this.DOM.listener.classList.add((direction + "-scroll"));
  this.DOM.view.classList.add('rolly-view');

  this.options.native
    ? privated.addFakeScrollHeight.call(this)
    : !this.options.noScrollBar && privated.addFakeScrollBar.call(this);

  if (this.options.preload) {
    privated.preloadImages.call(this, function () {
      this$1.state.preLoaded = true;
      this$1.boundFns.resize();
      privated.ready.call(this$1);
    });
  }

  this.on();
};

/**
 * Enables the rolly instance.
 * - starts listening events (scroll and resize),
 * - requests an animation frame if {@param rAF} is true.
 * @param {boolean} rAF - whether to request an animation frame.
 */
Rolly.prototype.on = function on (rAF) {
    if ( rAF === void 0 ) rAF = true;

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
  if (this.options.autoUpdate) {
    window.addEventListener('resize', this.boundFns.resize);
  }

  this.state.ready = true;
  privated.ready.call(this);
};

/**
 * Disables the rolly instance.
 * - stops listening events (scroll and resize),
 * - cancels any requested animation frame if {@param cAF} is true.
 * @param {boolean} cAF - whether to cancel a requested animation frame.
 */
Rolly.prototype.off = function off (cAF) {
    if ( cAF === void 0 ) cAF = true;

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

  if (this.options.autoUpdate) {
    window.removeEventListener('resize', this.boundFns.resize);
  }
  this.state.ready = false;
};

/**
 * Destroys the rolly instance.
 * - removes DOM classes.
 * - if native, removes the fake height for scroll.
 * - else if `options.noScrollBar` is false, removes the fake scroll bar.
 * - calls {@link Rolly#off}.
 */
Rolly.prototype.destroy = function destroy () {
  var type = this.options.native ? 'native' : 'virtual';
  var direction = this.options.vertical ? 'y' : 'x';

  this.DOM.listener.classList.remove(("is-" + type + "-scroll"));
  this.DOM.listener.classList.remove((direction + "-scroll"));
  this.DOM.view.classList.remove('rolly-view');

  if (this.virtualScroll) {
    this.virtualScroll.destroy();
    this.virtualScroll = null;
  }

  this.off();

  this.options.native
    ? privated.removeFakeScrollHeight.call(this)
    : !this.options.noScrollBar && privated.removeFakeScrollBar.call(this);
};

/**
 * Reloads the rolly instance with new options.
 * @param {object} options - Options of rolly.
 */
Rolly.prototype.reload = function reload (options) {
    if ( options === void 0 ) options = this.options;

  this.destroy();

  this.boundFns = privated.getBoundFns.call(this);

  // Extend default options
  this.options = privated.extendOptions.call(this, options);

  var ref = this;
    var DOM = ref.DOM;
  this.DOM = Object.assign({}, DOM,
    {listener: this.options.listener,
    view: this.options.view});

  privated.initScenes.call(this);

  this.init();
};

/**
 * Scrolls to a target (number|DOM element).
 * @param {number|object} target - The target to scroll to.
 * @param {object} options - Options.
 */
Rolly.prototype.scrollTo = function scrollTo (target, options) {
    var assign;

  var defaultOptions = {
    offset: 0,
    position: 'start',
    callback: null,
  };
  options = Object.assign({}, defaultOptions, options);

  var ref = this.options;
    var vertical = ref.vertical;
  var scrollOffset = this.state.current;
  var bounding = null;
  var newPos = scrollOffset + options.offset;

  if (typeof target === 'string') {
    (assign = utils.getElements(target), target = assign[0]);
  }

  switch (typeof target) {
    case 'number':
    default:
      newPos = target;
      break;

    case 'object':
      if (!target) { return; }
      bounding = target.getBoundingClientRect();
      newPos += vertical ? bounding.top : bounding.left;
      break;
  }

  switch (options.position) {
    case 'center':
    default:
      newPos -= vertical ? this.state.height / 2 : this.state.width / 2;
      break;

    case 'end':
      newPos -= vertical ? this.state.height : this.state.width;
      break;
  }

  if (options.callback) {
    this.privateState.scrollTo.callback = options.callback;
  }

  // FIXME: if the scrollable element is not the body, this won't work
  if (this.options.native) {
    this.options.vertical
      ? window.scrollTo(0, newPos)
      : window.scrollTo(newPos, 0);
  } else {
    privated.setTarget.call(this, newPos);
  }
};

/**
 * Updates the states and re-setup all the cache of the rolly instance.
 * Useful if the width/height of the view changed.
 * - calls {@link Rolly#resize}.
 */
Rolly.prototype.update = function update () {
  privated.resize.call(this);
};

var rolly = function (options) { return new Rolly(options); };

export default rolly;
