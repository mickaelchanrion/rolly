<h1 align="center">
  <a href="https://rolly.maj.digital"><img src="/rolly.png" width="250"/></a>
  <br>
  rolly.js
</h1>
<br>
<p align="center">Custom scroll with inertia, smooth parallax and scenes manager.</p>
<p align="center">
  <a href="https://www.npmjs.com/package/rolly.js">
		<img src="https://img.shields.io/npm/v/rolly.js.svg" alt="Version">
	</a>
  <a href="https://opensource.org/licenses/MIT">
		<img src="https://img.shields.io/npm/l/rolly.js.svg" alt="MIT License">
	</a>
</p>

## What is rolly.js?

rolly.js is a library written in javascript for building pages that moves smoothly.

This library offers 3 main features:

- change the behavior of the default scroll for a smoother effect
- quickly and flexibly add a customizable parallax effect to any element on a page
- add any behavior to your scenes bound to the scroll state (custom transforms, seek animations…)

Checkout the [demo](https://rolly.maj.digital/)!

## Documentation

The documentation is available here: [https://mickaelchanrion.github.io/rolly/](https://mickaelchanrion.github.io/rolly/)

## Getting started

<details><summary>Click to expand</summary>
<p>

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
      background: linear-gradient(
        to top,
        rgb(252, 92, 125),
        rgb(106, 130, 251)
      );
      border-radius: 5px;
    }

    [data-scene]:first-child {
      background: linear-gradient(
        to bottom,
        rgb(168, 192, 255),
        rgb(63, 43, 150)
      );
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

const r = rolly({
  view: document.querySelector('.app'),
  native: true,
  // other options
});
r.init();
```

</p>
</details>

## Examples

You will find some examples [here](https://codepen.io/collection/AyEJzY/).

## Roadmap

- [x] Create documentation
- [x] Create some examples
- [ ] Fix the scrollTo function
- [ ] Test and fix [issues](https://mickaelchanrion.github.io/rolly/api/#vertical) when `vertical` options is set to `false`
- [ ] Change the way the easing is computed. Probably with a clean Lerp function
- [ ] Implement different easing for each scene (it would add a nice organic effect 🤩)
- [Need a feature?](https://github.com/mickaelchanrion/rolly/issues/new?labels=feature+request)

## Contributors

- [Mickael Chanrion](https://github.com/mickaelchanrion/)
- [MAJ digital](https://github.com/majdigital/)
