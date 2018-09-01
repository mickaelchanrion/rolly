import utils from './utils';

class Scenes {
  /**
   * The constructor.
   * @constructor
   * @param {object} context - The DOM context.
   * @param {object} options - Options of Rolly.
   */
  constructor(context, options) {
    this.options = options;

    this.state = { caching: false, cache: null };
    this.DOM = { context };
    this.DOM.els = utils.getElements(this.options.scenes.selector, context);
  }

  /**
   * Reload scenes with new options.
   * @param {object} options - Options of Rolly.
   */
  reload(options) {
    this.options = options;
    this.DOM.els = utils.getElements(
      this.options.scenes.selector,
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

      const current = rollyState.current;
      const rollySize = this.options.direction === 'vertical'
        ? rollyState.height
        : rollyState.width;
      const cache = this.state.cache[index];

      if (!cache) return;

      cache.progress = this.getProgress(current, rollySize, cache);
      const inView = this.checkInView(current, rollySize, cache);

      const sceneOptions = this.options.scenes[cache.name] || {};

      // Check inView value changed
      if (cache.inView !== inView) {
        cache.inView = inView;

        if (inView) {
          if (sceneOptions.appear) {
            sceneOptions.appear.call(this, cache, rollyState);
          }
        } else {
          if (sceneOptions.disappear) {
            sceneOptions.disappear.call(this, cache, rollyState);
          }
        }
      }

      if (inView) {
        // Check is entering
        if (this.checkEnter(cache.active, cache.progress)) {
          cache.active = true;
          if (sceneOptions.enter) {
            sceneOptions.enter.call(this, cache, rollyState);
          }

        } else if (this.checkLeave(cache.active, cache.progress)) {
          // Check is leaving
          cache.active = false;
          if (sceneOptions.leave) {
            sceneOptions.leave.call(this, cache, rollyState);
          }
        }

        // Run
        if (sceneOptions.run) {
          sceneOptions.run.call(this, cache, rollyState);
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
  getProgress(current, pageSize, cache) {
    const vertical = this.options.direction === 'vertical';

    let offset = current;
    const { trigger } = cache;
    if (trigger && typeof trigger === 'string') {
      if (trigger === 'middle') offset += pageSize / 2;
      else if (trigger === 'end') offset += pageSize;
      // px from top
      else if (trigger.slice(-2) === 'px') offset += parseFloat(trigger);
      // percentage
      else if (trigger.slice(-1) === '%') {
        offset += pageSize * parseFloat(trigger) / 100
      }
    }
    
    let progress = (offset - (vertical ? cache.top : cache.left)) / cache.size;
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

        const bounding = el.getBoundingClientRect();
        let cache = {
          el,
          name: el.getAttribute('data-scene'),
          top: isVertical ? bounding.top + scrollOffset : bounding.top,
          bottom: isVertical ? bounding.bottom + scrollOffset : bounding.bottom,
          left: isVertical ? bounding.left : bounding.left + scrollOffset,
          right: isVertical ? bounding.right : bounding.right + scrollOffset,
          size: isVertical ? bounding.height : bounding.width,
          trigger: el.getAttribute('data-trigger') || this.options.scenes.trigger,
          inView: false,
          progress: 0
        };

        // Do custom things for scenes
        if (this.options.scenes[cache.name]) {
          const getCache = this.options.scenes[cache.name].getCache;
          if (getCache) {
            const extend = getCache.call(this, { cache, state: rollyState });
            cache = { ...cache, ...extend };
          }
        }

        this.state.cache.push(cache);
      });

      this.state.caching = false;
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
  checkInView(current, rollySize, cache) {
    const vertical = this.options.direction === 'vertical';
    const { top, right, bottom, left, size } = cache;

    const start = Math.round((vertical ? top : left) - current);
    const end = Math.round((vertical ? bottom : right) - current);
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
  checkEnter(active, progress) {
    return !active && progress >= 0 && progress <= 1;
  }

  /**
   * Check if the trigger left the scene.
   * @param {boolean} active - Whether the scene is active.
   * @param {number} progress - The progress position of the scene related
   * to the trigger
   * @return {boolean} The result.
   */
  checkLeave(active, progress) {
    return active && progress === -1;
  }
}

export default Scenes;
