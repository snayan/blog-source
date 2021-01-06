---
title: React Time Slice（三） -   requestIdleCallback polyfill
date: 2020-11-15 10:30:00
tags: ["react", "time slice"]
---

还记得我们在[第一篇](/post/2020/react_time-slice_1/#toc-2-4)中说过，当前rIC实现版本有一条不足之处，当浏览器切换到其他tab或者后台时，浏览器会出于优化考虑不执行rAF（可查看[Background Tabs in Chrome](https://developers.google.com/web/updates/2017/03/background_tabs#requestanimationframe)），而 rIC polyfill 的实现依赖rAF的实现，所以rIC也会得不到执行。

## Fallback to setTimeout

为了解决这种场景下的问题，React v16.5.0 中使用`setTimeout`来作为兜底，100ms内，如果rAF没有执行，则使用`setTimeout`来触发执行，实现大致如下,

```js
const animationFrameTimeout = 100;
let rafID;
let timeoutID;
const scheduleAnimationFrameWithFallbackSupport = function(callback) {
  // schedule rAF and also a setTimeout
  rafID = requestAnimationFrame(function(timestamp) {
    // cancel the setTimeout
    clearTimeout(timeoutID);
    callback(timestamp);
  });
  timeoutID = setTimeout(function() {
    // cancel the requestAnimationFrame
    cancelAnimationFrame(rafID);
    callback(now());
  }, animationFrameTimeout);
};
```

如果浏览器在切换到其他tab或者后台时，限制了rAF的执行，会不会也限制`setTimeout`的执行，rIC会不会也同样本身也会被限制呢？据[MDN上的文档](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout)说明，`setTimeout`同样也会被限制，

> #### Timeouts in inactive tabs throttled to ≥ 1000ms
>
>To reduce the load (and associated battery usage) from background tabs, timeouts are throttled to firing no more often than once per second (1,000 ms) in inactive tabs.
>
>Firefox implements this behavior since version 5 (see [bug 633421](https://bugzilla.mozilla.org/show_bug.cgi?id=633421), the 1000ms constant can be tweaked through the `dom.min_background_timeout_value` preference). Chrome implements this behavior since version 11 ([crbug.com/66078](http://crbug.com/66078)).
>
>Firefox for Android uses a timeout value of 15 minutes for background tabs since [bug 736602](https://bugzilla.mozilla.org/show_bug.cgi?id=736602) in Firefox 14, and background tabs can also be unloaded entirely.

据[w3c文档说明](https://w3c.github.io/requestidlecallback/)，rIC同样也可能会被限制

>When the user agent determines that the web page is not user visible it can throttle idle periods to reduce the power usage of the device, for example, only triggering an idle period every 10 seconds rather than continuously.

那既然对于inactive tab 这种情况，`setTimeout`，rIC本身都会被限制执行，上面React v16.5.0中 使用`setTimeout`来作为回退就没有什么意义了。如果哪位同学知道还有其他方面的原因，还请联系告诉我。

## 资料

1. [Fall back to 'setTimeout' when 'requestAnimationFrame' is not called](https://github.com/facebook/react/pull/13091)
2. [Background Tabs in Chrome](https://developers.google.com/web/updates/2017/03/background_tabs#requestanimationframe)