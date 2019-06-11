---
title: React 16学习(二)
date: 2018-03-02 21:05:48
tags: [react]
---

上篇大致说了react16的结构，今天来看看react16中新增的Fragment。

react16中新增的可以渲染的类型：`fragment`和`string`。

## Fragments

在react16中，`component`的`render`方法现在可以返回一个数组了，而在react16之前只能返回一个`ReactElement`，一般被`div`包裹着。在实际使用时，页面会输出一些很多没有用处的`div`，增加了dom结构的嵌套层数，不利于页面快速的渲染。

##### react16之前

```javascript
class Demo extends React.Component {
  render() {
    return <div>{[1, 2, 3].map(v => <a key={v}>{`链接${v}`}</a>)}</div>;
  }
}
```
<!--more-->
##### react16

可以直接返回一个数组，而不需要外层包裹一个`div`，这个必须包含`key`

```javascript
class Demo extends React.Component {
  render() {
    return [1, 2, 3].map(v => <a key={v}>{`链接${v}`}</a>)
  }
}
```

可以使用fragments，而不需要申明`key`

```javascript
class Demo extends React.Component {
  render() {
    return <>{[1, 2, 3].map(v => <a>{`链接${v}`}</a>)}</>;
  }
}
```

或者

```javascript
class Demo extends React.Component {
  render() {
    const Fragment = React.Fragment;
    return <Fragment>{[1, 2, 3].map(v => <a>{`链接${v}`}</a>)}</Fragment>;
  }
}
```

## Strings

react16也支持直接在`render`中输出一个字符串。

```javascript
class Demo extends React.Component {
  render() {
    return '这里是一个字符串';
  }
}
```


