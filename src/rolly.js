import VirtualScroll from 'virtual-scroll';
import prefix from 'prefix';

import utils from './utils';
import Scene from './Scene';
import ScrollBar from './ScrollBar';

/*
 ** Private methods
 */
const privated = {
  /**
   * Gets all functions that needs to be bound with the rolly's scope
   */
  getBoundFns() {
    const fns = {};
    ['resize', 'debounceScroll', 'virtualScroll'].map(
      fn => (fns[fn] = privated[fn].bind(this)), // eslint-disable-line no-return-assign
    );
    return fns;
  },

  /**
   * Initializes the state of the rolly instance.
   */
  initState() {
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
      transformPrefix: prefix('transform'),
    };
  },

  /**
   * Initializes scenes
   */
  initScenes() {
    this.scenes = [];

    utils
      .getElements(this.options.scenes.selector, this.DOM.view)
      .forEach(scene => this.scenes.push(new Scene(scene, this.options)));
  },

  /*
   ** Animation frame methods
   */

  /**
   * Animation frame callback (called at every frames).
   * Automatically stops when |target - current| < 0.1.
   */
  change() {
    if (this.state.isRAFCanceled) return;
    privated.rAF.call(this);

    const diff = this.state.target - this.state.current;
    let delta = diff * this.options.ease;

    // If diff between target and current states is < 0.1, stop running animation
    if (Math.abs(diff) < 0.1) {
      privated.cAF.call(this);
      delta = 0;
      this.state.current = this.state.target;
    } else {
      this.state.current += delta;
    }

    const exportedState = utils.exportState(this.state, [
      'current',
      'previous',
      'target',
      'width',
      'height',
      'bounding',
      'ready',
      'preLoaded',
      'transformPrefix',
    ]);

    if (Math.abs(diff) < 10 && this.state.scrollTo.callback) {
      this.state.scrollTo.callback(exportedState);
      this.state.scrollTo.callback = null;
    }

    // Set scroll bar thumb position
    if (this.scrollBar) {
      this.scrollBar.change(this.state);
    }

    // Call custom change
    if (this.options.change) {
      this.options.change(exportedState);
    }

    this.scenes.forEach(scene => scene.change(exportedState));

    this.state.previous = this.state.current;
  },

  /**
   * Request an animation frame.
   */
  rAF() {
    this.state.isRAFCanceled = false;
    this.state.rAF = requestAnimationFrame(privated.change.bind(this));
  },

  /**
   * Cancel a requested animation frame.
   */
  cAF() {
    this.state.isRAFCanceled = true;
    this.state.rAF = cancelAnimationFrame(this.state.rAF);
  },

  /*
   ** Events
   */

  /**
   * Checks if rolly is ready.
   */
  ready() {
    if (
      this.state.ready
      && (this.options.preload ? this.state.preLoaded : true)
    ) {
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
  virtualScroll(e) {
    if (this.state.scrollTo.callback) return;
    const delta = this.options.direction === 'horizontal' ? e.deltaX : e.deltaY;
    privated.setTarget.call(this, this.state.target + delta * -1);
  },

  /**
   * Native scroll event callback.
   * @param {object} e - The event data.
   */
  debounceScroll(e) {
    if (this.state.scrollTo.callback) return;
    const isWindow = this.DOM.listener === document.body;

    let target;

    if (this.options.direction === 'vertical') {
      target = isWindow
        ? window.scrollY || window.pageYOffset
        : this.DOM.listener.scrollTop;
    } else {
      target = isWindow
        ? window.scrollX || window.pageXOffset
        : this.DOM.listener.scrollLeft;
    }

    privated.setTarget.call(this, target);

    clearTimeout(this.state.debounceScroll.timer);

    if (!this.state.debounceScroll.tick) {
      this.state.debounceScroll.tick = true;
      this.DOM.listener.classList.add('is-scrolling');
    }

    this.state.debounceScroll.timer = setTimeout(() => {
      this.state.debounceScroll.tick = false;
      this.DOM.listener.classList.remove('is-scrolling');
    }, 200);
  },

  /**
   * Resize event callback.
   * @param {object} e - The event data.
   */
  resize(e) {
    const prop = this.options.direction === 'vertical' ? 'height' : 'width';
    this.state.height = window.innerHeight;
    this.state.width = window.innerWidth;

    // Calc bounding
    const bounding = this.DOM.view.getBoundingClientRect();
    this.state.bounding = this.options.direction === 'vertical'
      ? bounding.height - (this.options.native ? 0 : this.state.height)
      : bounding.right - (this.options.native ? 0 : this.state.width);

    // Set scroll bar thumb height (according to view height)
    if (this.scrollBar) {
      this.scrollBar.cache(this.state);
    } else if (this.options.native) {
      this.DOM.scroll.style[prop] = `${this.state.bounding}px`;
    }

    privated.setTarget.call(this, this.state.target);

    // Get cache for scenes
    this.scenes.forEach(scene => scene.cache(this.state));
  },

  /*
   ** Utils
   */

  /**
   * Extends options.
   * @param {object} options - The options to extend.
   * @return {object} The extended options.
   */
  extendOptions(options) {
    const opts = this.options ? this.options : privated.getDefaults.call(this);
    options.virtualScroll = { ...opts.virtualScroll, ...options.virtualScroll };
    options.scenes = { ...opts.scenes, ...options.scenes };

    return { ...opts, ...options };
  },

  /**
   * Preload images in the view of the rolly instance.
   * Useful if the view contains images that might not have fully loaded when the instance is created (because when an
   * image is loaded, the total height changes).
   * @param {function} callback - The function to run when images are loaded.
   */
  preloadImages(callback) {
    const images = utils.getElements('img', this.DOM.listener);

    if (!images.length) {
      if (callback) callback();
      return;
    }

    images.forEach((image) => {
      const img = document.createElement('img');
      img.onload = () => {
        images.splice(images.indexOf(image), 1);
        if (images.length === 0) callback();
      };

      img.src = image.getAttribute('src');
    });
  },

  /**
   * Adds a fake scroll height.
   */
  addFakeScrollHeight() {
    const scroll = document.createElement('div');
    scroll.className = 'rolly-scroll-view';
    this.DOM.scroll = scroll;
    this.DOM.listener.appendChild(this.DOM.scroll);
  },

  /**
   * Removes a fake scroll height.
   */
  removeFakeScrollHeight() {
    this.DOM.listener.removeChild(this.DOM.scroll);
  },

  /**
   * Adds a fake scroll bar.
   */
  addFakeScrollBar() {
    this.scrollBar = new ScrollBar(
      this.DOM.listener,
      this.state,
      privated.setTarget.bind(this),
      this.options,
    );
  },

  /**
   * Removes the fake scroll bar.
   */
  removeFakeScrollBar() {
    this.scrollBar.destroy();
  },

  /*
   ** Getters and setters
   */

  /**
   * Gets the default options for the rolly instance.
   * @return {object} The default options.
   */
  getDefaults() {
    return {
      direction: 'vertical',
      listener: document.body,
      view: utils.getElements('.rolly-view')[0] || null,
      native: false,
      preload: true,
      ready: null,
      change: null,
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
  getNodeListener() {
    return this.DOM.listener === document.body ? window : this.DOM.listener;
  },

  /**
   * Sets the target position with auto clamping.
   */
  setTarget(target) {
    this.state.target = Math.round(
      Math.max(0, Math.min(target, this.state.bounding)),
    );
    !this.state.rAF && privated.rAF.call(this);
  },
};

class Rolly {
  /*
   ** Public methods
   */

  /**
   * The constructor.
   * @constructor
   * @param {object} options - Options of rolly.
   */
  constructor(options = {}) {
    this.boundFns = privated.getBoundFns.call(this);

    // Extend default options
    this.options = privated.extendOptions.call(this, options);

    this.DOM = {
      listener: this.options.listener,
      view: this.options.view,
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
  init() {
    // Instantiate virtual scroll native option is false
    this.virtualScroll = this.options.native
      ? null
      : new VirtualScroll(this.options.virtualScroll);

    privated.initState.call(this);

    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.add(`is-${type}-scroll`);
    this.DOM.listener.classList.add(`${direction}-scroll`);
    this.DOM.view.classList.add('rolly-view');

    this.options.native
      ? privated.addFakeScrollHeight.call(this)
      : !this.options.noScrollBar && privated.addFakeScrollBar.call(this);

    if (this.options.preload) {
      privated.preloadImages.call(this, () => {
        this.state.preLoaded = true;
        this.boundFns.resize();
        privated.ready.call(this);
      });
    }

    this.on();
  }

  /**
   * Enables the rolly instance.
   * - starts listening events (scroll and resize),
   * - requests an animation frame if {@param rAF} is true.
   * @param {boolean} rAF - whether to request an animation frame.
   */
  on(rAF = true) {
    if (this.options.native) {
      const listener = privated.getNodeListener.call(this);
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
  off(cAF = true) {
    if (this.options.native) {
      const listener = privated.getNodeListener.call(this);
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
  destroy() {
    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.remove(`is-${type}-scroll`);
    this.DOM.listener.classList.remove(`${direction}-scroll`);
    this.DOM.view.classList.remove('rolly-view');

    this.virtualScroll
      && (this.virtualScroll.destroy(), (this.virtualScroll = null));

    this.off();

    this.options.native
      ? privated.removeFakeScrollHeight.call(this)
      : !this.options.noScrollBar && privated.removeFakeScrollBar.call(this);
  }

  /**
   * Reloads the rolly instance with new options.
   * @param {object} options - Options of rolly.
   */
  reload(options = this.options) {
    this.destroy();

    this.boundFns = privated.getBoundFns.call(this);

    // Extend default options
    this.options = privated.extendOptions.call(this, options);

    const { DOM } = this;
    this.DOM = {
      ...DOM,
      listener: this.options.listener,
      view: this.options.view,
    };

    privated.initScenes.call(this);

    this.init();
  }

  /**
   * Scrolls to a target (number|DOM element).
   * @param {number|object} target - The target to scroll to.
   * @param {object} options - Options.
   */
  scrollTo(target, options) {
    const defaultOptions = {
      offset: 0,
      position: 'start',
      callback: null,
    };
    options = { ...defaultOptions, ...options };

    const vertical = this.options.direction === 'vertical';
    const scrollOffset = this.state.current;
    let bounding = null;
    let newPos = scrollOffset + options.offset;

    if (typeof target === 'string') {
      [target] = utils.getElements(target);
    }

    switch (typeof target) {
      case 'number':
      default:
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
      default:
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
      this.options.direction === 'vertical'
        ? window.scrollTo(0, newPos)
        : window.scrollTo(newPos, 0);
    } else {
      privated.setTarget.call(this, newPos);
    }
  }

  /**
   * Updates the states and re-setup all the cache of the rolly instance.
   * Useful if the width/height of the view changed.
   * - calls {@link Rolly#resize}.
   */
  update() {
    privated.resize.call(this);
  }
}

const rolly = options => new Rolly(options);

export default rolly;
