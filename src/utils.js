const utils = {
  getCSSTransform(value, vertical) {
    return vertical
      ? `translate3d(0, ${value}px, 0)`
      : `translate3d(${value}px, 0, 0)`;
  },

  getElements(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },
};

export default utils;
