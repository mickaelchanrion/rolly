import utils from './utils';

export default class Scene {
  /**
   * The constructor.
   * @constructor
   * @param {object} context - The DOM context.
   * @param {object} options - Options of rolly.
   */
  constructor(context, options) {
    this.options = options;

    this.state = {
      caching: false,
      cache: null,
      inView: false,
      active: false,
      progress: 0,
      progressInView: 0,
    };

    this.DOM = { context };
  }

  /**
   * A promise to get cache for the scene.
   * The default cache object is as follow:
   *   - context: the DOM element of the scene.
   *   - type: the type of the scene.
   *   - top: distance between the top of the view and the top of the scene at the initial state.
   *   - bottom: distance between the top of the view and the bottom of the scene at the initial
   * state.
   *   - left: distance between the left of the view and the left of the scene at the initial state.
   *   - right: distance between the left of the view and the right of the scene at the initial state.
   *   - size: height of the scene (or width on horizontal mode).
   *   - speed: the speed of the scene.
   *   - trigger: the trigger position (e.g.: 'middle', 'bottom', '100px', '10%').
   *
   * The cache of the scene is extendable by providing a method in options: `options.scenes.${sceneType}.cache`.
   * This method gives an object that contains:
   *   - cache: the computed cache so far.
   *   - state: the state of the scene.
   *   - globalState: the state of the rolly instance
   * Simply return new properties in an object to extend the cache.
   *
   * @param {object} globalState - The state of the rolly instance.
   */
  cache(globalState) {
    return new Promise((resolve, reject) => {
      this.state.caching = true;

      const vertical = this.options.direction === 'vertical';
      // TODO: see when we need this
      // const scrollOffset = globalState.target;
      const scrollOffset = 0;

      const viewSize = vertical ? globalState.height : globalState.width;

      const { context } = this.DOM;
      context.style.display = null;
      const computedStyle = window.getComputedStyle(context);
      if (computedStyle.display === 'none') {
        this.state.cache = null;
        resolve(this.state.cache);
      }

      if (computedStyle.display === 'inline') {
        context.style.display = 'block';
      }

      context.style[globalState.transformPrefix] = null;

      const bounding = context.getBoundingClientRect();

      const type = context.getAttribute('data-scene');

      const options = this.options.scenes;
      const sceneOptions = options[type] || {};

      let cache = {
        context,
        type,
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

      const { trigger } = cache;

      let triggerOffset = 0;
      if (trigger === 'middle') triggerOffset = viewSize / 2;
      else if (trigger === 'end') triggerOffset = viewSize;
      // px from top
      else if (trigger.slice(-2) === 'px') triggerOffset = parseFloat(trigger);
      // percentage
      else if (trigger.slice(-1) === '%') {
        triggerOffset = (viewSize * parseFloat(trigger)) / 100;
      }

      cache.triggerOffset = triggerOffset;

      const start = vertical
        ? cache.top + cache.size / 2 - globalState.height / 2
        : cache.left + cache.size / 2 - globalState.width / 2;
      cache.offset = start - start * cache.speed;

      // Cache for custom scenes
      const getCache = sceneOptions.cache || options.cache;
      if (getCache) {
        if (getCache) {
          const extendedCache = getCache.call(this, {
            cache,
            globalState,
            sceneState: this.state,
          });

          cache = { ...cache, ...extendedCache };
        }
      }

      this.state.cache = cache;
      this.state.caching = false;
      resolve(this.state.cache);
    });
  }

  /**
   * Animation frame callback (called at every frames).
   * @param {object} globalState - The state of the rolly instance.
   */
  change(globalState) {
    if (!this.state.cache || this.state.caching) return false;

    const viewSize = this.options.direction === 'vertical'
      ? globalState.height
      : globalState.width;
    const { cache, active } = this.state;

    const { inView, transform, start } = this.calc(globalState);
    this.state.progress = this.getProgress(transform);
    this.state.progressInView = this.getProgressInView(start, viewSize);

    let { [cache.type]: sceneOptions, ...options } = this.options.scenes; // eslint-disable-line prefer-const

    if (!sceneOptions) {
      sceneOptions = {};
    }

    // The data we send to every custom functions
    const data = { globalState, sceneState: this.state, transform };

    // Check if inView value changed
    if (this.state.inView !== inView) {
      // Trigger appear/disappear callbacks
      const action = inView ? 'appear' : 'disappear';
      if (sceneOptions[action]) sceneOptions[action].call(this, data);
      else if (options[action]) options[action].call(this, data);

      this.state.inView = inView;
    }

    // Check and then trigger callbacks
    if (inView) {
      this.DOM.context.style.willChange = 'transform';

      // Run
      if (sceneOptions.change) sceneOptions.change.call(this, data);
      else if (options.change) options.change.call(this, data);

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
      if (sceneOptions.transform) sceneOptions.transform.call(this, data);
      else if (options.transform) options.transform.call(this, data);
      else {
        this.DOM.context.style[
          globalState.transformPrefix
        ] = utils.getCSSTransform(transform, this.options.direction);
      }
    } else {
      this.DOM.context.style[
        globalState.transformPrefix
      ] = utils.getCSSTransform(globalState.bounding, this.options.direction);
      this.DOM.context.style.willChange = null;
    }

    return true;
  }

  /**
   * Computes useful values for the scene.
   * @param {object} globalState - The state of the rolly instance
   * @return {object} Values as follow:
   * - transform: the transform value according to the speed
   * - start: distance between the start position of the view and the start position of the scene context (top|left)
   * - end: distance between the end position of the view and the end position of the scene context (bottom|right)
   * - inView: whether the scene is in the viewport
   */
  calc(globalState) {
    const vertical = this.options.direction === 'vertical';
    const {
      top, right, bottom, left, speed, offset,
    } = this.state.cache;
    const { width, height, current } = globalState;

    const transform = current * -speed - offset;

    const start = Math.round((vertical ? top : left) + transform);
    const end = Math.round((vertical ? bottom : right) + transform);
    const inView = end > 0 && start < (vertical ? height : width);

    return {
      transform, start, end, inView,
    };
  }

  /**
   * Gets the progress of the scene in relation to its trigger (default trigger position is 'middle').
   * @param {number} transform - The transform position of the scene.
   * @return {number} The progress position.
   */
  getProgress(transform) {
    const vertical = this.options.direction === 'vertical';
    const { cache } = this.state;
    const { triggerOffset } = cache;

    const position = -transform + triggerOffset;

    const progress = (position - (vertical ? cache.top : cache.left)) / cache.size;

    if (progress < 0 || progress > 1) return -1;
    return progress;
  }

  /**
   * Gets the progress of the scene in relation to the viewport.
   * @param {number} start - The distance between the start position of the view and the start.
   * @param {*} viewSize - The size of the view.
   */
  getProgressInView(start, viewSize) {
    return (viewSize - start) / (viewSize + this.state.cache.size);
  }

  /**
   * Checks if the trigger met the scene.
   * @param {boolean} active - Whether the scene is active.
   * @param {number} progress - The progress position of the scene related to the trigger
   * @return {boolean} The result.
   */
  checkEnter(active, progress) {
    return !active && progress >= 0 && progress <= 1;
  }

  /**
   * Checks if the trigger left the scene.
   * @param {boolean} active - Whether the scene is active.
   * @param {number} progress - The progress position of the scene related to the trigger
   * @return {boolean} The result.
   */
  checkLeave(active, progress) {
    return active && progress === -1;
  }
}
