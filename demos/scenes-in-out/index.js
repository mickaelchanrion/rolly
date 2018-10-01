const triggers = { top: 200, bottom: 200 };

const animeIn = (targets, isUp) => anime({
  targets,
  duration: 800,
  easing: 'easeOutQuart',
  translateY: 0,
  scaleY: 1,
  opacity: 1,
  begin: () => targets.style.transformOrigin = isUp ? 'top' : 'bottom',
});

const animeOut = (targets, isUp) => anime({
  targets,
  duration: 800,
  easing: 'easeInQuart',
  translateY: isUp ? -200 : 200,
  scaleY: { value: 1.5, duration: 600 },
  opacity: 0,
  begin: () => targets.style.transformOrigin = isUp ? 'bottom' : 'top',
});

const rolly = new Rolly({
  view: document.querySelector('.app'),
  preload: false,
  native: false,
  scenes: {
    all: {
      run(data) {
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
          }
          // Scroll down
          else {
            if (distanceTop > triggers.top && distanceBottom > triggers.bottom) {
              sceneState.appeared = true;
              anime.remove(context.children[0]);
              animeIn(context.children[0], false);
            }
          }
        }
        // the scene is visible, let's see if we can hide it
        else {
          // Scroll up
          if (isUp) {
            if (distanceTop < triggers.top) {
              sceneState.appeared = false;
              anime.remove(context.children[0]);
              animeOut(context.children[0], true);
            }
          }
          // Scroll down
          else {
            if (distanceBottom < triggers.bottom) {
              sceneState.appeared = false;
              anime.remove(context.children[0]);
              animeOut(context.children[0], false);
            }
          }
        }
      },
    },
  },
});

// We don't want to show appear animations at start up
let anim = false;
setTimeout(() => anim = true);

rolly.init();
window.rolly = rolly;