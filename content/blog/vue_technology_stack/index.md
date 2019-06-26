---
title: vue 全家桶初探
date: 2018-06-15 09:51:44
tags: [vue]
---

## 目的

这个项目主要是用 vue+vuex 实现一个单页面应用，纯粹是熟悉 vue 全家桶相关开发模式，用于练手非常合适。
着手开发完了之后可以学的东西：

1. 熟悉 vue 单文件组件开发方式
2. 熟悉如何写一个 vue 插件
3. 熟悉如何使用 vue-router 以及挂载路由钩子函数
4. 熟悉 vuex 是如何运作的，模块化维护应用状态数据
5. 体验 typescript 的开发方式
   如果想学 vue 的不妨进来看看。
   项目源码地址：[点击这里](https://github.com/snayan/vue-task)

## 技术栈

- vue
- vuex
- vue-router
- typescript

<!--more-->

## 开始

开始之前，还是有必要去 vue 官网学习一下 vue，至少得有个大致的了解，后面在用到 vue-router 和 vuex 时，再去对应的仓库看文档就可以了。

- [vue 官网地址](https://cn.vuejs.org/v2/guide/)
- [vue-router 地址](https://router.vuejs.org/)
- [vuex 地址](https://vuex.vuejs.org/)
  创建项目可以用 vue-cli，具体看[这里](https://github.com/vuejs/vue-cli/blob/dev/docs/README.md)

## 结构

项目结构一般来说非常重要，定义好的目录结构，非常利于后续的项目维护，以及别人阅读理解。下面就是这个项目的结构，应该看一下就知道是干什么的，大致说一下。
项目结构分为静态资源目录，api 接口请求目录，组件目录，插件目录，路由配置目录，公共样式目录，状态维护目录，工具类目录，页面视图目录。
![](./vue-structure.png)

## 单页面组件

vue 开发一般都是单页面组件的方式，即一个以 vue 为后缀的文件就是一个组件，组件里包含了 template 模版，script 脚本，style 样式，组件内的逻辑可以完全封装在里面，对外可以提供接受的 Props 数据，可以对外发射一个事件 emit，或者将外部组件组合到自己内部的 slot 里面。

```vue
<template>
  <div class="topNav">
    <ul class="list">
      <li class="item left">
        <app-icon :link="left" @click.native.stop="clickLeft" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Emit, Vue } from "vue-property-decorator"
import AppIcon from "./AppIcon.vue"
import { PREFIX } from "@/store/modules/user/CONSTANTS"

@Component({
  components: {
    AppIcon,
  },
})
export default class TopNav extends Vue {
  @Prop({ required: true })
  private left!: string
  private get avatar() {
    return this.$store.state[PREFIX].avatar
  }
  private clickLeft() {
    this.$emit("left")
  }
}
</script>

<style lang="scss" scoped>
@import "../scss/theme.scss";
.topNav {
  background: $topBarBgColor;
  position: fixed;
}
</style>
```

## 配置路由

由于在客户端渲染的单页面应用，需要在客户端配置路由，实现页面间的切换。开发 vue 时官方推荐使用 vue-router，在配置这个项目时，由于考虑登录态的维护，所以对路由配置加了 meta 数据，并增加了路由跳转钩子函数，进行鉴权控制受登录态的页面。

```typescript
import Vue from "vue"
import Router from "vue-router"
import Sign from "@/views/Sign.vue"
import Me from "@/views/Me.vue"
import { hasLogin } from "@/util/session"

Vue.use(Router)

const router = new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      name: "sign",
      component: Sign,
    },
    {
      path: "/me",
      name: "me",
      component: Me,
      meta: { requiredAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiredAuth)) {
    // this route requires auth, check if logged in
    // if not, redirect to login page.
    if (!hasLogin()) {
      next({
        path: "/",
        query: { redirect: to.fullPath },
      })
    } else {
      next()
    }
  } else {
    next() // 确保一定要调用 next()
  }
})

export default router
```

## vue 插件编写

对于那种需要全组件共享，或者全局注入的方法等可以使用 vue 插件。其实，vue-router 和 vuex 实际就是 vue 的插件，在入口处，调`Vue.use(Router);` 就可以了，比如 `Vue.use(Router);`
一个插件，可以是一个函数，或者一个包含`install`方法的对象，在调用`Vue.use`时，会调用`install`方法。
在插件里，我们可以

1. 添加全局方法或者属性，
2. 添加全局资源
3. 通过全局 mixin 方法添加一些组件选项
4. 添加 Vue 实例方法

```typescript
import Vue, { VueConstructor, PluginObject } from "vue"
import Loading from "./Loading.vue"

type ShowFunc = () => () => void

const plugin: PluginObject<{}> = {
  install(Vue: VueConstructor, options = {}) {
    const CONSTRUCTOR = Vue.extend(Loading)
    let cache: Vue & { show: ShowFunc } | null = null

    function loading(): () => void {
      const loadingComponent = cache || (cache = new CONSTRUCTOR())
      if (!loadingComponent.$el) {
        const vm = loadingComponent.$mount()
        ;(document.querySelector("body") as HTMLElement).appendChild(vm.$el)
      }
      return loadingComponent.show()
    }
    Vue.prototype.$loading = loading
  },
}

export default plugin
```

## 状态管理

单页面应用的状态管理使用 vuex，上面提到了，它就是一个 vue 的插件，会在组件实例上注入\$store 对象，这个对象就是`new Vuex.Store()`,相比 redux ，我觉得 vuex 简单很多。使用需要注意一下几点就可以了，

1. 改变 state，始终是通过 commit 一个 mutation 方式进行，mutation 函数里必须是同步改变 state，不能异步改变 state。对应 redux 中，就是 reducer 函数的功能了。
2. 对于异步改变 state，可以通过 dispatch 一个 action，action 里面异步获取数据之后在 commit 一个对应的 mutation。这个在 redux 里，是通过中间件处理异步 action 的。
3. 对于 state 的过滤筛选，可以定义 getter，getter 是缓存依赖的。
4. 对于大型复杂的 state，可以采用模块化的方式管理各个模块的 state，这个跟 redux 的思想是一样的。
   本次项目也是用模块化的管理状态的方式，把整个应用的状态以业务划分为子状态，最后在 modules 中合并

```typescript
  modules: {
    user,
    list,
    filter,
  },
```

对于单个模块的 state，按照上面的注意点即可以。

```typescript
// user模块的state
import { ActionTree, MutationTree, ActionContext } from "vuex"
import { login, loginOut, LoginInfo } from "@/api/login"
import { getUserInfo, getUserActions } from "@/api/user"
import { User } from "./user"
import { RootState } from "../../rootstate"

const namespaced = true

/* initial state */
const state = () => ({
  id: null,
  username: null,
  email: null,
  avatar: null,
  likes_count: null,
  goings_count: null,
  past_count: null,
})

/* user actions */
const actions: ActionTree<User, RootState> = {
  login({ commit, state }: ActionContext<User, RootState>, payload: LoginInfo) {
    return login(payload).then(
      ({ token, user }: { token: string; user: User }) => {
        commit("saveToken", token, { root: true })
        commit("saveUser", user)
      }
    )
  },
  getUserInfo({ commit, state }: ActionContext<User, RootState>) {
    return getUserInfo().then((user: User) => {
      commit("saveUser", user)
    })
  },
}

/* user mutations */
const mutations: MutationTree<User> = {
  saveUser(state, user) {
    state.id = user.id
    state.username = user.username
    state.email = user.email
    state.avatar = user.avatar
    state.likes_count = user.likes_count
    state.goings_count = user.goings_count
    state.past_count = user.past_count
  },
}

export default {
  state,
  actions,
  mutations,
  namespaced,
}
```
