---
title: 阅读react-dom源码--ReactMount部分
date: 2017-06-10 11:46:20
tags: [react]
---

ReactMount 为 react-dom 对象提供了`render`和`unmountComponentAtNode`这 2 个方法，其中第一个`render`就是我们常用的输出 react element 到真实的 dom 里。

```javascript
var ReactMount = {
  scrollMonitor: function(container, renderCallback) {
    //...
  },
  renderSubtreeIntoContainer: function(
    parentComponent,
    nextElement,
    container,
    callback
  ) {
    //...
  },
  render: function(nextElement, container, callback) {
    //...
  },
  unmountComponentAtNode: function(container) {
    //...
  },
}
```

<!--more-->

`render`方法实际上提供了三个参数，第一个就是 react element，第二个是页面上真实的 dom，第三个是 callback。如果 react element 已经在之前输出到 container 中了，那么再次调用`render`，则只会最小化更新 dom 的变化。

```javascript
var render = function(nextElement, container, callback) {
  // 验证callback
  ReactUpdateQueue.validateCallback(callback, 'ReactDOM.render');
  // 验证nextElement是否是Rect Element
  !React.isValidElement(nextElement) ? '提示报错' : vodid 0;
  // 验证container
  !isValidContainer(container) ? '提示报错' : void 0;
  // 创建实际node
  var componentInstance = instantiateReactComponent(nextElement, false);
  // 更新到dom
  var component = ReactUpdates.batchedUpdates(batchedMountComponentIntoNode, componentInstance, container, shouldReuseMarkup, context)._renderComponent.getPublicInstance();
  // 执行回调函数
  if(callback) {
    callback.call(component);
  }
  return componnet;
}
```

「react 版本 15.5.4」
