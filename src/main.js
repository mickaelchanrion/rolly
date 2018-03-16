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

  constructor(options = {}) {
    this._createBound();

    // Extend default options
    const defOpts = this._getOptions();
    options.virtualScroll = Object.assign(
      defOpts.virtualScroll,
      options.virtualScroll
    );

    options.parallax = Object.assign(defOpts.parallax, options.parallax);
    options.scenes = Object.assign(defOpts.scenes, options.scenes);

    this.options = Object.assign(defOpts, options);

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
    this._initState();

    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.add(`is-${type}-scroll`);
    this.DOM.listener.classList.add(`${direction}-scroll`);
    this.DOM.section.classList.add('sm-section');

    this.options.preload && this._preloadImages(this._resize);
    this.options.native
      ? this._addFakeScrollHeight()
      : !this.options.nosrollbar && this._addFakeScrollBar();

    this._addEvents();
    this._resize();
  }

  on(rAF = true) {
    this.options.native
      ? events.on(this._getNodeListener(), 'scroll', this._debounceScroll)
      : this.virtualScroll && this.virtualScroll.on(this._virtualScroll);

    rAF && this._rAF();
  }

  off(cAF = true) {
    this.options.native
      ? window.removeEventListener(
          this._getNodeListener(),
          'scroll',
          this._debounceScroll
        )
      : this.virtualScroll && this.virtualScroll.off(this._virtualScroll);

    cAF && this._cAF();
  }

  destroy() {
    const type = this.options.native ? 'native' : 'virtual';
    const direction = this.options.direction === 'vertical' ? 'y' : 'x';

    this.DOM.listener.classList.remove(`is-${type}-scroll`);
    this.DOM.listener.classList.remove(`${direction}-scroll`);
    this.DOM.section.classList.remove('sm-section');

    this.options.native
      ? this._removeFakeScrollHeight()
      : !this.options.nosrollbar && this._removeFakeScrollBar();

    this.state.current = 0;

    this.virtualScroll &&
      (this.virtualScroll.destroy(), (this.virtualScroll = null));

    this._removeEvents();
  }

  reload(options) {
    this._removeEvents();
    this.state.current = 0;
    this.state.target = 0;
    this.DOM.section = options.section;
    this.DOM.section.classList.add('sm-section');

    this.options.callback = options.callback;

    this.parallax && this.parallax.reload();
    this.scenes && this.scenes.reload();

    this.options.preload && this._preloadImages(this._resize);

    this._addEvents();
    setTimeout(_ => this._resize(), 100);
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
      this._setTarget(newPos);
    }
  }

  update() {
    this._resize();
  }

  _initState() {
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
  }

  /*
  ** Getters and setters
  */

  _getOptions() {
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
      section: document.querySelector('.sm-section') || null,
      parallax: {
        selector: '[data-parallax]'
      },
      scenes: {
        selector: '[data-scene]',
        trigger: 'middle'
      },
      callback: null
    };
  }

  _getNodeListener() {
    return this.DOM.listener === document.body ? window : this.DOM.listener;
  }

  _setTarget(target) {
    this.state.target = Math.round(
      Math.max(0, Math.min(target, this.state.bounding))
    );
    !this.state.rAF && this._rAF();
  }

  /*
  ** Animation frame methods
  */

  // Requests an animation frame
  _rAF() {
    this.state.isRAFCanceled = false;
    this.state.rAF = requestAnimationFrame(this._run);
  }

  // Cancels a requested animation frame
  _cAF() {
    this.state.isRAFCanceled = true;
    this.state.rAF = cancelAnimationFrame(this.state.rAF);
  }

  // Frame request callback (called at every frames)
  // Automatically stops when |delta| < 0.1
  _run() {
    if (this.state.isRAFCanceled) return;
    this._rAF();

    const diff = this.state.target - this.state.current;
    let delta = diff * this.options.ease;

    // If diff between target and current states is < 0.1,
    // stop running animation
    if (Math.abs(diff) < 0.1) {
      this._cAF();
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
      this.options.callback.call(this);
    }

    // Parallax elements
    this.parallax && this.parallax.run(this.state);

    // Scenes
    this.scenes && this.scenes.run(this.state);

    this.state.last = this.state.current;
  }

  /*
  ** Events
  */

  _addEvents() {
    this.on();
    window.addEventListener('resize', this._resize);
  }

  _removeEvents() {
    this.off();
    window.removeEventListener('resize', this._resize);
  }

  // Virtual scroll event callback
  _virtualScroll(e) {
    if (this.state.scrollTo.callback) return;
    const delta = this.options.direction === 'horizontal' ? e.deltaX : e.deltaY;
    this._setTarget(this.state.target + delta * -1);
  }

  // Native scroll event callback
  _debounceScroll() {
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

    this._setTarget(target);

    clearTimeout(this.state.debounceScroll.timer);

    if (!this.state.debounceScroll.tick) {
      this.state.debounceScroll.tick = true;
      this.DOM.listener.classList.add('is-scrolling');
    }

    this.state.debounceScroll.timer = setTimeout(_ => {
      this.state.debounceScroll.tick = false;
      this.DOM.listener.classList.remove('is-scrolling');
    }, 200);
  }

  // Resize event callback
  _resize(e) {
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

    !this.options.native && this._setTarget(this.state.target);

    // Get cache for parallax elements
    this.parallax && this.parallax.cache(this.state);

    // Get cache for scenes
    this.scenes && this.scenes.cache(this.state);
  }

  // Scrollbar thumb click & mouse move events callback
  _calcScroll(e) {
    const client = this.options.direction == 'vertical' ? e.clientY : e.clientX;
    const bounds =
      this.options.direction == 'vertical'
        ? this.state.height
        : this.state.width;
    const delta = client * (this.state.bounding / bounds);

    this.DOM.listener.classList.add('is-dragging');

    this._setTarget(delta);
    this.DOM.scrollbar && (this.state.scrollbar.thumb.delta = delta);
  }

  // Scrollbar click event callback
  _mouseDown(e) {
    e.preventDefault();
    e.which === 1 && (this.state.scrollbar.clicked = true);
  }

  // Mouse move event callback
  _mouseMove(e) {
    this.state.scrollbar.clicked && this._calcScroll(e);
  }

  // Mouse up event callback
  _mouseUp(e) {
    this.state.scrollbar.clicked = false;
    this.DOM.listener.classList.remove('is-dragging');
  }

  /*
  ** Utils
  */

  // Auto bind `this` on some class methods
  _createBound() {
    [
      '_run',
      '_virtualScroll',
      '_debounceScroll',
      '_resize',
      '_mouseUp',
      '_mouseDown',
      '_mouseMove',
      '_calcScroll'
    ].forEach(fn => (this[fn] = this[fn].bind(this)));
  }

  // Preload images of section to make sure `this.state.height`
  // contains real images height
  _preloadImages(callback) {
    const images = Array.prototype.slice.call(
      this.DOM.listener.querySelectorAll('img'),
      0
    );

    images.forEach(image => {
      const img = document.createElement('img');

      events.once(img, 'load', _ => {
        images.splice(images.indexOf(image), 1);
        images.length === 0 && callback && callback();
      });

      img.src = image.getAttribute('src');
    });
  }

  // Add a fake scroll height
  _addFakeScrollHeight() {
    const scroll = document.createElement('div');
    scroll.className = 'sm-scroll-view';
    this.DOM.scroll = scroll;
    this.DOM.listener.appendChild(this.DOM.scroll);
  }

  // Remove the fake scroll height
  _removeFakeScrollHeight() {
    this.DOM.listener.removeChild(this.DOM.scroll);
  }

  // Add a fake scroll bar
  _addFakeScrollBar() {
    const scrollbar = document.createElement('div');
    scrollbar.className = `sm-scrollbar sm-${this.options.direction}`;
    this.DOM.scrollbar = scrollbar;

    const scrollbarThumb = document.createElement('div');
    scrollbarThumb.className = 'sm-scrollbar-thumb';
    this.DOM.scrollbarThumb = scrollbarThumb;

    this.state.scrollbar = {
      clicked: false,
      x: 0,
      thumb: { delta: 0, height: 50 }
    };

    this.DOM.listener.appendChild(this.DOM.scrollbar);
    this.DOM.scrollbar.appendChild(this.DOM.scrollbarThumb);

    this.DOM.scrollbar.addEventListener('click', this._calcScroll);
    this.DOM.scrollbar.addEventListener('mousedown', this._mouseDown);

    document.addEventListener('mousemove', this._mouseMove);
    document.addEventListener('mouseup', this._mouseUp);
  }

  // Remove the fake scroll bar
  _removeFakeScrollBar() {
    this.DOM.scrollbar.removeEventListener('click', this._calcScroll);
    this.DOM.scrollbar.removeEventListener('mousedown', this._mouseDown);

    document.removeEventListener('mousemove', this._mouseMove);
    document.removeEventListener('mouseup', this._mouseUp);

    this.DOM.listener.removeChild(this.DOM.scrollbar);
  }
}
