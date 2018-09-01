import prefix from 'prefix';

import utils from './utils';

class Parallax {
  /**
   * The constructor.
   * @constructor
   * @param {object} context - The DOM context.
   * @param {object} options - Options of Rolly.
   */
  constructor(context, options) {
    this.options = options;

    this.transformPrefix = prefix('transform');

    this.state = { caching: false, cache: null };
    this.DOM = { context };
    this.DOM.els = utils.getElements(this.options.parallax.selector, context);
  }

  /**
   * Reload parallax elements with new options.
   * @param {object} options - Options of Rolly.
   */
  reload(options) {
    this.options = options;
    this.DOM.els = utils.getElements(
      this.options.parallax.selector,
      this.DOM.context
    );
  }

  /**
   * Animation frame callback (called at every frames).
   * @param {object} rollyState - The state of Rolly instance.
   */
  run(rollyState) {
    this.DOM.els.forEach((el, index) => {
      if (!this.state.cache || this.state.caching) return;
      const cache = this.state.cache[index];
      const current = rollyState.current;

      if (!cache) return;

      // Set style for parallax element with type 'default'
      if (cache.type === 'default') {
        const { inView, transform } = this.calc(cache, rollyState);

        if (inView) {
          el.style[this.transformPrefix] = utils.getCSSTransform(
            transform,
            this.options.direction
          );
        }
      } else {
        // Do other things for parallax element with other type
        try {
          this.options.parallax[cache.type].run.call(this, {
            cache,
            state: rollyState
          });
        } catch (error) {
          const msg =
            `rolly.options.parallax.${cache.type}.run: an error occured while calling run function for parallax elements with type`;
          console.error(`${msg} '${cache.type}'`, error);
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
  calc(cache, rollyState) {
    const vertical = this.options.direction === 'vertical';
    const { top, right, bottom, left, size, speed } = cache;
    const { width, height, current } = rollyState;

    const transform = ((vertical ? top : left) + size / 2 - current) * speed;
    const start = Math.round((vertical ? top : left) + transform - current);
    const end = Math.round((vertical ? bottom : right) + transform - current);
    const inView = end > 0 && start < (vertical ? height : width);

    return { transform, start, end, inView };
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
  cache(rollyState) {
    return new Promise((resolve, reject) => {
      this.state.caching = true;
      this.state.cache = [];

      const isVertical = this.options.direction === 'vertical';
      const scrollOffset = rollyState.target;

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
          bottom: isVertical ? bounding.bottom + scrollOffset : bounding.bottom,
          left: isVertical ? bounding.left : bounding.left + scrollOffset,
          right: isVertical ? bounding.right : bounding.right + scrollOffset,
          size: isVertical ? bounding.height : bounding.width,
          speed: parseFloat(el.getAttribute('data-speed')) || -1,
          type: el.getAttribute('data-parallax') || 'default'
        };

        // Set default style for parallax element with type 'default'
        if (cache.type === 'default') {
          const { transform } = this.calc(cache, rollyState);
          el.style[this.transformPrefix] = utils.getCSSTransform(
            transform,
            this.options.direction
          );
        } else {
          // Do custom things for parallax elements with custom type
          if (this.options.parallax[cache.type]) {
            const getCache = this.options.parallax[cache.type].getCache;
            if (getCache) {
              const extend = getCache.call(this, { cache, state: rollyState });
              cache = { ...cache, ...extend };
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

export default Parallax;
