# Introduction

## What is rolly.js?

rolly is a library written in javascript for building pages that moves smoothly.

This library has been created with the idea of offering three features:
- change the behavior of the default scroll for a smoother effect
- quickly and flexibly add a customizable parallax effect to any element on a page
- create interaction scenes related to the scroll position in a page

## Quick start

- Setup the markup

Here is a simple demo:
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

- Import the CSS of rolly: `rolly/css/style.css`

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
