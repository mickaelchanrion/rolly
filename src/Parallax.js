import prefix from 'prefix';

import utils from './utils';

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

export default Parallax;
