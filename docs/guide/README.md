# Introduction

## What is rolly.js?

rolly is a library written in javascript for building pages that moves smoothly.

This library was created with the aim of offering three features:
- change the behavior of the default scroll for a smoother effect
- quickly and flexibly add a customizable parallax effect to any element on a page
- create interaction scenes related to the scroll position in a page

## Getting started

### Download rolly

```bash
$ npm install rolly.js
```

Or add it as a script:
```html
<script src="https://unpkg.com/rolly.js@<VERSION>/dist/rolly.min.js"></script>
```

### Setup the markup

Create your scenes:

```html
<body>
  <style>
    [data-scene] {
      max-width: 800px;
      padding: 10vh 50px;
      margin: 10vh auto;
      font-family: sans-serif;
      font-size: 100px;
      color: #fff;
      text-align: center;
      background: linear-gradient(to top, rgb(252, 92, 125), rgb(106, 130, 251));
      border-radius: 5px;
    }

    [data-scene]:first-child {
      background: linear-gradient(to bottom, rgb(168, 192, 255), rgb(63, 43, 150));
    }

    [data-scene]:last-child {
      margin-bottom: 50vh;
    }
  </style>
  <div class="app">
    <div data-scene data-speed="0.2">rolly.js</div>
    <div data-scene>provides…</div>
    <div data-scene data-speed="1.2">some delicious…</div>
    <div data-scene data-speed="1.4">very delicious…</div>
    <div data-scene data-speed="1.6">parallax effects ❤️</div>
  </div>
</body>
```

### Import the CSS of rolly

Import the CSS of rolly: `node_modules/rolly.js/css/style.css`

Or from unpkg: `https://unpkg.com/rolly.js@<VERSION>/css/style.css`

### Initialize rolly

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