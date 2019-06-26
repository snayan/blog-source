---
title: React 16学习(二)
date: 2018-03-02 21:05:48
tags: [react]
---

上篇大致说了 react16 的结构，今天来看看 react16 中新增的 Fragment。

react16 中新增的可以渲染的类型：`fragment`和`string`。

## Fragments

在 react16 中，`component`的`render`方法现在可以返回一个数组了，而在 react16 之前只能返回一个`ReactElement`，一般被`div`包裹着。在实际使用时，页面会输出一些很多没有用处的`div`，增加了 dom 结构的嵌套层数，不利于页面快速的渲染。

### react16 之前

```jsx
class Demo extends React.Component {
  render() {
    return (
      <div>
        {[1, 2, 3].map(v => (
          <a key={v}>{`链接${v}`}</a>
        ))}
      </div>
    )
  }
}
```

<!--more-->

### react16

可以直接返回一个数组，而不需要外层包裹一个`div`，这个必须包含`key`

```jsx
class Demo extends React.Component {
  render() {
    return [1, 2, 3].map(v => <a key={v}>{`链接${v}`}</a>)
  }
}
```

可以使用 fragments，而不需要申明`key`

```jsx
class Demo extends React.Component {
  render() {
    return (
      <>
        {[1, 2, 3].map(v => (
          <a>{`链接${v}`}</a>
        ))}
      </>
    )
  }
}
```

或者

```jsx
class Demo extends React.Component {
  render() {
    const Fragment = React.Fragment
    return (
      <Fragment>
        {[1, 2, 3].map(v => (
          <a>{`链接${v}`}</a>
        ))}
      </Fragment>
    )
  }
}
```

## Strings

react16 也支持直接在`render`中输出一个字符串。

```jsx
class Demo extends React.Component {
  render() {
    return "这里是一个字符串"
  }
}
```
