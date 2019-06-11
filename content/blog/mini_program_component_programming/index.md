---
title: 小程序组件化编程
date: 2017-09-17 22:24:28
tags: [小程序]
---

在开发微信小程序时，发现缺少了组件化开发体验，在网上找了一波资源，发现都不是很好。其中，有用开发Vue的方式去开发小程序，比如，WePY，最后将源代码编译成小程序的官方文件模式。这种方式，开发感觉爽，但是如果小程序版本升级变了之后，不在支持这种方式，那么就得重新开发一套小程序官方支持的代码了，成本代价很大。并且，这次项目时间非常紧，团队成员不熟悉vue的情况下，不敢用WePY。但是，小程序官方又对组件化支持不是很友好。于是，决定自己弄一套，既有组件化开发体验，又是最大限度的接近小程序官方的开发模式。

目前项目已经成功上线，小程序：会过精选
[示例地址](https://github.com/snayan/weChart-component)

### 第一步，改写Page
由于小程序的页面定义是通过`Page`方法去定义的，那么，`Page`一定在小程序内可以认为是一个全局变量，我只需要改写`Page`这个方法，去可以引用组件，调用组件，触发组件的生命周期方法，维持组件内部的数据状态，那么，是不是就可以接近了组件化的编程体验了，并且可以抽离常用组件，达到复用的目的。
````javascript
//先保存原Page
const nativePage = Page;

/* 自定义Page */
Page = data => {
  //...改写Page逻辑，增加自己的功能
  //最后一定得调用原Page方法，不然，小程序页面无法生成
  nativePage(c);
};
````
<!--more-->
确保后面页面调用的`Page`是我们改写的，那么，必须在小程序启动时引入这个文件，达到改写`Page`的目的。
````javascript
//在app.js 头部引入,假如我们的文件名叫registerPage.js
import "./registerPage";

App();
````

### 第二步，引入组件
原`page`的参数是一个对象，这个对象里定义了页面的`data` ，生命周期方法，等等。如果要引入组件，我得定一个字段，用来表明，需要引入的组件。我决定用`componnets` 这个字段去引入当前页面需要引入的组件。`components`是一个数组，可以同时引入多个不同的组件。
````javascript
//在components中引入页面需要的组件，我们这里引入了Toast和LifeCycle这2个组件
Page({
  components: ["Toast", "LifeCycle"],
  data: {
    motto: "Hello World",
    userInfo: {}
  }
});
````
通过`components`，表明了需要引入的组件。那么，我们需要注入组件的相关数据和方法到当前页面，以保证当前页面内能调用组件的方法，或更改组件的数据状态，以达到页面的更新。为了实现这个，我们需要定义规范组件的结构，这样才能正确拿到组件的相关信息。我们定义的组件格式为
````javascript
//定义了一个初始化组件的方法initComponent,这个方法就是返回一个对象，跟page里的参数类似，描述了组件了相关信息。
function initComponent() {
  return {
    timer: null,
    data: {
      content: ""
    },
    show: function(msg, options) {
    }
  };
}

export { initComponent };
````

### 第三步，注入组件
有了组件的相关信息，我们需要把这些信息自动注入到页面中，这样，在页面中才能与组件通信，并且也需要把页面的信息引入到组件内，这样，在组件中也可与父级页面通信。其中，组件内部最为重要的就是`data` 字段了，这个字段内的数据变化了，也要保证页面自动刷新，跟页面功能一样。为了隔离各个组件内部的数据，我对每个组件默认定一个命名空间，这个命名空间就是组件的名字。把组件内部的数据挂在自己的命名空间下，再把这个命名空间挂到页面的`data` 下。同时，把组件的方法和其他熟悉以`组件名.方法名或属性名`的方法挂到页面下。这样，组件的相关信息就都注入到页面中了。
````javascript
//挂载组件的data，以组件名为命名空间挂载
if (v.data) {
  o.data = { ...o.data, [v.name]: v.data };
}
//挂载组件的方法，以【组件名.方法名】挂载
let fns = Object.keys(v).filter(
  vv => v.hasOwnProperty(vv) && typeof v[vv] === "function"
);
for (let fn of fns) {
  o[`${v.name}.${fn}`] = function() {
    let newThis = createComponentThis(v, this);
    let args = Array.from(arguments);
    args.length < 5
      ? v[fn].call(newThis, ...args)
    : v[fn].apply(newThis, args);
  };
}
````

### 第四步，隔离组件
为了在组件内调用自己的方法，有自己的作用域，我们必须为每个组件创建一个独立的作用域，以隔离组件和父级页面作用域。保证了，在组件内部更改`this`，不会对父级页面有影响。同时，组件内部也必须有和父级页面类似的`setData`方法，达到同样的刷新页面的目的。我们定义一组保护的属性名。
````javascript
/* 受保护的属性 */
const protectedProperty = ["name", "parent", "data", "setData"];
````
 `name`是组件的名称，`parent`是对父级页面的引用，`data` 是组件内部数据状态，`setData`是跟父级页面类似的方法，用来更改组件内部自己的数据。

创建组件作用域
````javascript
/* 创建一个新的Component作用域 */
const createComponentThis = (component, page) => {
  let name = component.name;
  if (page[`__${name}.this__`]) {
    return page[`__${name}.this__`];
  }
  let keys = Object.keys(component);
  let newThis = Object.create(null);
  let protectedKeys = protectedProperty.concat(protectedEvent);
  let otherKeys = keys.filter(v => !~protectedKeys.indexOf(v));
  for (let key of otherKeys) {
    if (typeof component[key] === "function") {
      Object.defineProperty(newThis, key, {
        get() {
          return page[`${name}.${key}`];
        },
        set(val) {
          page[`${name}.${key}`] = val;
        }
      });
    } else {
      Object.defineProperty(newThis, key, {
        get() {
          return component[`${key}`];
        },
        set(val) {
          component[`${key}`] = val;
        }
      });
    }
  }
  Object.defineProperty(newThis, "name", {
    configurable: false,
    enumerable: false,
    get() {
      return name;
    }
  });
  Object.defineProperty(newThis, "data", {
    configurable: false,
    enumerable: false,
    get() {
      return page.data[name];
    }
  });
  Object.defineProperty(newThis, "parent", {
    configurable: false,
    enumerable: false,
    get() {
      return page;
    }
  });
  Object.defineProperty(newThis, "setData", {
    value: function(data) {
      page.setData(parseData(name, this.data, data));
    },
    enumerable: false,
    configurable: false
  });
  page[`__${name}.this__`] = newThis;
  return newThis;
};
````

### 第五步，触发组件的生命周期方法
每个组件必须都可以定义自己的生命周期方法，这些生命周期方法与父级页面的一样。因为，组件的生命周期方法必须是在父级页面的生命周期方法内触发的。必须是小程序官方支持的。
````javascript
/* 受保护的页面事件 */
const protectedEvent = [
  "onLoad",
  "onReady",
  "onShow",
  "onHide",
  "onUnload",
  "onPullDownRefreash",
  "onReachBottom",
  "onPageScroll"
];
````
我们必须把组件的生命周期方法挂在父级页面的对应的生命周期方法内，这样，才能在触发父级页面的生命周期方法时，自动触发组件对应的生命周期方法。*其中，先是触发完所有的组件的方法，再最后触发父级页面的方法*
````javascript
/* 绑定子组件生命周期钩子函数 */
const bindComponentLifeEvent = page => {
  let components = page.components;
  for (let key of protectedEvent) {
    let symbols = page[Symbol["for"](key)];
    let pageLifeFn = page[key];
    if (Array.isArray(symbols) && symbols.length > 0) {
      if (typeof pageLifeFn === "function") {
        symbols.push({
          fn: pageLifeFn,
          type: "page",
          context: page
        });
      }
      page[key] = function() {
        let pageThis = this;
        let args = Array.from(arguments);
        for (let ofn of symbols) {
          let currentThis;
          if (ofn.type === "component") {
            currentThis = createComponentThis(ofn.context, pageThis);
          } else {
            currentThis = pageThis;
          }
          args.length < 5
            ? ofn.fn.call(currentThis, ...args)
            : ofn.fn.apply(currentThis, args);
        }
      };
    }
  }
};
````
通过上述这些步骤改写`Page`之后，那么我就可以快速开始了我的小程序组件化编程体验了。


其实原理如下：
-   在小程序启动时劫获小程序的Page函数，在自定义的Page函数中注入子组件的相关数据到父级页面中。
-   将组件的data注入到父级页面的data下，但是组件的data会以组件name为命名空间，以隔离父级data或其他组件的data
-   将组件的一般方法（非生命周期方法）注入到父级页面的方法中，方法名变成了{组件name.方法名}
-   在组件内部的方法都会生成一个新的组件this，隔离父级this，组件this中都是定义了一系列的getter，setter方法，实际操作的是注入到父级页面中的方法。


*注意点*：
-   组件里的方法必须是es5的函数声明模式，不能是es6的箭头函数，因为使用es6的箭头函数会丢失组件this。
-   组件的js达到了自动化注入，但是wxml和wxss还是得手动引入。