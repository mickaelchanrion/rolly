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

export default utils;
