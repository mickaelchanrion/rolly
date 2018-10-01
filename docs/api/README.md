---
sidebar: auto
---

# API reference

## Options

### `direction`

- type: `string`
- default: `"vertical"`
- available values: `"vertical"` | `"horizontal"` <Badge text="alpha" type="warn"/>

The scroll direction.

::: warning
`horizontal` mode is still under development and has not been fully tested. You might discover some issues.
::: 

### `native`

- type: `boolean`
- default: `false`

If `true`, Rolly will use the default scrollbar and native scroll behavior. Otherwise, Rolly will instantiate [virtual-scroll](https://github.com/ayamflow/virtual-scroll).

### `noScrollbar`

- type: `boolean`
- default: `false`

### `ease`

- type: `number`
- default: `0.075`

### `preload`

- type: `boolean`
- default: `false`

### `virtualScroll`

- type: `Object|boolean`
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

See virtual-scroll [options](https://github.com/ayamflow/virtual-scroll#options) for more informations.

### `listener`

- type: `DOM Element`
- default: `document.body`

If `native === true`,  n-scroll events listener & parent container for all elements

### `section`

- type: `boolean`
- default: `false`

### `parallax`

- type: `boolean`
- default: `false`

### `scenes`

- type: `boolean`
- default: `false`

### `run`

- type: `boolean`
- default: `false`

## Properties



## Methods