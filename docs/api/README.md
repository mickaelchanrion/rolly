---
sidebar: auto
---

# API reference

## Options

### direction

The scroll direction.

- type: `String`
- default: `'vertical'`
- accepted values:
  - `'vertical'`
  - `'horizontal'` <Badge text="alpha" type="warn"/>

::: warning
`horizontal` mode is still under development and has not been fully tested. You might discover some bugs.
:::

### listener

The element to listen for scroll events.

- type: `Element`
- default: `document.body`

### view

The element that contains all the scenes.

- type: `Element`
- default: The first element with the class `.rolly-view`

### native

If true, Rolly will use the native scroll bar and the native scroll behavior. Otherwise, Rolly will instantiate [virtual-scroll](https://github.com/ayamflow/virtual-scroll) and create a custom scroll bar.

- type: `Boolean`
- default: `false`

### preload

If true, Rolly will load every images contained in the scenes and then, refresh the cache and call the [ready](#ready) callback.

- type: `Boolean`
- default: `false`

### ready

The callback when Rolly is ready.

- type: `Function`
- default: `null`
- arguments:
  - `Object` globalState - The current [state of Rolly](#globalstate)

### change

Called on every frame while Rolly is in activity (updating transformations).

- type: `Function` with
- default: `null`
- arguments:
  - `Object` globalState - The current [state of Rolly](#globalstate)

### ease

The easing value between 0 and 1.

- type: `Number`
- default: `0.075`

### virtualScroll

See virtual-scroll [options](https://github.com/ayamflow/virtual-scroll#options) for the list of options.

- type: `Object`
- default:
  ```js
  {
    limitInertia: false,
    mouseMultiplier: 0.5,
    touchMultiplier: 1.5,
    firefoxMultiplier: 30,
    preventTouch: true
  }
  ```

### noScrollBar

Whether to display a custom scroll bar if the [native](#native) option is false.

- type: `Boolean`
- default: `false`

::: tip
For some projects, this option is useful. But most of the time, the non-presence of a scroll bar might ending-up with an UX issue.
:::

### scenes

Options for scenes.

- type: `Object`
- default:
  ```js
  {
    selector: '[data-scene]',
    trigger: 'middle',
    speed: 1,
  }
  ```

#### All scenes options

##### scenes.selector

The CSS selector for scenes.

- type: `String`
- default: `'[data-scene]'`

##### scenes.speed

The speed of scenes by default.

- type: `Float`
- default: `1`

Some examples:

- `1` will be a normal scroll speed
- `2` is twice faster
- `0.5` is half the normal speed
- a negative value will make the scene moving in the opposite way of the scroll sens

##### scenes.trigger

The scene will throw [enter](#scenes-enter) and [leave](#scenes-leave) callbacks when it meets its trigger.

- type: `String`
- default: `'middle'`,
- accepted values:
  - `'start'`
  - `'middle'`
  - `'end'`
  - `'20px'`, any value in pixels (`'0px'` === `'start'`)
  - `'10%'`, any value in percentage (`'0%'` === `'start'` and `'100%'` === `'end'`)

##### scenes.cache

The cache of a scene is extendable using this function. This is useful in case you need some extra cached data in callbacks.

You have to return your extended cache data in an object.

- type: `Function`
- default: `undefined`
- arguments:
  - `Object` data - Contains:
    - cache - The computed cache so far
    - globalState - The [state of Rolly](#globalstate)
    - sceneState - The [state of the scene](#scenestate)

##### scenes.change

Called on every frame for every scenes visible in the view while Rolly is in activity (updating transformations).

- type: `Function`
- default: `undefined`
- arguments:
  - `Object` data - Contains:
    - globalState - The current [state of Rolly](#globalstate)
    - sceneState - The current [state of the scene](#scenestate)
    - transform - The computed transform value (in pixels)

##### scenes.appear

Called when a scene appears in the view.

- type: `Function`
- default: `undefined`
- arguments:
  - `Object` data - Contains:
    - globalState - The current [state of Rolly](#globalstate)
    - sceneState - The current [state of the scene](#scenestate)
    - The computed transform value (in pixels)

##### scenes.disappear

Called when a scene disappears from the view.

- type: `Function`
- default: `undefined`
- arguments:
  - `Object` data - Contains:
    - globalState - The current [state of Rolly](#globalstate)
    - sceneState - The current [state of the scene](#scenestate)
    - The computed transform value (in pixels)

##### scenes.enter

Called when the trigger enters the scene.

- type: `Function`
- default: `undefined`
- arguments:
  - `Object` data - Contains:
    - globalState - The current [state of Rolly](#globalstate)
    - sceneState - The current [state of the scene](#scenestate)
    - The computed transform value (in pixels)

<video class="video" width="690" height="400" controls loop>
  <source src="/scene-enter.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

##### scenes.leave

Called when the trigger leaves the scene.

- type: `Function`
- default: `undefined`
- arguments:
  - `Object` data - Contains:
    - globalState - The current [state of Rolly](#globalstate)
    - sceneState - The current [state of the scene](#scenestate)
    - The computed transform value (in pixels)

<video class="video" width="690" height="400" controls loop>
  <source src="/scene-leave.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

##### scenes.transform

Overrides the default transform function of Rolly. Useful in case you want to apply any custom CSS to the scene.

- type: `Function`
- default: `undefined`
- arguments:
  - `Object` data - Contains:
    - globalState - The current [state of Rolly](#globalstate)
    - sceneState - The current [state of the scene](#scenestate)
    - The computed transform value (in pixels)

#### scenes.{sceneType} - specific to a scene

All these options and callbacks (except [selector](#scenes-selector)) can be specific to a type of scene. To do so, they goes into an object keyed by the [type](#data-scene) of the scene, in the [scenes options](#scenes).

e.g.:

```html
<div data-scene="hero"><!-- the hero content --></div>
```

```js
rolly({
  scenes: {
    trigger: 'start',
    appear(data) {
      console.log('a scene appears', data.sceneState.cache.context);
    },
    disappear(data) {
      console.log('a scene appears', data.sceneState.cache.context);
    },
    // options specific to the scene 'hero'
    hero: {
      trigger: 'middle',
      speed: 0.5,
      appear(data) {
        console.log('hero scene appears', data.sceneState.cache.context);
      },
      disappear(data) {
        console.log('hero scene appears', data.sceneState.cache.context);
      },
    },
  },
});
```

::: tip
Any specific callback overrides global callbacks.
:::

## Data attributes as option

You can provide some data attributes as options

### data-scene

By default, this attribute is the selector of scenes. The scene has to be typed using this attribute if you want to assign a [specific behavior](#scenes-scenetype-specific-to-a-scene) to one or multiple scenes.

### data-speed

Overrides [this scene option](#scenes-speed).

### data-trigger

Overrides [this scene option](#scenes-trigger).

## Methods

### init

Initializes the Rolly instance:
- adds DOM classes
- if [native](#native), adds a fake height for scroll and sets scenes to a fixed position
- else if [noScrollBar](#noscrollbar) is false, adds a fake scroll bar
- calls the method [on](#on)

### on

Enables the Rolly instance:
- starts listening events (scroll and resize)
- requests an animation frame if `rAF` is true
- parameters:
  - `Boolean` rAF - Whether to request an animation frame
    - default: `true`

### off

Disables the Rolly instance:
- stops listening events (scroll and resize)
- cancels any requested animation frame if `cAF` is true
- parameters:
  - `Boolean` cAf - Whether to cancel a requested animation frame
    - default: `true`

### destroy

Destroys the Rolly instance:
- removes DOM classes
- if [native](#native), removes the fake height for scroll
- else if [noScrollBar](#noscrollbar) is false, removes the fake scroll bar
- call the method [off](#off)

### reload

Reloads the Rolly instance with new options.
- parameters:
  - `Object` options - The new options
    - default: the previous options

### scrollTo

Scrolls to a target.
- parameters:
  - `Number|Element` target - The target to scroll to
  - `Object` options

Available options:
  - `Number` offset - An offset
    - default: `0`
  - `String` position - The ending position in the view
    - default: `'start'`
    - accepted values:
      - `'start'`
      - `'center'`
      - `'end'`
  - `Function` callback - A call
    - default: `null`
    - arguments:
      - `Object` globalState - The current [state of Rolly](#globalstate)

### update

Updates the states and re-setup all the cache of the Rolly instance. Useful if the size of the view changed.

## States

### globalState

The state of Rolly contains:
- `Number` current - The current scroll value
- `Number` previous - The scroll value at the previous animation frame
- `Number` target - The targeted scroll value
- `Number` width - The width of the view
- `Number` height - The height of the view
- `Number` bounding - The max scroll value
- `Boolean` ready - Whether the Rolly instance is ready
- `Boolean` preLoaded - Whether images to pre-load are loaded
- `String` transformPrefix - The corresponding vendor prefix for the CSS transform

### sceneState

The state of a scene:
- `Boolean` caching - Whether the Rolly instance is caching some data
- `Object` cache - The cached data:
  - `Element` context - The DOM element of the scene
  - `String` type - The type of the scene
  - `Number` top - The distance between the top of the view and the top of the scene at the initial state
  - `Number` bottom - The distance between the top of the view and the bottom of the scene at the initial state
  - `Number` left - The distance between the left of the view and the left of the scene at the initial state
  - `Number` right - The distance between the left of the view and the right of the scene at the initial state
  - `Number` size - The height of the scene (or width on horizontal mode)
  - `Number` speed - The speed of the scene
  - `String` trigger - The trigger position (e.g.: 'middle', 'bottom', '100px', '10%')
- `Boolean` inView - Whether the scene is visible in the view
- `Boolean` active - Whether the trigger of the scene is in the scene
- `Number` progress - The progress of the scene in relation to its trigger
- `Number` progressInView - The progress of the scene in relation to the view

::: tip
The cache of a scene [is extendable](#scenes-cache).
:::