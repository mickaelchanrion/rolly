import VirtualScroll from 'virtual-scroll';
import prefix from 'prefix';

import utils from './utils';
import Parallax from './Parallax';
import Scenes from './Scenes';

// Bad perfs in firefox?
// Take a look at this ;)
// https://bugzilla.mozilla.org/show_bug.cgi?id=1427177
export default class Rolly {
  /*
  ** Public methods
  */

  /**
   * The constructor.
   * @constructor
   * @param {object} options - Options of Rolly.
   */
  constructor(options = {}) {
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
  init() {
    // Instantiate virtual scroll native option is falsy
    this.virtualScroll = this.options.native
      ? null
      : new VirtualScroll(this.options.virtualScroll);

    privated.initState.call(this);

    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.add(`is-${type}-scroll`);
    this.DOM.listener.classList.add(`${direction}-scroll`);
    this.DOM.section.classList.add('rolly-section');

    this.options.preload && privated.preloadImages.call(this, this.boundFns.resize);
    this.options.native
      ? privated.addFakeScrollHeight.call(this)
      : !this.options.noSrollbar && privated.addFakeScrollBar.call(this);

    this.on();
  }

  /**
   * Enable the Rolly instance.
   * - start listening events (scroll and resize),
   * - request an animation frame if {@param rAF} is truthy.
   */
  on(rAF = true) {
    if (this.options.native) {
      const listener = privated.getNodeListener.call(this);
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
  off(cAF = true) {
    if (this.options.native) {
      const listener = privated.getNodeListener.call(this);
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
  destroy() {
    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.remove(`is-${type}-scroll`);
    this.DOM.listener.classList.remove(`${direction}-scroll`);
    this.DOM.section.classList.remove('rolly-section');

    this.options.native
      ? privated.removeFakeScrollHeight.call(this)
      : !this.options.noSrollbar && privated.removeFakeScrollBar.call(this);

    // this.state.current = 0;

    this.virtualScroll &&
      (this.virtualScroll.destroy(), (this.virtualScroll = null));

    this.off();
  }

  /**
   * Reload the Rolly instance with new options.
   * @param {object} options - Options of Rolly.
   */
  reload(options = {}) {
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
  scrollTo(target, options) {
    const defaultOptions = {
      offset: 0,
      position: 'start',
      callback: null
    };
    options = { ...defaultOptions, ...options }

    const isVertical = this.options.direction === 'vertical';
    const scrollOffset = this.state.current;
    let bounding = null;
    let newPos = scrollOffset + options.offset;

    if (typeof target === 'string') {
      target = document.querySelector(target);
    }

    switch (typeof target) {
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
      this.options.direction === 'vertical'
        ? window.scrollTo(0, newPos)
        : window.scrollTo(newPos, 0);
    } else {
      privated.setTarget.call(this, newPos);
    }
  }

  /**
   * Update the states and re-setup all the cache of the Rolly instance.
   * Usefull if the width/height of the section has changed.
   * - call {@link Rolly#resize}.
   */
  update() {
    privated.resize.call(this);
  }
}

/*
** Private methods
*/
const privated = {
  /**
   * Get all functions that needs to be bound with the Rolly's scope
   */
  getBoundFns() {
    const fns = {};
    [
      'resize',
      'debounceScroll',
      'virtualScroll',
      'calcScroll',
      'mouseDown',
      'mouseMove',
      'mouseUp'
    ].map(fn => (fns[fn] = privated[fn].bind(this)));
    return fns;
  },

  /**
   * Initialize the state of the Rolly instance.
   */
  initState() {
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
  run() {
    if (this.state.isRAFCanceled) return;
    privated.rAF.call(this);

    const diff = this.state.target - this.state.current;
    let delta = diff * this.options.ease;

    // If diff between target and current states is < 0.1,
    // stop running animation
    if (Math.abs(diff) < 0.1) {
      privated.cAF.call(this);
      delta = 0;
      this.state.current = this.state.target;
    } else {
      this.state.current += delta;
    }

    const exportedState = utils.exportState(this.state);

    if (Math.abs(diff) < 10 && this.state.scrollTo.callback) {
      this.state.scrollTo.callback(exportedState);
      this.state.scrollTo.callback = null;
    }

    // Set section position
    this.DOM.section.style[this.transformPrefix] = utils.getCSSTransform(
      -this.state.current,
      this.options.direction
    );

    // Set scrollbar thumb position
    if (!this.options.native && !this.options.noScrollbar) {
      const size = this.state.scrollbar.thumb.size;
      const bounds =
        this.options.direction === 'vertical'
          ? this.state.height
          : this.state.width;
      const value =
        Math.abs(this.state.current) / (this.state.bounding / (bounds - size)) +
        size / 0.5 -
        size;
      const clamp = Math.max(0, Math.min(value - size, value + size));
      this.DOM.scrollbarThumb.style[
        this.transformPrefix
      ] = utils.getCSSTransform(clamp.toFixed(2), this.options.direction);
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
  rAF() {
    this.state.isRAFCanceled = false;
    this.state.rAF = requestAnimationFrame(privated.run.bind(this));
  },

  /**
   * Cancel a requested animation frame.
   */
  cAF() {
    this.state.isRAFCanceled = true;
    this.state.rAF = cancelAnimationFrame(this.state.rAF);
  },

  /**
   * Calculate the target from scroll bar.
   * @param {object} e - The event data.
   */
  calcScroll(e) {
    const client = this.options.direction == 'vertical' ? e.clientY : e.clientX;
    const bounds =
      this.options.direction == 'vertical'
        ? this.state.height
        : this.state.width;
    const delta = client * (this.state.bounding / bounds);

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

    let target =
      this.options.direction === 'vertical'
        ? isWindow
          ? window.scrollY || window.pageYOffset
          : this.DOM.listener.scrollTop
        : isWindow
          ? window.scrollX || window.pageXOffset
          : this.DOM.listener.scrollLeft;

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
    const bounding = this.DOM.section.getBoundingClientRect();
    this.state.bounding =
      this.options.direction === 'vertical'
        ? bounding.height - (this.options.native ? 0 : this.state.height)
        : bounding.right - (this.options.native ? 0 : this.state.width);

    // Set scrollbar thumb height (according to section height)
    if (!this.options.native && !this.options.noSrollbar) {
      if (this.state.bounding <= 0) {
        this.state.scrollbar.thumb.size = 0;
        this.DOM.scrollbar.classList.add('is-hidden');
      } else {
        this.DOM.scrollbar.classList.remove('is-hidden');
        const size =
          this.state.height *
          (this.state.height / (this.state.bounding + this.state.height));
        // console.log('size', size);
        // console.log(this.state);
        // console.log(bounding);
        this.DOM.scrollbarThumb.style[prop] = `${size}px`;
        this.state.scrollbar.thumb.size = size;
      }
    } else if (this.options.native) {
      this.DOM.scroll.style[prop] = `${this.state.bounding}px`;
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
  mouseDown(e) {
    e.preventDefault();
    e.which === 1 && (this.state.scrollbar.clicked = true);
    this.DOM.listener.classList.add('is-dragging');
  },

  /**
   * Mouse move event callback.
   * @param {object} e - The event data.
   */
  mouseMove(e) {
    this.state.scrollbar.clicked && privated.calcScroll.call(this, e);
  },

  /**
   * Mouse up event callback.
   * @param {object} e - The event data.
   */
  mouseUp(e) {
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
  extendOptions(options) {
    const opts = this.options ? this.options : privated.getOptions.call(this);
    options.virtualScroll = { ...opts.virtualScroll, ...options.virtualScroll };
    options.parallax = { ...opts.parallax, ...options.parallax };
    options.scenes = { ...opts.scenes, ...options.scenes };

    return { ...opts, ...options };
  },

  /**
   * Preload images in the section of the Rolly instance.
   * Useful if the section contains images that might not have fully loaded
   * when the instance is created (because when an image is loaded, the
   * total height changes).
   * @param {function} callback - The function to run when images are loaded.
   */
  preloadImages(callback) {
    const images = [...this.DOM.listener.querySelectorAll('img')];

    images.forEach(image => {
      const img = document.createElement('img');
      img.onload = _ => {
        images.splice(images.indexOf(image), 1);
        images.length === 0 && callback && callback();
      };

      img.src = image.getAttribute('src');
    });
  },

  /**
   * Add a fake scroll height.
   */
  addFakeScrollHeight() {
    const scroll = document.createElement('div');
    scroll.className = 'rolly-scroll-view';
    this.DOM.scroll = scroll;
    this.DOM.listener.appendChild(this.DOM.scroll);
  },

  /**
   * Remove a fake scroll height.
   */
  removeFakeScrollHeight() {
    this.DOM.listener.removeChild(this.DOM.scroll);
  },

  /**
   * Add a fake scroll bar.
   */
  addFakeScrollBar() {
    const scrollbar = document.createElement('div');
    scrollbar.className = `rolly-scrollbar rolly-${this.options.direction}`;
    this.DOM.scrollbar = scrollbar;

    const scrollbarThumb = document.createElement('div');
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
  removeFakeScrollBar() {
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
  getOptions() {
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
  getNodeListener() {
    return this.DOM.listener === document.body
      ? window
      : this.DOM.listener;
  },

  /**
   * Set the target position with auto clamping.
   */
  setTarget(target) {
    this.state.target = Math.round(
      Math.max(0, Math.min(target, this.state.bounding))
    );
    !this.state.rAF && privated.rAF.call(this);
  }
};
