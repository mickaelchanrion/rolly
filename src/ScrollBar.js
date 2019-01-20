import utils from './utils';

export default class ScrollBar {
  /**
   * The constructor.
   * @constructor
   * @param {object} parent - The parent DOM of the scroll bar.
   * @param {object} globalState - The state of the rolly instance.
   * @param {function} setTarget - The {@link Rolly#setTarget} method.
   * @param {object} options - Options of rolly.
   */
  constructor(parent, globalState, setTarget, options) {
    this.options = options;

    this.DOM = this.render(parent);

    this.state = {
      clicked: false,
      thumb: { size: 0 },
    };

    this.cache(globalState);

    this.setTarget = setTarget;
  }

  /**
   * Sets cache for scroll bar.
   * @param {object} globalState - The state of the rolly instance.
   */
  cache(globalState) {
    this.state.cache = {
      bounding: globalState.bounding,
      viewSize: this.options.direction === 'vertical'
        ? globalState.height
        : globalState.width,
    };
    this.updateThumbSize();
  }

  /**
   * Animation frame callback (called at every frames).
   * @param {object} globalState - The state of the rolly instance.
   */
  change({ current, transformPrefix }) {
    const { bounding, viewSize } = this.state.cache;
    const value = Math.abs(current) / (bounding / (viewSize - this.thumbSize))
      + this.thumbSize / 0.5
      - this.thumbSize;
    const clamp = Math.max(0, Math.min(value - this.thumbSize, value + this.thumbSize));
    this.DOM.thumb.style[transformPrefix] = utils.getCSSTransform(clamp.toFixed(2), this.options.direction);
  }

  /**
   * Computes the target value from the scroll bar (based on event client viewport position).
   * @param {number} client - The client position.
   * @return {number} The target.
   */
  calc(client) {
    return client * (this.state.cache.bounding / this.state.cache.viewSize);
  }

  /**
   * Renders the scroll bar.
   * @param {object} parent - The parent DOM of the scroll bar.
   * @return {object} - The list of DOM elements (parent, context, thumb).
   */
  render(parent) {
    const context = document.createElement('div');
    context.className = `rolly-scroll-bar rolly-${this.options.direction}`;

    const thumb = document.createElement('div');
    thumb.className = 'rolly-scroll-bar-thumb';

    context.appendChild(thumb);
    parent.appendChild(context);

    return { parent, context, thumb };
  }

  /**
   * Starts listening events (mouse interactions).
   */
  on() {
    this.boundFns = {
      click: this.click.bind(this),
      mouseDown: this.mouseDown.bind(this),
      mouseMove: this.mouseMove.bind(this),
      mouseUp: this.mouseUp.bind(this),
    };

    this.DOM.context.addEventListener('click', this.boundFns.click);
    this.DOM.context.addEventListener('mousedown', this.boundFns.mouseDown);

    document.addEventListener('mousemove', this.boundFns.mouseMove);
    document.addEventListener('mouseup', this.boundFns.mouseUp);
  }

  /**
   * Stops listening events (mouse interactions).
   */
  off() {
    if (!this.boundFns) return false;
    this.DOM.context.removeEventListener('click', this.boundFns.click);
    this.DOM.context.removeEventListener('mousedown', this.boundFns.mouseDown);

    document.removeEventListener('mousemove', this.boundFns.mouseMove);
    document.removeEventListener('mouseup', this.boundFns.mouseUp);
    delete this.boundFns;
    return true;
  }

  /**
   * Click event callback.
   * @param {object} event - The event data.
   */
  click(event) {
    const value = this.calc(this.options.direction === 'vertical' ? event.clientY : event.clientX);
    this.setTarget(value);
  }

  /**
   * Mouse down event callback.
   * @param {object} event - The event data.
   */
  mouseDown(event) {
    event.preventDefault();
    if (event.which === 1) {
      this.state.clicked = true;
    }
    this.DOM.parent.classList.add('is-dragging-scroll-bar');
  }

  /**
   * Mouse move event callback.
   * @param {object} event - The event data.
   */
  mouseMove(event) {
    if (this.state.clicked) {
      const value = this.calc(this.options.direction === 'vertical' ? event.clientY : event.clientX);
      this.setTarget(value);
    }
  }

  /**
   * Mouse up event callback.
   * @param {object} event - The event data.
   */
  mouseUp(event) {
    this.state.clicked = false;
    this.DOM.parent.classList.remove('is-dragging');
  }

  /**
   * Gets the size of the thumb (heigh or width on horizontal mode).
   * @return {number} - The size of the thumb.
   */
  get thumbSize() {
    return this.state.thumb.size;
  }

  /**
   * Sets the size of the thumb (heigh or width on horizontal mode).
   * @param {number} - The size of the thumb.
   */
  set thumbSize(size) {
    this.state.thumb.size = size;
    const prop = this.options.direction === 'vertical' ? 'height' : 'width';
    this.DOM.thumb.style[prop] = `${size}px`;
  }

  /**
   * Updates the size of the thumb.
   * This method is called when the content changes or on a resize for instance.
   */
  updateThumbSize() {
    const { bounding } = this.state.cache;
    if (bounding <= 0) {
      this.DOM.context.classList.add('is-hidden');
      this.thumbSize = 0;
    }

    this.DOM.context.classList.remove('is-hidden');
    const { viewSize } = this.state.cache;
    this.thumbSize = viewSize * (viewSize / (bounding + viewSize));
  }

  /**
   * Destroy the scroll bar.
   * - removes from the DOM.
   * - calls {@link ScrollBar#off}.
   */
  destroy() {
    this.off();
    this.DOM.parent.removeChild(this.DOM.context);
  }
}
