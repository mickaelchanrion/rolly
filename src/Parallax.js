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
        const transform = this.getTransform(cache, current);
        const top = Math.round(cache.top + transform - current);
        const bottom = Math.round(cache.bottom + transform - current);

        const inView = bottom > 0 && top < parentState.height;

        if (inView) {
          el.style[this.transformPrefix] = utils.getCSSTransform(
            transform,
            this.options.direction
          );
        }
      } else {
        // Do other things for parallax element with other type
        try {
          this.options.parallax[cache.type].run.call(this, cache, parentState);
        } catch (error) {
          const msg =
            'ScrollManager.run: error occured while calling run function for parallax element with type';
          console.error(`${msg} '${cache.type}'`, error);
        }
      }
    });
  }

  // Calculte transform position of an element
  getTransform(data, currentPosition) {
    const offset =
      this.options.direction === 'vertical'
        ? data.top + data.center
        : data.left + data.center;
    return (offset - currentPosition) * data.speed;
  }

  cache(parentState) {
    return new Promise((resolve, reject) => {
      this.state.caching = true;
      this.state.cache = [];

      const isVertical = this.options.direction === 'vertical';
      const scrollOffset = parentState.target;

      this.DOM.els.forEach((el, index) => {
        el.style.display = null;
        if (window.getComputedStyle(el).display === 'none') {
          this.state.cache.push(null);
          return;
        }

        el.style.display = 'block';
        el.style[this.transformPrefix] = 'none';

        const bounding = el.getBoundingClientRect();
        let data = {
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
        if (data.type === 'default') {
          const transform = this.getTransform(data, parentState.current);
          el.style[this.transformPrefix] = utils.getCSSTransform(
            transform,
            this.options.direction
          );
        } else {
          // Do custom things for parallax element with other type
          try {
            let getCache = this.options.parallax[data.type].getCache;
            data = Object.assign(data, getCache.call(this, data));
          } catch (error) {
            const msg =
              'ScrollManager.getCache: error occured while getting cache for parallax element with type';
            console.error(`${msg} '${data.type}'`, error);
          }
        }

        this.state.cache.push(data);
      });

      this.state.caching = false;
      resolve();
    });
  }
}

export default Parallax;
