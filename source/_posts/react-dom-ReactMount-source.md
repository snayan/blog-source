---
title: 阅读react-dom源码--ReactMount部分
date: 2017-06-10 11:46:20
tags: react
---

ReactMount为react-dom对象提供了`render`和`unmountComponentAtNode`这2个方法，其中第一个`render`就是我们常用的输出react element到真实的dom里。

````javascript
var ReactMount={
  scrollMonitor:function(container,renderCallback){
    //...
  },
  renderSubtreeIntoContainer:function(parentComponent,nextElement,container,callback){
    //...
  },
  render:function(nextElement,container,callback){
    //...
  },
  unmountComponentAtNode:function(container){
    //...
  }
}
````
<!--more-->

* `render`

  这个方法实际上提供了三个参数，第一个就是react element，第二个是页面上真实的dom，第三个是callback。如果react element已经在之前输出到container中了，那么再次调用`render`，则只会最小化更新dom的变化。

  ````javascript
  var render=function(nextElement,container,callback){
    //验证callback
    ReactUpdateQueue.validateCallback(callback,'ReactDOM.render');
    //验证nextElement是否是Rect Element
    !React.isValidElement(nextElement)?'提示报错':vodid 0;
    //验证container
    !isValidContainer(container)?'提示报错':void 0;
    //创建实际node
    var componentInstance=instantiateReactComponent(nextElement,false);
    //更新到dom
      var component=ReactUpdates.batchedUpdates(batchedMountComponentIntoNode,componentInstance,container,shouldReuseMarkup,context)._renderComponent.getPublicInstance();
    //执行回调函数
    if(callback){
      callback.call(component);
    }
    return componnet;
  }
  ````
react版本15.5.4。