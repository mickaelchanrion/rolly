const config = {
  view: document.querySelector('.app'),
  preload: true,
  native: false,
  change(state) {
    document.documentElement.style.backgroundColor = `hsl(${(state.current / state.bounding) * 360}, 100%, 95%)`;
  },
  scenes: {
    scaleY: {
      transform(data) {
        const { previous, current, transformPrefix } = data.globalState;
        const { context } = data.sceneState.cache;
        const { transform } = data;
        const delta = current - previous;
        const scale = Math.min(1 + Math.abs(delta) / 75);
        context.style[transformPrefix] = `translate3d(0, ${transform}px, 0) scaleY(${scale})`;
        context.style.transformOrigin = `50% ${50 - delta * 2}%`;
      },
    },
    rotateZ: {
      transform(data) {
        const { previous, current, transformPrefix } = data.globalState;
        const { context } = data.sceneState.cache;
        const { transform } = data;
        const delta = current - previous;
        const rotationZ = delta / 2;
        const skew = delta / 2.5;
        context.style[transformPrefix] = `translate3d(0, ${transform}px, 0) rotateZ(${rotationZ}deg) skew(${skew}deg)`;
      },
    },
    rotateX: {
      transform(data) {
        const { previous, current, transformPrefix } = data.globalState;
        const { context } = data.sceneState.cache;
        const { transform } = data;
        const delta = current - previous;
        const rotationX = 1 + delta / 3;
        context.style[transformPrefix] = `translate3d(0, ${transform}px, 0) rotateX(${rotationX}deg)`;
      },
    },
  },
};

const r = window.rolly(config);
r.init();
