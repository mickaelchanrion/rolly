'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var prefix = _interopDefault(require('prefix'));
var VirtualScroll = _interopDefault(require('virtual-scroll'));

const utils = {
  getCSSTransform(value, direction) {
    return direction === 'vertical'
      ? `translate3d(0, ${value}px, 0)`
      : `translate3d(${value}px, 0, 0)`;
  },

  getElements(selector, context = document) {
    const els = context.querySelectorAll(selector);
    return Array.prototype.slice.call(els, 0);
  }
};

class Parallax {
  constructor(context, options) {
    this.options = options;

    this.transformPrefix = prefix('transform');

    this.state = { caching: false, cache: null };
    this.DOM = { context };
    this.DOM.els = utils.getElements(this.options.parallax.selector, context);
  }

  reload() {
    this.DOM.els = utils.getElements(
      this.options.parallax.selector,
      this.DOM.context
    );
  }

  run(parentState) {
    this.DOM.els.forEach((el, index) => {
      if (!this.state.cache || this.state.caching) return;
      const cache = this.state.cache[index];
      const current = parentState.current;

      if (!cache) return;

      // Set style for parallax element with type 'default'
      if (cache.type === 'default') {
        const { inView, transform } = this.calc(cache, parentState);

        if (inView) {
          el.style[this.transformPrefix] = utils.getCSSTransform(
            transform,
            this.options.direction
          );
        }
      } else {
        // Do other things for parallax element with other type
        try {
          const state = Object.assign({}, parentState);

          Object.keys(parentState)
            .filter(
              key =>
                ![
                  'current',
                  'last',
                  'target',
                  'width',
                  'height',
                  'bounding'
                ].includes(key)
            )
            .forEach(key => delete state[key]);

          this.options.parallax[cache.type].run.call(this, { cache, state });
        } catch (error) {
          const msg =
            'ScrollManager.run: error occured while calling run function for parallax elements with type';
          console.error(`${msg} '${cache.type}'`, error);
        }
      }
    });
  }

  // Calculate usefull values
  // transform: the transform value according to speed (data-speed) values
  // start: distance between start of screen and start of element (top||left)
  // end: distance between start of screen and end of element (bottom||right)
  // inView: indicates whether the element is into view
  calc(cache, state) {
    const vertical = this.options.direction === 'vertical';
    const { top, right, bottom, left, center, speed } = cache;
    const { width, height, current } = state;

    const transform = ((vertical ? top : left) + center - current) * speed;
    const start = Math.round((vertical ? top : left) + transform - current);
    const end = Math.round((vertical ? bottom : right) + transform - current);
    const inView = end > 0 && start < (vertical ? height : width);

    return { transform, start, end, inView };
  }

  cache(parentState) {
    return new Promise((resolve, reject) => {
      this.state.caching = true;
      this.state.cache = [];

      const isVertical = this.options.direction === 'vertical';
      const scrollOffset = parentState.target;

      this.DOM.els.forEach((el, index) => {
        el.style.display = null;
        const computedDisplay = window.getComputedStyle(el).display;
        if (computedDisplay === 'none') {
          this.state.cache.push(null);
          return;
        }

        if (computedDisplay === 'inline') {
          el.style.display = 'block';
        }
        el.style[this.transformPrefix] = 'none';

        const bounding = el.getBoundingClientRect();
        let cache = {
          el,
          top: isVertical ? bounding.top + scrollOffset : bounding.top,
          left: isVertical ? bounding.left : bounding.left + scrollOffset,
          right: isVertical ? bounding.right : bounding.right + scrollOffset,
          center: isVertical ? bounding.height / 2 : bounding.width / 2,
          bottom: isVertical ? bounding.bottom + scrollOffset : bounding.bottom,
          speed: parseFloat(el.getAttribute('data-speed')) || -1,
          type: el.getAttribute('data-parallax') || 'default'
        };

        // Set default style for parallax element with type 'default'
        if (cache.type === 'default') {
          const { transform } = this.calc(cache, parentState);
          el.style[this.transformPrefix] = utils.getCSSTransform(
            transform,
            this.options.direction
          );
        } else {
          // Do custom things for parallax elements with custom type
          if (this.options.parallax[cache.type]) {
            const getCache = this.options.parallax[cache.type].getCache;
            if (getCache) {
              const extend = getCache.call(this, { cache, state: parentState });
              cache = Object.assign(cache, extend);
            }
          }
        }

        this.state.cache.push(cache);
      });

      this.state.caching = false;
      resolve();
    });
  }
}

class Scenes {
  constructor(context, options) {
    this.options = options;

    this.state = { caching: false, cache: null };
    this.DOM = { context };
    this.DOM.els = utils.getElements(this.options.scenes.selector, context);
  }

  reload() {
    this.DOM.els = utils.getElements(
      this.options.scenes.selector,
      this.DOM.context
    );
  }

  run(parentState) {
    this.DOM.els.forEach((el, index) => {
      if (!this.state.cache || this.state.caching) return;

      const current = parentState.current;
      const height = parentState.height;
      const cache = this.state.cache[index];

      if (!cache) return;

      cache.progress = this.getProgress(current, height, cache);
      const inView = this.checkInView(current, height, cache);

      // Check inView value changed
      if (cache.inView !== inView) {
        cache.inView = inView;

        if (inView) {
          // Check appear
          this.options.scenes.onAppear &&
            this.options.scenes.onAppear.call(this, cache, parentState);
        } else {
          // Check disappear
          this.options.scenes.onDisappear &&
            this.options.scenes.onDisappear.call(this, cache, parentState);
        }
      }

      if (inView) {
        // Check is entering
        if (this.checkEnter(cache.active, cache.progress)) {
          cache.active = true;
          this.options.scenes.onEnter &&
            this.options.scenes.onEnter.call(this, cache, parentState);
        } else if (this.checkLeave(cache.active, cache.progress)) {
          // Check is leaving
          cache.active = false;
          this.options.scenes.onLeave &&
            this.options.scenes.onLeave.call(this, cache, parentState);
        }

        // Run
        if (this.options.scenes.run) {
          this.options.scenes.run.call(this, cache, parentState);
        }
      }
    });
  }

  getProgress(current, height, cache) {
    let offset = current;
    if (cache.position === 'middle') offset += height / 2;
    if (cache.position === 'end') offset += height;
    let progress = Math.round((offset - cache.top) * 10000 / cache.size) / 100;
    if (progress < 0 || progress > 100) progress = -1;

    return progress;
  }

  cache(parentState) {
    return new Promise((resolve, reject) => {
      this.state.caching = true;
      this.state.cache = [];

      const isVertical = this.options.direction === 'vertical';
      const current = parentState.current;
      const height = parentState.height;
      const scrollOffset = parentState.target;

      this.DOM.els.forEach((el, index) => {
        const bounding = el.getBoundingClientRect();
        let data = {
          el,
          name: el.getAttribute('data-scene'),
          size: isVertical ? bounding.height : bounding.width,
          top: isVertical ? bounding.top + scrollOffset : bounding.top,
          left: isVertical ? bounding.left : bounding.left + scrollOffset,
          bottom: isVertical ? bounding.bottom + scrollOffset : bounding.bottom,
          position: el.getAttribute('data-scene-trigger'),
          inView: false,
          progress: 0
        };

        if (
          data.position !== 'start' &&
          data.position !== 'middle' &&
          data.position !== 'end'
        ) {
          data.position = this.options.scenes.trigger;
        }

        this.state.cache.push(data);
      });

      this.state.caching = false;
      resolve();
    });
  }

  /*
  ** Checkers
  */
  checkInView(current, height, cache) {
    const top = Math.round(cache.top - current);
    const bottom = Math.round(cache.bottom - current);
    return bottom > 0 && top < height;
  }

  checkEnter(active, progress) {
    return !active && progress >= 0 && progress <= 100;
  }

  checkLeave(active, progress) {
    return active && progress === -1;
  }
}

// Bad perfs in firefox?
// Take a look at this ;)
// https://bugzilla.mozilla.org/show_bug.cgi?id=1427177
class Rolly {
  /*
  ** Public methods
  */

  constructor(options = {}) {
    privated.bindFunc(this);

    // Extend default options
    this.options = privated.extOptions(options);

    this.transformPrefix = prefix('transform');

    // Instantiate virtual scroll for not native behavior
    this.virtualScroll = this.options.native
      ? null
      : new VirtualScroll(this.options.virtualScroll);

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

  init() {
    privated.initState();

    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.add(`is-${type}-scroll`);
    this.DOM.listener.classList.add(`${direction}-scroll`);
    this.DOM.section.classList.add('rolly-section');

    this.options.preload && privated.preloadImages.call(this, privated.resize);
    this.options.native
      ? privated.addFakeScrollHeight()
      : !this.options.nosrollbar && privated.addFakeScrollBar();

    privated.addEvents();
    privated.resize();
  }

  on(rAF = true) {
    this.options.native
      ? events.on(privated.getNodeListener(), 'scroll', privated.debounceScroll)
      : this.virtualScroll && this.virtualScroll.on(privated.virtualScroll);

    rAF && privated.rAF();
  }

  off(cAF = true) {
    this.options.native
      ? window.removeEventListener(
          privated.getNodeListener(),
          'scroll',
          privated.debounceScroll
        )
      : this.virtualScroll && this.virtualScroll.off(privated.virtualScroll);

    cAF && privated.cAF();
  }

  destroy() {
    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.remove(`is-${type}-scroll`);
    this.DOM.listener.classList.remove(`${direction}-scroll`);
    this.DOM.section.classList.remove('rolly-section');

    this.options.native
      ? privated.removeFakeScrollHeight()
      : !this.options.nosrollbar && privated.removeFakeScrollBar();

    this.state.current = 0;

    this.virtualScroll &&
      (this.virtualScroll.destroy(), this.virtualScroll = null);

    privated.removeEvents();
  }

  reload(options) {
    privated.removeEvents();
    this.state.current = 0;
    this.state.target = 0;

    // Extend options
    this.options = privated.extOptions(options);

    this.DOM.section = options.section;
    this.DOM.section.classList.add('rolly-section');

    this.options.callback = options.callback;

    this.parallax && this.parallax.reload();
    this.scenes && this.scenes.reload();

    this.options.preload && privated.preloadImages.call(this, privated.resize);

    privated.addEvents();
    setTimeout(_ => privated.resize(), 100);
  }

  scrollTo(target, options) {
    options = Object.assign(
      { offset: 0, position: 'start', callback: null },
      options
    );

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
      privated.setTarget(newPos);
    }
  }

  update() {
    privated.resize();
  }
}

const privated = {
  bindFunc(scope) {
    for (let key of Object.keys(privated)) {
      if (key !== 'bindFunc') {
        privated[key] = privated[key].bind(scope);
      }
    }
  },

  initState() {
    this.state = {
      // Global states
      current: 0,
      last: 0,
      target: 0,
      height: window.innerHeight,
      width: window.innerWidht,
      bounding: 0,
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

  // Frame request callback (called at every frames)
  // Automatically stops when |delta| < 0.1
  run() {
    if (this.state.isRAFCanceled) return;
    privated.rAF();

    const diff = this.state.target - this.state.current;
    let delta = diff * this.options.ease;

    // If diff between target and current states is < 0.1,
    // stop running animation
    if (Math.abs(diff) < 0.1) {
      privated.cAF();
      delta = 0;
      this.state.current = this.state.target;
    } else {
      this.state.current += delta;
    }

    if (Math.abs(diff) < 10 && this.state.scrollTo.callback) {
      this.state.scrollTo.callback();
      this.state.scrollTo.callback = null;
    }

    // Set section position
    this.DOM.section.style[this.transformPrefix] = utils.getCSSTransform(
      -this.state.current,
      this.options.direction
    );

    // Set scrollbar thumb position
    if (!this.options.native && !this.options.noscrollbar) {
      const size = this.state.scrollbar.thumb.height;
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

    // Call any callback
    if (this.options.callback) {
      this.options.callback();
    }

    // Parallax elements
    this.parallax && this.parallax.run(this.state);

    // Scenes
    this.scenes && this.scenes.run(this.state);

    this.state.last = this.state.current;
  },

  // Requests an animation frame
  rAF() {
    this.state.isRAFCanceled = false;
    this.state.rAF = requestAnimationFrame(privated.run);
  },

  // Cancels a requested animation frame
  cAF() {
    this.state.isRAFCanceled = true;
    this.state.rAF = cancelAnimationFrame(this.state.rAF);
  },

  calcScroll(e) {
    const client = this.options.direction == 'vertical' ? e.clientY : e.clientX;
    const bounds =
      this.options.direction == 'vertical'
        ? this.state.height
        : this.state.width;
    const delta = client * (this.state.bounding / bounds);

    this.DOM.listener.classList.add('is-dragging');

    privated.setTarget(delta);
    this.DOM.scrollbar && (this.state.scrollbar.thumb.delta = delta);
  },

  /*
  ** Events
  */

  addEvents() {
    this.on();
    window.addEventListener('resize', privated.resize);
  },

  removeEvents() {
    this.off();
    window.removeEventListener('resize', privated.resize);
  },

  // Virtual scroll event callback
  virtualScroll(e) {
    if (this.state.scrollTo.callback) return;
    const delta = this.options.direction === 'horizontal' ? e.deltaX : e.deltaY;
    privated.setTarget(this.state.target + delta * -1);
  },

  // Native scroll event callback
  debounceScroll() {
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

    privated.setTarget(target);

    clearTimeout(this.state.debounceScroll.timer);

    if (!this.state.debounceScroll.tick) {
      this.state.debounceScroll.tick = true;
      this.DOM.listener.classList.add('is-scrolling');
    }

    this.state.debounceScroll.timer = setTimeout(_ => {
      this.state.debounceScroll.tick = false;
      this.DOM.listener.classList.remove('is-scrolling');
    }, 200);
  },

  // Resize event callback
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
    if (!this.options.native && !this.options.nosrollbar) {
      this.state.scrollbar.thumb.height =
        this.state.height *
        (this.state.height / (this.state.bounding + this.state.height));
      this.DOM.scrollbarThumb.style[prop] = `${
        this.state.scrollbar.thumb.height
      }px`;
    } else if (this.options.native) {
      this.DOM.scroll.style[prop] = `${this.state.bounding}px`;
    }

    !this.options.native && privated.setTarget(this.state.target);

    // Get cache for parallax elements
    this.parallax && this.parallax.cache(this.state);

    // Get cache for scenes
    this.scenes && this.scenes.cache(this.state);
  },

  // Scrollbar thumb click & mouse move events callback

  // Scrollbar click event callback
  mouseDown(e) {
    e.preventDefault();
    e.which === 1 && (this.state.scrollbar.clicked = true);
  },

  // Mouse move event callback
  mouseMove(e) {
    this.state.scrollbar.clicked && privated.calcScroll.call(this, e);
  },

  // Mouse up event callback
  mouseUp(e) {
    this.state.scrollbar.clicked = false;
    this.DOM.listener.classList.remove('is-dragging');
  },

  /*
  ** Utils
  */

  // Extend options
  extOptions(options) {
    console.log(this);
    const opts = this.options ? this.options : privated.getOptions();
    options.virtualScroll = Object.assign(
      opts.virtualScroll,
      options.virtualScroll
    );
    options.parallax = Object.assign(opts.parallax, options.parallax);
    options.scenes = Object.assign(opts.scenes, options.scenes);

    return Object.assign(opts, options);
  },

  // Preload images of section to make sure `this.state.height`
  // contains real images height
  preloadImages(callback) {
    const images = Array.prototype.slice.call(
      this.DOM.listener.querySelectorAll('img'),
      0
    );

    images.forEach(image => {
      const img = document.createElement('img');
      img.onload = _ => {
        images.splice(images.indexOf(image), 1);
        images.length === 0 && callback && callback();
      };

      img.src = image.getAttribute('src');
    });
  },

  // Add a fake scroll height
  addFakeScrollHeight() {
    const scroll = document.createElement('div');
    scroll.className = 'rolly-scroll-view';
    this.DOM.scroll = scroll;
    this.DOM.listener.appendChild(this.DOM.scroll);
  },

  // Remove the fake scroll height
  removeFakeScrollHeight() {
    this.DOM.listener.removeChild(this.DOM.scroll);
  },

  // Add a fake scroll bar
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

    this.DOM.scrollbar.addEventListener('click', privated.calcScroll);
    this.DOM.scrollbar.addEventListener('mousedown', privated.mouseDown);

    document.addEventListener('mousemove', privated.mouseMove);
    document.addEventListener('mouseup', privated.mouseUp);
  },

  // Remove the fake scroll bar
  removeFakeScrollBar() {
    this.DOM.scrollbar.removeEventListener('click', privated.calcScroll);
    this.DOM.scrollbar.removeEventListener('mousedown', privated.mouseDown);

    document.removeEventListener('mousemove', privated.mouseMove);
    document.removeEventListener('mouseup', privated.mouseUp);

    this.DOM.listener.removeChild(this.DOM.scrollbar);
  },

  /*
  ** Getters and setters
  */

  getOptions() {
    return {
      direction: 'vertical',
      native: false,
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
      callback: null
    };
  },

  getNodeListener() {
    return this.DOM.listener === document.body ? window : this.DOM.listener;
  },

  setTarget(target) {
    this.state.target = Math.round(
      Math.max(0, Math.min(target, this.state.bounding))
    );
    !this.state.rAF && privated.rAF();
  }
};

module.exports = Rolly;
