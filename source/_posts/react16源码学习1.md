---
title: React 16学习(-)
date: 2018-03-01 20:11:21
tags: react
---

趁着离职期这段时间，制定了一个计划，再次阅读React16的源码，React16是一个大版本的更新，其中新增了许多的新特性，并且重写了核心模块的架构，叫做**Fiber**，最令人兴奋的是**async rendering**。之前也浅显的阅读过React15的部分源码，发现这次React16与之有很大的不同。

### 核心文件

React16真的是重新梳理了代码结构，并且解耦了很多，下面为React16的文件结构

![react16的文件结构](/assert/img/react16_file_structure.jpg)

可以看到我们熟悉的react和react-dom。react-art是绘制图形的，比如Canvas，SVG，VML。react-call-return是一个试验性的，用于react中的多遍渲染。react-reconciler是Fiber的实现。share中存放着一些公用的方法和属性。
<!--more-->
### React目录

react目录下存放着react的核心文件，如图

![react目录](/assert/img/react-strycture.jpg)

看着是不是很熟悉，跟react15的很多一样。ReactBaseClasses实现了Component和PureComponent。ReactChildren里是一些工具函数。ReactCurrentOwner就是创建当前上下文环境对象。ReactElement实现了createElement，createFactory，cloneElement，isvalidElement。ReactElementValidator用于验证ReactElement相关方法。ReactNoopUpdateQueue维护着react的更新队列。

### React源码

与React15一样，react输出的也是一个对象，这个对象上绑定着我们用的一些类或方法。

```javascript
const React = {
  Children: {
    map,
    forEach,
    count,
    toArray,
    only,
  },

  Component,
  PureComponent,

  Fragment: REACT_FRAGMENT_TYPE,//react16增加了Fragment
  StrictMode: REACT_STRICT_MODE_TYPE,
  unstable_AsyncMode: REACT_ASYNC_MODE_TYPE,

  createElement: __DEV__ ? createElementWithValidation : createElement,
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,
  isValidElement: isValidElement,

  version: ReactVersion,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner,
    // Used by renderers to avoid bundling object-assign twice in UMD bundles:
    assign,
  },
};
```

其中值得注意的是，react16中增加了Fragment，这个是react15中没有的。上面代码都比较简单，我就不一一说了。
