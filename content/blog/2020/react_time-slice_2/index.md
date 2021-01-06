---
title: React Time Slice（二） -   requestIdleCallback polyfill
date: 2020-09-16 20:30:00
tags: ["react", "time slice"]
---

在[上一篇文章](/post/2020/react_time-slice_1/)中，我们分析和理解了 React v16.0.0 中是如何实现 `requestIdleCallback` 最基础功能的，以及指出了一些不足之处，其中之一就是没有支持多个 callback 的特性。本篇是 React Time Slice 系列中的第二篇，学习 React 团队是如何为 rIC 支持多个 callback 特性。

先简单回顾一下，在 React v16.0.0 中，它使用 `requestAnimationFrame`和`postMessage`来实现 rIC。使用一个变量`scheduledRICCallback`保存当前 callback，如果多次执行`rIC(callback)`，`scheduledRICCallback`会被更新覆盖。

```js
rIC = function(callback) {
  // 先是存储callback
  scheduledRICCallback = callback

  // 。。。

  return 0
}
```

为了符合 rIC 的规范，支持多个 callback，React 团队先后实现了两个版本，第一个版本是使用队列（queue）+ 哈希表 （hash object）实现，第二个版本是使用双向链表（linked list）实现的。如果你对队列，哈希表，链表等不是很清楚，可以先[移步这里](/post/2019/algorithm_basic_data_structure/)了解。

## Queue + Hash

在 React v16.4.0 中，使用队列保存 callback，使用哈希来标识当前 callback 是否有效，也就是没有被取消。

```js
// 有效callback哈希对象
const registeredCallbackIds = {}

// 待执行callback队列
const pendingCallbacks = []
```

为了唯一标识 callback，它会给每一个 callback 都生成了一个 ID，然后哈希表中就保存这个 ID。

```js
rIC = function(callback, options) {
  // 先计算出timeout，这里是简化实现，实际实现比这复杂，
  let timeoutTime = -1
  if (options != null && typeof options.timeout === "number") {
    timeoutTime = now() + options.timeout
  }

  // 为callback计算出唯一ID，
  const newCallbackId = getCallbackId()
  const scheduledCallbackConfig = {
    scheduledCallback: callback,
    callbackId: newCallbackId,
    timeoutTime,
  }
  // 保存到队列里
  pendingCallbacks.push(scheduledCallbackConfig)

  // id保存到哈希表中
  registeredCallbackIds[newCallbackId] = true

  if (!isAnimationFrameScheduled) {
    isAnimationFrameScheduled = true
    requestAnimationFrameForReact(animationTick)
  }

  //返回id，用于取消
  return newCallbackId
}
```

如果调用了`cancelIdleCallback`，则只会删除哈希表中对应的 id，而不会把 callback 从队列中移除。

```js
cancelRIC = function(callbackId) {
  delete registeredCallbackIds[callbackId]
}
```

如果当前帧还有很多剩余时间，则顺序从队首取出，依次执行，直到没有剩余时间，

```js
const idleTick = function() {
  // 。。。
  let currentTime = now()
  // Next, as long as we have idle time, try calling more callbacks.
  while (frameDeadline - currentTime > 0 && pendingCallbacks.length > 0) {
    // 先从队首中取一个callback
    const latestCallbackConfig = pendingCallbacks.shift()
    frameDeadlineObject.didTimeout = false
    const latestCallback = latestCallbackConfig.scheduledCallback
    const newCallbackId = latestCallbackConfig.callbackId
    // 执行callback，且从哈希表中删除id
    safelyCallScheduledCallback(latestCallback, newCallbackId)
    currentTime = now()
  }
  // 。。。
}
```

在真正执行 callback 之前，都会先检查当前 callback 是否已经被取消了，如果已经取消了，它对应的 id 就不会存在哈希表中，

```js
function safelyCallScheduledCallback(callback, callbackId) {
  // 先检查哈希，如果当前callback被取消了，就不再执行
  if (!registeredCallbackIds[callbackId]) {
    // ignore cancelled callbacks
    return
  }
  try {
    callback(frameDeadlineObject)
    // Avoid using 'catch' to keep errors easy to debug
  } finally {
    // always clean up the callbackId, even if the callback throws
    delete registeredCallbackIds[callbackId]
  }
}
```

哈希表在这里的主要作用，就是为了把时间复杂度从 O(n)降到 O(1)，如果不使用哈希表，则调用`cancelIdleCallback`时，需要遍历队列来删除对应的 callback。如果考虑极端一点，哈希表在最坏的情况下，时间复杂度也会退回到 O(n)。为了进一步降低时间复杂度，React v16.4.1 中使用链表实现了另外一个版本。

## Linked list

与 React v16.4.0 版本不同之处是，React v16.4.1 中不再使用队列来保存 callback，而是使用链表，且不会为每个 callback 生成一个唯一 ID。一个链表节点，保存了对应的 callback，timeoutTime，以及前一个节点地址，后一个节点地址。

```typescript
type CallbackConfigType = {
  scheduledCallback: FrameCallbackType
  timeoutTime: number
  nextCallbackConfig: CallbackConfigType | null
  previousCallbackConfig: CallbackConfigType | null
}
```

使用两个变量，来分别指向链表的头节点和尾部节点，

```js
// 链表头节点
let headOfPendingCallbacksLinkedList = null
// 链表尾部节点
let tailOfPendingCallbacksLinkedList = null
```

在执行`rIC(callback)`时，每次将当前 callback 节点添加到链表尾部，

```js
rIC = function(callback, options) {
  // ...

  const scheduledCallbackConfig = {
    scheduledCallback: callback,
    timeoutTime,
    previousCallbackConfig: null,
    nextCallbackConfig: null,
  }

  // 如果链表为空，则当前节点就是链表的头节点和尾部节点
  if (headOfPendingCallbacksLinkedList === null) {
    // Make this callback the head and tail of our list
    headOfPendingCallbacksLinkedList = scheduledCallbackConfig
    tailOfPendingCallbacksLinkedList = scheduledCallbackConfig
  } else {
    // 否则，将当前节点加到链表尾部
    // Add latest callback as the new tail of the list
    scheduledCallbackConfig.previousCallbackConfig = tailOfPendingCallbacksLinkedList
    tailOfPendingCallbacksLinkedList.nextCallbackConfig = scheduledCallbackConfig
    tailOfPendingCallbacksLinkedList = scheduledCallbackConfig
  }

  //返回scheduledCallbackConfig，用于取消
  return scheduledCallbackConfig
}
```

需要注意的是，这里 rIC 返回的不是一个`number`类型，而是当前的节点对象。在执行`cancelIdleCallback`时，就会根据这个节点来移除自己。

```js
cancelRIC = function(callbackConfig) {
  // 获取上一个节点
  const previousCallbackConfig = callbackConfig.previousCallbackConfig
  // 获取下一个节点
  const nextCallbackConfig = callbackConfig.nextCallbackConfig
  if (previousCallbackConfig) {
    // 更新上一个节点的next值，指向下一个节点，即移除自己
    previousCallbackConfig.nextCallbackConfig = nextCallbackConfig
  }
  if (nextCallbackConfig) {
    // 更新下一个节点的prev值，指向上一个节点，即移除自己
    nextCallbackConfig.previousCallbackConfig = previousCallbackConfig
  }
  // 更新链表头节点
  if (headOfPendingCallbacksLinkedList === callbackConfig) {
    headOfPendingCallbacksLinkedList = nextCallbackConfig
  }
  // 更新链表尾部节点
  if (tailOfPendingCallbacksLinkedList === callbackConfig) {
    tailOfPendingCallbacksLinkedList = previousCallbackConfig
  }
}
```

如果当前帧还有剩余时间，则只需要移动头节点，依次执行 callback 即可。

```js
const idleTick = function(event) {
  // 。。。
  let currentTime = now()
  // Next, as long as we have idle time, try calling more callbacks.
  while (
    frameDeadline - currentTime > 0 &&
    headOfPendingCallbacksLinkedList !== null
  ) {
    const latestCallbackConfig = headOfPendingCallbacksLinkedList
    // 移动链表头节点，执行下一个节点
    headOfPendingCallbacksLinkedList = latestCallbackConfig.nextCallbackConfig
    if (headOfPendingCallbacksLinkedList) {
      headOfPendingCallbacksLinkedList.previousCallbackConfig = null
    }
    frameDeadlineObject.didTimeout = false
    const latestCallback = latestCallbackConfig.scheduledCallback
    // 执行callback
    latestCallback(frameDeadlineObject)
    currentTime = now()
  }
  // 。。。
}
```

使用链表的核心之处，在于删除一个节点时，时间复杂度总是为 O(1)，它不会像哈希表那样存在某些场景下回退到 O(n)。当然，它不好的地方就是，删除节点或者移动头指针遍历链表时，会增加垃圾回收工作（GC）。

## 小结

React 团队为了实现 rIC 支持多个 callback，先后实现了两个版本。第一个版本是使用队列和哈希表来实现，第二个版本使用双向链表来实现。之所以考虑使用链表来实现，是因为从哈希表中删除一个数据，时间复杂度在最坏情况下会回退到 O(n)，而从链表中删除一个节点，时间复杂度总是 O(1)。链表也有其缺点，就是会增加 GC。

## 资料

1. [Support multiple callbacks in scheduler](https://github.com/facebook/react/pull/12746)
2. [Use linked list instead of queue and map for storing cbs](https://github.com/facebook/react/pull/12893)
