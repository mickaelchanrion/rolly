const config = {
  view: document.querySelector('.app'),
  preload: true,
  native: false,
  scenes: {
    change(data) {
      const { context } = data.sceneState.cache;
      const { progress } = data.sceneState;

      const readableProgress = progress < 0 ? '-' : `${Math.round(progress * 100).toString()}%`;

      context.setAttribute('data-progress', readableProgress);
    },
    appear(data) {
      console.log(`[${data.sceneState.cache.type}] appear`);
    },
    enter(data) {
      console.log(`[${data.sceneState.cache.type}] enter`);
    },
    leave(data) {
      console.log(`[${data.sceneState.cache.type}] leave`);
    },
    disappear(data) {
      console.log(`[${data.sceneState.cache.type}] disappear`);
    },
  },
};

const debug = {
  state: {
    active: false,
  },

  init() {
    const scenes = document.querySelectorAll('.scene');
    const triggers = document.querySelector('.triggers');
    const markers = {};

    [...scenes].map((scene) => {
      const type = scene.getAttribute('data-scene');
      const trigger = scene.getAttribute('data-trigger') || r.options.scenes.trigger;
      if (!markers[trigger]) {
        markers[trigger] = [];
      }
      markers[trigger].push(type);
    });

    Object.entries(markers).map((marker) => {
      const types = marker[1].join(', ');
      const trigger = marker[0];
      let top = 0;
      if (trigger === 'middle') top = '50%';
      else if (trigger === 'end') top = '100%';
      // px from top
      else if (trigger.slice(-2) === 'px') top = `${parseFloat(trigger)}px`;
      // percentage
      else if (trigger.slice(-1) === '%') {
        top = trigger;
      }
      triggers.innerHTML += `<div class="trigger" data-scene="${types}" style="top: ${top};"></div>`;
    });

    const toggler = document.getElementById('debugToggler');
    toggler.addEventListener('change', this.toggle.bind(this));
  },

  toggle() {
    this.state.debug = !this.state.debug;

    const scenes = document.querySelectorAll('.scene');
    [...scenes].map((scene) => {
      this.state.debug
        ? scene.classList.add('scene--debug')
        : scene.classList.remove('scene--debug');
    });
    const triggers = document.querySelector('.triggers');
    triggers.style.display = this.state.debug ? 'block' : 'none';
  },
};

const r = window.rolly(config);
r.init();
debug.init();
