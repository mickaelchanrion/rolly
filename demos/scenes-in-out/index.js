// We don't want to show appear animations at the beginning
let anim = false;
setTimeout(() => (anim = true)); // eslint-disable-line no-return-assign

const triggers = { top: 200, bottom: 200 };

const { anime } = window;

const animeIn = (targets, isUp) => anime({
  targets,
  duration: 800,
  easing: 'easeOutQuart',
  translateY: 0,
  scaleY: 1,
  opacity: 1,
  begin: () => (targets.style.transformOrigin = isUp ? 'top' : 'bottom'), // eslint-disable-line no-return-assign
});

const animeOut = (targets, isUp) => anime({
  targets,
  duration: 800,
  easing: 'easeInQuart',
  translateY: isUp ? -200 : 200,
  scaleY: { value: 1.5, duration: 600 },
  opacity: 0,
  begin: () => (targets.style.transformOrigin = isUp ? 'bottom' : 'top'), // eslint-disable-line no-return-assign
});

const config = {
  view: document.querySelector('.app'),
  preload: false,
  native: false,
  scenes: {
    change(data) {
      const { sceneState, globalState, transform } = data;
      const { cache } = sceneState;
      const { context } = cache;
      const { previous, current } = globalState;

      const delta = current - previous;
      const isUp = delta >= 0;

      if (!('appeared' in data.sceneState)) {
        sceneState.appeared = !anim;
        // Hide the scene by default
        if (!sceneState.appeared) {
          const child = context.children[0];
          child.style.opacity = 0;
          child.style.transform = 'translateY(200px) scaleY(1.5)';
        }
      }

      const distanceTop = cache.bottom + transform;
      const distanceBottom = globalState.height - (cache.top + transform);

      // The scene is hidden, let's see if we can show it
      if (!sceneState.appeared) {
        // Scroll up
        if (isUp) {
          if (distanceBottom > triggers.bottom && distanceTop > triggers.top) {
            sceneState.appeared = true;
            anime.remove(context.children[0]);
            animeIn(context.children[0], true);
          }
        } else if (distanceTop > triggers.top && distanceBottom > triggers.bottom) {
        // Scroll down
          sceneState.appeared = true;
          anime.remove(context.children[0]);
          animeIn(context.children[0], false);
        }
      } else {
      // the scene is visible, let's see if we can hide it
        // Scroll up
        if (isUp) { // eslint-disable-line
          if (distanceTop < triggers.top) {
            sceneState.appeared = false;
            anime.remove(context.children[0]);
            animeOut(context.children[0], true);
          }
        } else if (distanceBottom < triggers.bottom) {
        // Scroll down
          sceneState.appeared = false;
          anime.remove(context.children[0]);
          animeOut(context.children[0], false);
        }
      }
    },
  },
};

const r = window.rolly(config);
r.init();
