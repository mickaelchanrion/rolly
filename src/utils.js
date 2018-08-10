const utils = {
  getCSSTransform(value, direction) {
    return direction === 'vertical'
      ? `translate3d(0, ${value}px, 0)`
      : `translate3d(${value}px, 0, 0)`;
  },

  getElements(selector, context = document) {
    const els = context.querySelectorAll(selector);
    return Array.prototype.slice.call(els, 0);
  },

  exportState(currentState) {
    const state = { ...currentState };
    const toExport = [
      'current',
      'previous',
      'target',
      'width',
      'height',
      'bounding'
    ];

    Object.keys(state)
      .filter(key => !toExport.includes(key))
      .forEach(key => delete state[key]);

    return state;
  }
};

export default utils;
