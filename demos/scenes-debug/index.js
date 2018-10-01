const rolly = new Rolly({
  view: document.querySelector('.app'),
  preload: true,
  native: false,
  scenes: {
    all: {
      run(data) {
        const { context } = data.sceneState.cache;
        const { progress } = data.sceneState;

        const readableProgress = progress < 0
          ? '-'
          : Math.round(progress * 100).toString() + '%';

        context.setAttribute('data-progress', readableProgress);
      },
      appear(data) {
        console.log(`[${data.sceneState.cache.name}] appear`);
      },
      enter(data) {
        console.log(`[${data.sceneState.cache.name}] enter`);
      },
      leave(data) {
        console.log(`[${data.sceneState.cache.name}] leave`);
      },
      disappear(data) {
        console.log(`[${data.sceneState.cache.name}] disappear`);
      },
    },
  },
});

rolly.init();

const debug = {
  state: {
    active: false,
  },

  init() {
    const scenes = document.querySelectorAll('.scene');
    const triggers = document.querySelector('.triggers');
    const markers = {};

    [...scenes].map(scene => {
      const name = scene.getAttribute('data-scene');
      const trigger = scene.getAttribute('data-trigger') || rolly.options.scenes.trigger;
      if (!markers[trigger]) {
        markers[trigger] = [];
      }
      markers[trigger].push(name);
    });

    Object.entries(markers).map(marker => {
      const names = marker[1].join(', ');
      let trigger = marker[0];
      let top = 0;
      if (trigger === 'middle') top = '50%';
      else if (trigger === 'end')  top = '100%'
      // px from top
      else if (trigger.slice(-2) === 'px') top = `${parseFloat(trigger)}px`;
      // percentage
      else if (trigger.slice(-1) === '%') {
        top = trigger;
      }
      triggers.innerHTML += `<div class="trigger" data-scene="${names}" style="top: ${top};"></div>`;
    });

    const toggler = document.getElementById('debugToggler');
    toggler.addEventListener('change', this.toggle.bind(this));
  },

  toggle() {
    this.state.debug = !this.state.debug;

    const scenes = document.querySelectorAll('.scene');
    [...scenes].map(scene => {
      this.state.debug
        ? scene.classList.add('scene--debug')
        : scene.classList.remove('scene--debug');
    });
    const triggers = document.querySelector('.triggers');
    triggers.style.display = this.state.debug ? 'block' : 'none';
  }
}

debug.init();
