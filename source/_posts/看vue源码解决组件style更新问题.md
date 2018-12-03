---
title: 看vue源码解决组件style更新问题
date: 2018-12-03 19:09:22
tags: vue
---

最近在项目碰到了一个vue组件更新导致style异常的问题。下面记录一下我自己的解决思路。

#### 问题背景

由于公司项目业务复杂，就不具体描述了。简单说一下问题，就是项目使用vue框架，在一个页面中根据a值来显示不同组件，当`a = true`时显示A组件，否则就显示B组件。示例代码如下

```
<template>
  <div>
      <div v-if="a" :style="getBackground('a')">a组件</div>
      <div v-else :style="getBackground('b')">b组件</div>
  </div>
</template>

<script>
    export default {
        name:'Example',
        data: {
            a: false
        },
        computed: {
            getBackground: function(type) {
                return {
                    background: `url(https://${type}.png) no-repeat`,
                    backgroundSize: '100% 100%',
                }
            }
        }
        mounted() {
            setTimeout(() => { this.a = true }, 1000)
        }
    }
</script>
```

#### 问题描述

如上代码，页面加载时，显示 *a组件*，且它的背景样式是设置了backgroundImage和backgroundSize为"100%  100%"，一秒之后，a 变为false了，这是显示 *b组件*，预期之中，它也是应该设置了backgroundImage和backgroundSize为"100% 100%"，但是呢，在显示 *b组件*，它的样式，backgroundSize并不是"100% 100%"，而是默认的"initial"，这样导致样式并非我们预期想要的。究竟为什么在显示 *b组件* 时，这个backgroundSize不是我们在`getBackground`中返回的100%呢？
<!--more-->
#### 分析问题

为什么显示 *b 组件* 时样式不是我们预期的呢，这里，可以看到 *a组件* 和 *b组件* 都是 `div`标签，根据[vue官方文档描述](https://vuejs.org/v2/guide/conditional.html#Controlling-Reusable-Elements-with-key)，它们在更新时会被复用的，就是说只会创建 *a组件* 的div元素，在更新b组件时，会复用  *a组件* 创建出来的div元素的。并且翻看了[vue更新组件部分源码](https://github.com/vuejs/vue/blob/dev/src/core/vdom/patch.js#L411-L481)，也确实会先判断是否是相同的元素类型，如果是，就只是更新，而不会重新创建。但是，就算是复用，那也不应该把backgroundSize覆盖了"initial"呀？何况这2个组件都设置的backgroundSize是"100% 100%"。

接着，我又翻看了[更新style部分的源码](https://github.com/vuejs/vue/blob/dev/src/platforms/web/runtime/modules/style.js#L74-L87)才发现了原因出在哪。下面贴出vue更新stye部分的源码如下

 ```javascript
  // 获取待更新vnode的style绑定值
  const newStyle = getStyle(vnode, true)

  // 如果在旧的vnode中且不在新的vnode的style中，则删除
  for (name in oldStyle) {
    if (isUndef(newStyle[name])) {
      setProp(el, name, '')
    }
  }
  // 如果在新的vnode中，且不等于旧的vnode中值，则更新为新的vnode中style值
  for (name in newStyle) {
    cur = newStyle[name]
    if (cur !== oldStyle[name]) {
      // ie9 setting to null has no effect, must use empty string
      setProp(el, name, cur == null ? '' : cur)
    }
  }
 ```

源码逻辑很简单，就是先删除了在旧的vnode中style而不在新的vnode中style的值，接着设置在新的vnode中且不等于旧的vnode中值的。结合上面我们问题代码，逻辑应该是，
1. background存在 *a组件* 和 *b组件* 中，但是值不相等，应该被更新，
2. backgroundSize存在 *a组件* 和 *b组件* 中，值相等，不更新

这样一来，由于 *a 组件* 和  *b组件* 是复用的同一个div元素，我们再来具体看一下div元素style 被更新的过程，

* 先是在 *a组件* 中，div被设置的应该是如下样式

   ```scss
   div {
       background: "url(https://a.png) no-repeat",
       backgroundSize: '100% 100%',
   }
   ```
   我们知道，只设置background的话，它的backgroundSize默认值是"initial"，但是后面的backgroundSize会覆盖background 中默认值，所以这时没有毛病，显示正常

* 接着，更新为 *b组件* 了，div被设置的样式应该如下

   ```scss
   div {
       //background: "url(https://a.png) no-repeat", //a组件中设置样式
       backgroundSize: '100% 100%', //a组件中设置样式
       background: "url(https://b.png) no-repeat", //b组件中设置样式    
   }
   ```
   这个时候，我们发现，实际上，设置的background会用默认值"initial"覆盖掉之前a组件中设置的backgroundSize的"100% 100%"，所以这个时候，在显示 *b组件* 时，backgroundSize变为了默认值"initial"。坑爹呀，😢。

#### 解决问题

知道问题是出现在组件复用和background设置顺序问题上，那么解决的办法就非常简单了，
1. 方法一就是给 *a 组件* 和 *b 组件*  设置不同的key，这样就不会复用，也不会出现上面的问题了，但是呢，感觉跟vue遵循的复用原则相违背，性能也会有所损失（我们就是要追求极致😂）。
2. 方法二就是设置background时直接使用backgroundImage而不是background，因为设置background会附带设置了其他一些背景相关的css样式值，实际上background是一系列背景样式值的简写，

> The property is a [shorthand](https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties) that sets the following properties in a single declaration: [`background-clip`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip), [`background-color`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-color), [`background-image`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-image), [`background-origin`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-origin), [`background-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-position), [`background-repeat`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-repeat), [`background-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-size), and [`background-attachment`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-attachment).

#### 总结

就业务背景而言，业务上是不可能出现页面内a会变化的，也就是说，用户打开页面，那么页面根据a来选择显示哪个组件，之后是不会变的。但是就有某种特殊情况下，a在页面未刷新情况下，变化了，导致更新为显示另一个组件了。自己在做业务需求时，代码逻辑一定要多加严谨，同时要深入理解框架的底层实现原理，才能更好的避免未知bug。

就这个bug而言，应该有三个基础知识点：
1. css规则中，后面的会覆盖前面的
2. background等实际上是一系列css规则的简写
3. vue中组件复用以及高效更新style逻辑
