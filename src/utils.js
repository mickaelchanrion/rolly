const utils = {
  getCSSTransform(value, direction) {
    return direction === 'vertical'
      ? `translate3d(0, ${value}px, 0)`
      : `translate3d(${value}px, 0, 0)`;
  },

  getElements(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  exportState(currentState, toExport) {
    const state = { ...currentState };

    Object.keys(state)
      .filter(key => !toExport.includes(key))
      .forEach(key => delete state[key]);

    return state;
  },
};

export default utils;
