---
title: React Hooks 分享
date: 2021-02-19 15:30:00
tags: [react]
---

最近在组内分享了一些关于 React Hooks 的内容，主要从源码实现，项目中错误的使用例子，以及使用建议等方面介绍了几个常用的 Hooks。整理了文字稿如下，由于错误例子涉及公司内部项目代码，所以就没有列举出来。

## useEffect

useEffect 是最常见，使用最频繁的 Hooks 之一了。它的使用方式如下

```js
useEffect(
  () => {
    // do some side effects
    return () => {
      // optional, clean up
    }
  } /* [deps] */
)
```

先来简单分析一下它的源码，react 对 hooks 的实现，都是分了首次 mount 和后续 update 两个场景。

```js
function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  sideEffectTag |= fiberEffectTag
  // 这里传递的destroy为undefined
  hook.memoizedState = pushEffect(hookEffectTag, create, undefined, nextDeps)
}
```

在 mount 中实现时，useEffect 传递的 cleanup 为 undefined，所以在首次 mount 时，不会调用 cleanup。

```js
function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  let destroy = undefined

  if (currentHook !== null) {
    // 获取上一次的值
    const prevEffect = currentHook.memoizedState
    destroy = prevEffect.destroy
    if (nextDeps !== null) {
      // 如果没有传递deps，则每次都会执行
      const prevDeps = prevEffect.deps
      // 如果deps相等，则不需要执行（标识为NoHookEffect）
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        pushEffect(NoHookEffect, create, destroy, nextDeps)
        return
      }
    }
  }

  sideEffectTag |= fiberEffectTag
  // 这里的destroy是上一次effect返回的值
  hook.memoizedState = pushEffect(hookEffectTag, create, destroy, nextDeps)
}
```

在 update 中实现时，有两点需要注意，其一是会进行 deps 的比较，如果相等，则忽略本次 effect；其二是传递的 destroy 是上一次 effect 中返回的返回的 cleanup 函数。

在 render 阶段保存了 effect 相关数据，在 commit 阶段就会一个个去执行了，源码如下，

```js
function commitHookEffectList(unmountTag, mountTag, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      if ((effect.tag & unmountTag) !== NoHookEffect) {
        // Unmount
        const destroy = effect.destroy
        effect.destroy = undefined
        if (destroy !== undefined) {
          // 先执行destroy，就是cleanup
          destroy()
        }
      }
      if ((effect.tag & mountTag) !== NoHookEffect) {
        // Mount
        // 然后再执行side effect
        const create = effect.create
        // 并且保存返回的cleanup
        effect.destroy = create()
      }
      // effect 是一个链表结构，所以是一个一个执行
      effect = effect.next
    } while (effect !== firstEffect)
  }
}
```

从源码实现可以得出，

1. 如果没有传递 deps 依赖，那么在每次 render 后都会被执行，如果传递了 deps，则会与上一次 deps 的值进行 [is](https://github.com/facebook/react/blob/v16.9.0/packages/shared/objectIs.js#L14-L18) 比较，不相等才会被触发，如果传递`[]`，只会触发执行一次
2. 它的执行顺序是这样的，render（render 阶段触发） -> clean up（commit 阶段触发） -> side effect（commit 阶段触发）
3. 由于每次 render 时，function component 每次都会重新执行，它内部定义的变量每次都会重新定义，如果被 effect 引用了，则保存的就是那被定义的那次的值
4. cleanup 的执行是在下一个 effect 里被执行，所以它里面引用的变量值跟下一个 effect 里的是不同的。

使用建议如下，

1. 添加正确的 deps，可以避免 effect 无意义的执行，或者避免一些 bug

2. 每次 render 时，function 里定义的变量都是独立的，没有任何值的关联（除非使用 useRef 或者定义在 function 外部），应该将每次 render 独立对待思考

3. 对于将 function 作为 deps 时，需要额外注意，由于是 [is](https://github.com/facebook/react/blob/v16.9.0/packages/shared/objectIs.js#L14-L18) 比较，function 每次定义都不相等，所以需要使用到`useCallback`。

4. 对于 effect 内部执行异步方法时，需要考虑竞态问题（上一次 effect 里的异步方法在当前 effect 里的异步方法后面返回），解决方法是增加一个变量判断是否 unmount 了，如下

   ```js
   useEffect(() => {
     let didUnmount = false

     doSomething().then(() => {
       if (didUnmount) {
         // 说明已经重新render了，数据可能是旧的（或者错误的），不需要在处理了
         return
       }
     })

     return () => {
       didUnmount = true
     }
   })
   ```

## useCallback

上面说过，如果 function 作为`useEffect`的 deps，会导致一些依赖失效，因为 function 是引用类型，每次在重新定义时，它的值就是不相同的。在 function 作为 props 传递给子组件时，同样会有这个问题。这个时候，为了解决这个问题，我们需要保持 function 值不变（就是同一个引用），有如下两种方法，

1. 将 function 定义到组件外部，所以 function 一经定义就不会再变了，如果定义在组件外部就只能通过传参来引用组件内部变量了
2. 使用`useCallback`来包裹，通过添加必要的 deps，来保持不变，如果 deps 变了，则 function 值就变了，否则不变

使用方式如下，

```js
const handlerClick = useCallback(
  () => {
    // your function implement
  } /* [deps] */
)
```

简单分析一下它的源码实现，

```typescript
function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  // 将callback和deps存起来
  hook.memoizedState = [callback, nextDeps]
  // 并直接返回callback
  return callback
}
```

在首次 mount 时，只是使用数组将 callback 和 deps 保存起来，并直接返回 callback，接着看下 update 场景的实现，

```typescript
function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  // 取出上一次存的值，是一个数组，
  const prevState = hook.memoizedState
  if (prevState !== null) {
    if (nextDeps !== null) {
      // index 0 保存是callback，index 1保存是deps
      const prevDeps: Array<mixed> | null = prevState[1]
      // 如果deps相同，则直接返回上次存的callback，
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0]
      }
    }
  }
  // 如果deps不相同，则将新的callback和deps存起来
  hook.memoizedState = [callback, nextDeps]
  // 返回新的callback
  return callback
}
```

在 update 实现中，会取出上一次存的 callback 和 deps，通过对比 deps 是否相同，如果是，则直接返回上一次的 callback。

从实现可以得出，

1. 如果没有传递 deps 依赖，那么`useCallback`每次返回的都是当前传入的 callback，这样使用没有任何意义。如果传递了 deps，则会与上一次 deps 的值进行 [is](https://github.com/facebook/react/blob/v16.9.0/packages/shared/objectIs.js#L14-L18) 比较，如果相等直接返回上一次的 callback。如果传递`[]`，那么`useCallback`返回的总是第一次 mount 中传入的 callback，后面都不会再变化

1. `useCallback`并不关心 callback 是否相同，只是根据 deps 来判断是否返回上一次的 callback

使用建议，

1. 如果 callback 里有引用了组件内部的一些变量（包括 props 参数），则需要将这些变量作为 deps，避免 deps 不正确导致 callback 里引用的变量值不正确，特别是 props 参数引用，比如

   ```js
   // deps 不正确
   const handlerClick = useCallback(() => {
     // do something

     props.onSave()
   })
   ```

2. 不需要过渡使用，某些场景下`useCallback`的 deps 可能在每次 render 时都不一样，会导致得到的 callback 每次都不一样，而这种场景使用`useCallback`会适得其反，比如

   ```js
   // 过度使用例子
   const [count, setCount] = useState(0)
   const handlerClick = useCallback(() => {
     setCount(count + 1)
   }, [count])
   ```

## useMemo

跟`useCallback`类型，但是不同的是，`useMemo`返回的是 callback 执行之后的结果，而不是`useCallback`中返回的 callback。它的使用方式如下，

```js
const cacheResult = useMemo(
  () => {
    let result
    // do something, then return result
    return result
  } /* [deps] */
)
```

简单分析一下它的源码实现，

```typescript
function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null
): T {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  // 这里存的是callback执行之后的值
  const nextValue = nextCreate()
  hook.memoizedState = [nextValue, nextDeps]
  return nextValue
}
```

```typescript
function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null
): T {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  const prevState = hook.memoizedState
  if (prevState !== null) {
    // Assume these are defined. If they're not, areHookInputsEqual will warn.
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1]
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0]
      }
    }
  }
  // 同样，保存的也是callback执行之后的值
  const nextValue = nextCreate()
  hook.memoizedState = [nextValue, nextDeps]
  return nextValue
}
```

与`useCallback`的实现基本一样，只是它保存的是 callback 执行之后的值，而并不是 callback 本身。`useCallback`可以直接使用`useMemo`来实现如下，

```js
const handlerClick = useMemo(
  () => {
    return () => {
      // your function implement
    }
  } /* [deps] */
)
```

通过分析可以得出，

1. `useMemo`定义时会立即执行 callback 得到结果，而`useCallback`并不会立即执行 callback

## 小结

本次分析了 React Hooks 中最常见，也最容易误用的三个 Hooks，`useEffect`，`useCallback`，`useMemo`。通过简单的源码分析，了解它们的实现方式，得出一些结论，然后给出了一些使用建议。最后，给出如下两条通用性建议，

1. 强烈建议使用[eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)，并开启 error level，这样可以避免很多错误的 deps
2. 不确定是否需要使用`useEffect`，`useCallback`，`useMemo`时，就不要用，不用可能只有性能问题，错误使用可能就会产生业务逻辑问题

## 参考

1. [react v16.9.0 源码](https://github.com/facebook/react/tree/v16.9.0)
2. <https://overreacted.io/a-complete-guide-to-useeffect/>
