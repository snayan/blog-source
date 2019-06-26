---
title: 阅读react源码--component部分
date: 2017-05-09 21:28:39
tags: [react]
---

今天主要看下`React.Component`，实际上`Component`是`React`对象上一个构造函数。
构造函数接受三个参数，`props`，`context`，`updater`，`updater`实际是在`render`中注入的，它是用来实际更新`state`

```javascript
function ReactComponent(props, context, updater) {
  this.props = props
  this.context = context
  // emptyObject 是一个空对象{}
  this.refs = emptyObject
  // ReactNoopUpdateQueue is the abstract API for an update queue
  this.updater = updater || ReactNoopUpdateQueue
}
```

<!--more-->

Component 的原型对象上有这么几个属性，分别是`isReactComponent`，`setState`，`forceUpdate`，`isMounted`，`replaceState`。其中，`isMounted`和`replaceState`不推荐使用了，后续版本会移除的。

- `isReactComponent`是一个空对象。

```javascript
ReactComponent.prototype.isReactComponent = {}
```

- `setState()`方法，改变组件`state`时应该总是使用这个方法，把`state`看成一个不可变对象。当调用`setState()`方法时，不会保证立即执行`setState`函数，也不会立即改变`state`对象，因为它的执行是一个异步的。它可以有两个参数，第一个参数是对象或者函数，这个函数返回一个对象，第二个参数是一个`callback`，当`setState`实际执行完成时会回调这个`callback`

```javascript
ReactComponent.prototype.setState = function(partialState, callback) {
  !(
    typeof partialState === "obejct" ||
    typeof partialState === "function" ||
    partialState == null
  )
    ? "警告或者直接报错....."
    : void 0
  // 将当前更新入队
  this.updater.enqueueSetState(this, partialState)
  if (callback) {
    // 将当前callback入队
    this.updater.enqueueCallback(this, callback, "setState")
  }
}
```

- `forceUpdate()`方法，强制更新，谨慎使用，当你知道某些深成次的`state`已经发生变化了，但没有调用`setState()`时，你可以调用`forceUpdate()`。调用`forceUpdate()`不会触发`shouldComponent`，会触发`componentWillUpdate`和`componentDidUpdate`方法。

```javascript
ReactComponent.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this)
  if (callback) {
    this.updater.enqueueCallback(this, callback, "forceUpdate")
  }
}
```

再来看一下`PureComponent`，它与`Component`结构一样，只不过在其原型对象上增加一个`isPureComponent=true`的属性。

```javascript
function ComponentDummy() {}
ComponentDummy.prototype = ReactComponent.prototype
ReactPureComponent.prototype = new ComponentDummy()
ReactPureComponent.prototype.constructor = ReactPureComponent
// Avoid an extra prototype jump for these methods.
_assign(ReactPureComponent.prototype, ReactComponent.prototype)
ReactPureComponent.prototype.isPureReactComponent = true
```

「react 版本 15.5.4」
