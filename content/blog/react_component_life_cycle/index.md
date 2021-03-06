---
title: react组件生命周期浅谈
date: 2017-06-19 23:25:17
tags: [react]
---

众所周知，react 的组件是有一个个的钩子函数，构建成的生命周期，在用 es6 的 class 与用 createClass 有所不同，其中 createClass 还包括了`getDefaultProps`与`getInitialState`。由于 createClass  将在后续版本中移除，建议使用 class 形式。所以，下面讨论的都是 class 形式下的生命周期方式。

## 初始阶段

- constructor ，构造函数，在初始化实例时首先触发
- componentWillMount，组件将渲染出来之前触发，可以调用 setState，简单的合并 state，不会触发 render 重新渲染
- render ，将组件渲染，不可以调用 setState
- componentDidMount，组件渲染之后触发，可以调用 setState，会重新触发 render

<!--more-->

## 更新阶段

- componentWillReceivePorps，组件获取新的 props 时触发
- shouldComponentUpdate，组件在调用 setState 重新更新 render 之前调用，如果返回 false,则不触发后续的生命周期的方法，不会更新组件的渲染，返回 true，则一定会触发后续的生命周期方法，一定会重新更新组件的渲染，在这个方法里不能调用 setState，如果不小心调用，会造成死循环
- componentWillUpdate，组件在更新阶段，即将更新组件之前触发，不可调用 setState，如果不小心调用，会造成死循环
- Render，组件进行更新，不可调用 setState
- componentDidUpdate，组件更新之后触发，

## 卸载阶段

- componentWillUnmount，组件即将卸载之前触发，在这里一般做一些清理工作，也不可调用 setState

说完上面这些方法，就需要实际去验证了，我写了一个最基本的组件，且包含了它所有的生命周期的方法，看各个方法执行的情况。代码如下，其中 Test 与 App 大体类似，就不列出来了。

```jsx
export class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      name: "zy",
    }
    console.log("main constructor")
  }
  componentWillMount() {
    console.log("main componentWillMount")
  }
  render() {
    console.log("main render")
    return <Test name={this.state.name} />
  }
  componentDidMount() {
    console.log("main ComponentDidMount")
  }
  componentWillReceiveProps() {
    console.log("main componentWillReceiveProps")
  }
  shouldComponentUpdate() {
    console.log("main shouldComponentUpdate")
    return true
  }
  componentWillUpdate() {
    console.log("main componentWillUpdate")
  }
  componentDidUpdate() {
    console.log("main componentDidUpdate")
  }
  componentWillUnmount() {
    console.log("main componentWillUnmount")
  }
}
```

初始化时，查看 Console 控制台的打印情况如下，
![react初始化](./react_init.png)
可以看到，有 2 个点比较重要；第一个是， sub 组件只有在 main 的 render 方法中实例化时才开始生命周期方法的调用；第二个是，main 组件等 sub 组件实例化完成之后才完成。

再来看看更新阶段的情况，
![react更新阶段](./react_update.png)
上面是完整的更新阶段调用情况，也就是说我把 shouldComponent 都返回的是 true，而实际中，shouldComponentUpdate 可能在控制组件更新时返回 false，那么返回 false 的情况下，后续的生命周期方法都不会调用，例如我把 main 的 shouldComponentUpdate 返回 false，调用情况如下，
![react更新](./react_update_false.png)

最后，来看看卸载的调用情况，如下，
![react卸载](./react_destory.png)
