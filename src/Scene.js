import utils from './utils';

export default class Scene {
  /**
   * The constructor.
   * @constructor
   * @param {object} context - The DOM context.
   * @param {object} options - Options of Rolly.
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
      transform: 0,
    };

    this.DOM = { context };
  }

  /**
   * A promise to get cache for the scene.
   * The default cache object is as follow:
   *   - context: the DOM element.
   *   - name: the name of the scene.
   *   - top: distance between the top of the view element and the top of
   *     the element.
   *   - bottom: distance between the top of the view element and the bottom
   *     of the element.
   *   - left: distance between the left of the view element and the left of
   *     the element.
   *   - right: distance between the left of the view element and the right
   *     of the element.
   *   - size: height of the element (or width on horizontal mode).
   *   - speed: the speed of the scene.
   *   - trigger: the trigger position (e.g: 'middle', 'bottom', '100px', '10%').
   *
   * The cache of the scene is extendable by providing a method at:
   * `options.scenes.${sceneName}.cache`.
   * This method provides an object that contains:
   *   - cache: the computed cache so far.
   *   - state: the state of the scene.
   *   - globalState: the state of the Rolly instance
   * Simply return new properties in an object to extend the cache.
   *
   * @param {object} globalState - The state of the Rolly instance.
   */
  cache(globalState) {
    return new Promise((resolve, reject) => {
      this.state.caching = true;

      const vertical = this.options.direction === 'vertical';
      // TODO: see when we need this
      // const scrollOffset = globalState.target;
      const scrollOffset = 0;

      const { context } = this.DOM
      context.style.display = null;
      const computedDisplay = window.getComputedStyle(context).display;
      if (computedDisplay === 'none') {
        return this.state.cache = null;
      }

      if (computedDisplay === 'inline') {
        context.style.display = 'block';
      }

      context.style[globalState.transformPrefix] = null;

      const bounding = context.getBoundingClientRect();

      let cache = {
        context,
        name: context.getAttribute('data-scene'),
        top: vertical ? bounding.top + scrollOffset : bounding.top,
        bottom: vertical ? bounding.bottom + scrollOffset : bounding.bottom,
        left: vertical ? bounding.left : bounding.left + scrollOffset,
        right: vertical ? bounding.right : bounding.right + scrollOffset,
        size: vertical ? bounding.height : bounding.width,
        speed: context.getAttribute('data-speed') || this.options.scenes.speed,
        trigger: context.getAttribute('data-trigger') || this.options.scenes.trigger,
      };

      const start = vertical
        ? cache.top + cache.size / 2 - globalState.height / 2
        : cache.left + cache.size / 2 - globalState.width / 2;
      cache.offset = start - start * cache.speed

      // Cache for custom scenes
      if (this.options.scenes[cache.name]) {
        const getCache = this.options.scenes[cache.name].cache;
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
      resolve();
    });
  }

  /**
   * Animation frame callback (called at every frames).
   * @param {object} globalState - The state of the Rolly instance.
   */
  run(globalState) {
    if (!this.state.cache || this.state.caching) return false;

    const viewSize = this.options.direction === 'vertical'
      ? globalState.height
      : globalState.width;
    const { cache, active } = this.state;

    const { inView, transform, start } = this.calc(globalState);
    this.state.progress = this.getProgress(transform, viewSize);
    this.state.progressInView = this.getProgressInView(start, viewSize);

    const sceneOptions = this.options.scenes[cache.name] || {};
    const allScenesOptions = this.options.scenes['all'] || {};

    // The data we send to every custom functions
    const data = { globalState, sceneState: this.state, transform };

    // Check if inView value changed
    if (this.state.inView !== inView) {

      // Trigger appear/disappear callbacks
      const action = inView ? 'appear' : 'disappear';
      allScenesOptions[action] && allScenesOptions[action].call(this, data);
      sceneOptions[action] && sceneOptions[action].call(this, data);

      this.state.inView = inView;
    }

    // Check and then trigger enter/leave callbacks
    if (inView) {
      // Run
      allScenesOptions.run && allScenesOptions.run.call(this, data);
      sceneOptions.run && sceneOptions.run.call(this, data);

      // Enter
      if (this.checkEnter(active, this.state.progress)) {
        this.state.active = true;
        allScenesOptions.enter && allScenesOptions.enter.call(this, data);
        sceneOptions.enter && sceneOptions.enter.call(this, data);
      }

      // Leave
      else if (this.checkLeave(active, this.state.progress)) {
        this.state.active = false;
        allScenesOptions.leave && allScenesOptions.leave.call(this, data);
        sceneOptions.leave && sceneOptions.leave.call(this, data);
      }

      // Transform
      if (allScenesOptions.transform || sceneOptions.transform) {
        allScenesOptions.transform && allScenesOptions.transform.call(this, data);
        sceneOptions.transform && sceneOptions.transform.call(this, data);
      } else {
        this.DOM.context.style[globalState.transformPrefix] = utils.getCSSTransform(
          transform,
          this.options.direction
        );
      }
      this.DOM.context.style.visibility = null;
    } else {
      this.DOM.context.style.visibility = 'hidden';
    }
  }

  /**
   * Computes useful values for the scene.
   * @param {object} globalState - The state of the Rolly instance
   * @return {object} Values as follow:
   * - transform: the transform value according to the speed
   * - start: distance between the start position of the view and the start
   * position of the scene context (top|left)
   * - end: distance between the end position of the view and the end position
   * of the scene context (bottom|right)
   * - inView: whether the scene is in the viewport
   */
  calc(globalState) {
    const vertical = this.options.direction === 'vertical';
    const  { top, right, bottom, left, speed, offset } = this.state.cache;
    const { width, height, current } = globalState;

    let transform = current * -speed - offset;

    const start = Math.round((vertical ? top : left) + transform);
    const end = Math.round((vertical ? bottom : right) + transform);
    const inView = end > 0 && start < (vertical ? height : width);

    return { transform, start, end, inView };
  }

  /**
   * Gets the progress position of the scene in relation to the trigger
   * (default trigger position is 'middle').
   * @param {number} transform - The transform position of the scene.
   * @param {number} viewSize - The size of the view.
   * @return {number} The progress position.
   */
  getProgress(transform, viewSize) {
    const vertical = this.options.direction === 'vertical';
    const { cache } = this.state;
    const { trigger } =  cache;

    let position = -transform;

    if (trigger === 'middle') position += viewSize / 2;
    else if (trigger === 'end') position += viewSize;
    // px from top
    else if (trigger.slice(-2) === 'px') position += parseFloat(trigger);
    // percentage
    else if (trigger.slice(-1) === '%') {
      position += viewSize * parseFloat(trigger) / 100
    }

    let progress = (position - (vertical ? cache.top : cache.left)) / cache.size;

    if (progress < 0 || progress > 1) return -1;
    return progress;
  }

  /**
   * Gets the progress position of the scene in relation to the viewport.
   * @param {number} start - The distance between the start position of the view and the start.
   * @param {*} viewSize - The size of the view.
   */
  getProgressInView(start, viewSize) {
    return (viewSize - start) / (viewSize + this.state.cache.size);
  }

  /**
   * Checks if the trigger met the scene.
   * @param {boolean} active - Whether the scene is active.
   * @param {number} progress - The progress position of the scene related
   * to the trigger
   * @return {boolean} The result.
   */
  checkEnter(active, progress) {
    return !active && progress >= 0 && progress <= 1;
  }

  /**
   * Checks if the trigger left the scene.
   * @param {boolean} active - Whether the scene is active.
   * @param {number} progress - The progress position of the scene related
   * to the trigger
   * @return {boolean} The result.
   */
  checkLeave(active, progress) {
    return active && progress === -1;
  }
}
