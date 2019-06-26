---
title: 笔记之decorator
date: 2017-11-26 22:30:33
tags: [decorator, javascript]
---

最近一个月都在忙公司的新项目**会过精选**，加上双 11 大促，真的是很忙。加上最近的烦心事比较多，心情一直不是很好，做什么事情，都效率低下。收拾收拾心情，继续努力吧。一切都不会那么糟糕。

在做会过精选 M 站时，我们前端组选型的技术栈是 React，Redux，TypeScript。一直都知道 decorator 这个东西，但之前在卷皮没有机会用，现在在会过，我就高高兴兴的开始用起来了。
装饰者的功能实际就是在不改原功能的前提下，对原目标进行额外功能的增强，比如：日志记录，缓存，访问控制等。

### 对类进行装饰

decorator 可以作用在类上，达到对类的属性或者原型进行改造。

```typescript
// 定义这个页面是需要登陆权限的页面
@needPageLogin
class OpenCoupons extends React.Component<OpenCouponsProps, ComponentState> {
  // ...
}
```

<!--more-->

这里，`needPageLogin`就是一个对类装饰者，接受类本身作为参数，这个 react 页面必须是登陆提前下才能查看的。

```typescript
import { isLogin, goLogin } from "../../platform/utils"
/* 配置页面需要登录 */
export function needPageLogin(target: React.ComponentClass) {
  let componentDidMount = target.prototype.componentDidMount
  target.prototype.componentDidMount = function(...args) {
    if (isLogin) {
      return componentDidMount.apply(this, ...args)
    } else {
      goLogin()
    }
  }
}
```

### 对类属性进行装饰

decorator 还可以作用在类的属性上，比如`properties`，`methods`，`geters`，`setters`。

```typescript
class OpenCoupons extends React.Component<OpenCouponsProps, ComponentState> {
  // 定义调用这个方法必须是需要登陆权限的
  @needActionLogin
  someAction() {
    //...
  }
}
```

这里，`needActionLogin`接受三个参数，第一个参数就是目标对象的原型(OpenCoupons.proptype) ，第二个参数就是属性名('someAction')，第三个参数就是这个属性的属性描述符(descriptor)。

```typescript
/* 配置方法需要登录 */
export function needActionLogin(
  target,
  name: string,
  descriptor: PropertyDescriptor
) {
  let origin = descriptor.value
  descriptor.value = function(...args) {
    if (isLogin) {
      return origin.apply(this, ...args)
    } else {
      goLogin()
    }
  }
}
```

### decorator 接受参数

在定义 decorator 时可以传递参数，去控制实际要增加的功能。这样实现，实际就是又包装了一层函数，接受参数，处理之后再返回实际的 decorator，这个就是函数式编程中的高阶函数一样，与 React 中的高阶组件 HOC 类似。

```typescript
// 定义这个页面是需要登陆权限的页面
@sharePage(false)
class OpenCoupons extends React.Component<OpenCouponsProps, ComponentState> {
  //...
}
```

这里，sharePage 接受一个参数，用来控制页面是否可以分享。

```typescript
/* 设置页面的分享配置 */
export default function sharePage(show: boolean = true) {
  return function(target: React.ComponentClass) {
    let client = getClient()
    let cwm = target.prototype.componentWillMount
    target.prototype.componentWillMount = function(...args) {
      if (client === "wx") {
        Promise.all([getWxConfig(), importWxJS()])
          .then(([data]: [ShareConfig, {}]) => {
            let shareConfig: Huiguo.WxConfig = {
              debug: data.debug || false,
              appId: data.app_id,
              timestamp: data.timestamp,
              nonceStr: data.noncestr,
              signature: data.signature,
            }
            if (window.wx && window.wx.config) {
              window.wx.config({
                ...shareConfig,
                jsApiList: [
                  "onMenuShareTimeline",
                  "onMenuShareAppMessage",
                  "hideOptionMenu",
                  "showOptionMenu",
                  "hideMenuItems",
                  "showMenuItems",
                ],
              })
              if (!show) {
                window.wx.ready(function() {
                  window.wx.hideOptionMenu()
                  /* window.wx.hideMenuItems({
                    menuList: ['menuItem:share:appMessage', 'menuItem:share:timeline']
                  }); */
                })
              }
            }
          })
          .catch(e => {
            console.error(e)
          })
      }
      if (typeof cwm === "function") {
        cwm.apply(this, args)
      }
    }
  }
}
```

### 应用多个 decorator

对同一个类或者类的属性，可以同时应用多个 decorator，它们会按照 decorator 的顺序，先从外到内进入，然后由内向外执行。

```typescript
@demoDecorator(1)
@demoDecorator(2)
@demoDecorator(3)
class OpenCoupons extends React.Component<OpenCouponsProps, ComponentState> {
  //...
}
```

上面的定义，那么进入 demoDecorator 依次是 1，2，3；但是，真正对类`OpenCoupons`应用 decorator 时的顺序是 3，2，1 的顺序。

```typescript
export default function demoDecorator(v: number) {
  console.log(v, "evaluated")
  return function(target: React.ComponentClass) {
    console.log(v, "executed")
  }
}
```

实际，执行的结果是:

```bash
 1 "evaluated"
 2 "evaluated"
 3 "evaluated"
 3 "executed"
 2 "executed"
 1 "executed"
```

现在，GitHub 上比较多的一个 decorator 库是[core-decorators](https://github.com/jayphelps/core-decorators)，这里定义了一些常见的用法，但是如果要结合实际业务去使用，那必须自己去写了。

### 小结

这次在会过精选项目的 M 站中，页面登录权限控制，页面分享配置，服务器时间配置等功能都用到了 decorator。

### 参考

- <http://es6.ruanyifeng.com/#docs/decorator>
- <https://www.sitepoint.com/javascript-decorators-what-they-are/>
- <https://github.com/wycats/javascript-decorators>
