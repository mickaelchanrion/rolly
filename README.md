# rolly

## Basic usage

- Setup the markup

```html
<body>
  <style>
    [data-scene] {
      max-width: 800px;
      padding: 10vh 50px;
      margin: 10vh auto;
      font-family: sans-serif;
      font-size: 100px;
      text-align: center;
      background-color: RGBA(213, 241, 238, 0.2);
    }
  </style>
  <div class="app">
    <div data-scene data-speed="0.5">rolly.js</div>
      <div data-scene>provides…</div>
      <div data-scene data-speed="1.2">some delicious…</div>
      <div data-scene data-speed="1.4">very delicious…</div>
      <div data-scene data-speed="1.6">parallax effects ❤️</div>
  </div>
</body>
```

- Import the CSS of rolly

Import the CSS of rolly: `rolly/css/style.css`

- Initialize rolly

```js
import rolly from 'rolly.js';

const view = document.querySelector('.app');
const r = rolly({
  view,
  native: true,
  // other options
});
r.init();
```
