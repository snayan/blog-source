---
title: react 16学习(三)
date: 2018-04-04 09:11:45
tags: react
---

ReactDom在16版本中也新增了一些新的功能，比如**createPortal**，**hydrate**。今天主要学习一下**createPortal**。
先看下ReactDom的大致包含的一些属性和方法。

```javascript
const ReactDom = {
  createPortal,//reacte16中新增的
  hydrate,//reacte16中新增的
  findDomNode,
  render,
  unmountComponentAtNode,
  flushSync,
  unstable_renderSubtreeIntoContainer,
  unstable_createPortal, //这个实际就是现在的createPortal,将在React17版本中移除
  unstable_batchedUpdates,
  unstable_deferredUpdates,
  unstable_flushControlled
};
```

可以看到我们熟悉的`findDomNode`，`render`，`unmountComponentAtNode`。这里面新增了两个新的方法`createPortal`和`hydrate`。以unstable_开头的表示的是当前版本中存在的方法，但可能会在后续版本中改动或移除，所以不建议使用。
<!--more-->
### createPortal

先来看下这个方法的签名:

````typescript
export function createPortal(
  children: ReactNodeList,
  container: DOMContainer,
  key: ?string = null,
): ReactPortal {
  return {
    // This tag allow us to uniquely identify this as a React Portal
    $$typeof: REACT_PORTAL_TYPE,
    key: key == null ? null : '' + key,
    children,
    containerInfo,
    implementation:null,
  };
}
````

可以看到它接受三个参数，第一个children，要渲染的节点元素，第二个是container，要渲染的容器，第三个是可选的参数key，这个参数一般没用，默认为null。
它的作用就是在任意合法的dom节点都可以用作渲染的容器，而不仅仅是当前父级节点。下面为官方的说明:

>   Portals provide a first-class way to render children into a DOM node that exists outside the DOM hierarchy of the parent component.

通常情况下，我们在`render`中挂载React child 到它最近的父节点下，例如

```javascript
render() {
  // React mounts a new div and renders the children into it
  return (
    <div>
      {this.props.children}
    </div>
  );
}
```

而**createPortal**却可以使得React child 挂载到任何合法的dom节点下

````javascript
render() {
  // React does *not* create a new div. It renders the children into `domNode`.
  // `domNode` is any valid DOM node, regardless of its location in the DOM.
  return ReactDOM.createPortal(
    this.props.children,
    domNode,
  );
}
````

虽然**createPortal**可以挂载到任何合法的dom容器中，但是它在React tree中的层次结构是不会受影响的，比如事件冒泡。在用**createPortal**渲染的组件中触发一个事件，依然可以被它在React tree中的父级节点捕获到。看下面的例子：
例如有下面的html结构

```html
<html>
  <body>
    <div id="app-root"></div>
    <div id="modal-root"></div>
  </body>
</html>
```

在React tree中，app-root节点依然可以捕获到modal-root节点冒泡出来的事件。

```javascript
// These two containers are siblings in the DOM
const appRoot = document.getElementById('app-root');
const modalRoot = document.getElementById('modal-root');

class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement('div');
  }

  componentDidMount() {
    // The portal element is inserted in the DOM tree after
    // the Modal's children are mounted, meaning that children
    // will be mounted on a detached DOM node. If a child
    // component requires to be attached to the DOM tree
    // immediately when mounted, for example to measure a
    // DOM node, or uses 'autoFocus' in a descendant, add
    // state to Modal and only render the children when Modal
    // is inserted in the DOM tree.
    modalRoot.appendChild(this.el);
  }

  componentWillUnmount() {
    modalRoot.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(
      this.props.children,
      this.el,
    );
  }
}

class Parent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {clicks: 0};
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    // This will fire when the button in Child is clicked,
    // updating Parent's state, even though button
    // is not direct descendant in the DOM.
    this.setState(prevState => ({
      clicks: prevState.clicks + 1
    }));
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <p>Number of clicks: {this.state.clicks}</p>
        <p>
          Open up the browser DevTools
          to observe that the button
          is not a child of the div
          with the onClick handler.
        </p>
        <Modal>
          <Child />
        </Modal>
      </div>
    );
  }
}

function Child() {
  // The click event on this button will bubble up to parent,
  // because there is no 'onClick' attribute defined
  return (
    <div className="modal">
      <button>Click</button>
    </div>
  );
}

ReactDOM.render(<Parent />, appRoot);
```



