import utils from './utils';

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

export default Scenes;
