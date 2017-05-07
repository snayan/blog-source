---
title: 阅读react源码--react整体结构
date: 2017-05-04 23:11:29
tags: react
---

最近打算学习react与redux的源码，以此记录在学习过程中做的笔记吧。
先来整体看看react的结构吧，实际上react就是一个对象，在实际使用的时候是这样的方式

```javascript
import React from 'react';
//或则
import {Component,createElement} from 'react';
```

查看源码发现，react对象就是一些包含一些属性的常见对象。常见的属性包括`Component`，`createElement`，`cloneElement`，`createClass`，`DOM`等。
<!--more-->
下面就是它的结构
```javascript
var React={
  //这个主要是处理一些react element的方法,
  Children:{map,forEach,count,toArray,only},

  //Component的`父类`了，我们写的component都是继承这个
  Component:ReactComponent,
  //纯的Component`父类`了，实际原型也是继承Component的，只不过多了一个isPureComponent=true
  PureComponent:ReactPureComponent,

  //创建react elment的方法，实际中可以用jsx去创建react element。
  createElement:createElment,
  //克隆react element的方法
  cloneElement:cloneElement,
  //验证一个对象是否是react element,实际就是判断这个对象是否有$$typeof===Symbol['for']('react.element')
  isValidElement:ReactElement.isValidElement,

  //props的类型检查器，在15.X的版本中，这个单独移到了prop-types的库中了，不再是React的部分
  PropTypes:ReactPropTypes,

  //创建一个Component的类型，主要是es5的写法，在es6之后都是直接用Class形式继承Component
  createClass:ReactClass.createClass,
  //同createClass，只不过指定一个type，之后就是创建同type的react element。
  createFactory:createFactory,

  //同createFatory,只不过封装了dom中常见的elmenet类型，例如div,span,li等
  DOM:ReactDOMFactories
}
```

上面只是列举了最常用的属性，还有一两个属性是不需要知道的，也就没有列举出来了。
后面几篇将详细分析每个属性的具体代码部分。

react版本15.5.4。