---
title: HTML5中Audio使用踩坑汇总
date: 2018-12-17 21:06:52
tags: [h5, audio]
---

### 1. Cannot read property 'catch' of undefined

原因：在调用 play()时，现代浏览器返回的是一个 promise，对于执行失败的，会触发一个 Unhandled Promise Rejection，但是对于低版本的浏览器，调用 play()并不会返回一个 promise。

解决：应该在调用 play()时做如下处理，增加对 playPromise 的判断

参考资料：[HTMLMediaElement.play() Returns a Promise](https://developers.google.com/web/updates/2016/03/play-returns-promise)

```javascript
var playPromise = document.querySelector("video").play()

// In browsers that don’t yet support this functionality,
// playPromise won’t be defined.
if (playPromise !== undefined) {
  playPromise
    .then(function() {
      // Automatic playback started!
    })
    .catch(function(error) {
      // Automatic playback failed.
      // Show a UI element to let the user manually start playback.
    })
}
```

<!--more-->

### 2. InvalidStateError: An attempt was made to use an object that is not, or is no longer, usable

原因：对于还没有设置 src 的 audio，就直接设置 currentTime 是会触发一个 INVALID\_STATE\_ERR 异常的。即使是设置 currentTime = 0 也会触发这个异常

解决：在设置 currentTime 之前，必须先设置 audio 的 src

参考资料：[Offsets into the media resource](https://www.w3.org/TR/2011/WD-html5-20110113/video.html#offsets-into-the-media-resource)

> media . `currentTime` [ = value ]
>
> Returns the [current playback position](https://www.w3.org/TR/2011/WD-html5-20110113/video.html#current-playback-position), in seconds.
>
> Can be set, to seek to the given time.
>
> Will throw an `INVALID_STATE_ERR` exception if there is no selected [media resource](https://www.w3.org/TR/2011/WD-html5-20110113/video.html#media-resource). Will throw an `INDEX_SIZE_ERR` exception if the given time is not within the ranges to which the user agent can seek.

### 3. NotAllowedError

原因：在调用 play()时可能会触发一个 NotAllowedError 的 reject，原因是因为浏览器在某些情况下播放失败，常见场景是，未通过点击的情况下调用 play() ，或者点击事件的回调中是在下一个 tick 里调用的 play，例如在 setTimeout 里调用的 play，再或者新创建了很多个 audio 元素，但是并不是每个 audio 都是通过用户点击来调用的 play()等等。

#### 场景一

未通过点击等事件绑定，直接调用 play()，触发 NotAllowedError。解决方法，把调用 play()的部分放在事件回调里，如下代码：

```javascript
playButton.addEventListener(
  "click",
  () => {
    audioElem.play()
  },
  false
)
```

#### 场景二

在点击事件回调中的下一个 tick 里调用 play()，这种情况的示例代码如下，

```javascript
// 错误代码示例
playButton.addEventListener(
  "click",
  () => {
    setTimeout(() => {
      audioElem.play()
    }, 100)
  },
  false
)
```

这种情况，某些版本「在 iOS12.0.1 亲测有坑」也会触发 NotAllowedError 异常，应该避免这种情况，可以考虑如下 hack 手段解决

```javascript
// hack
playButton.addEventListener(
  "click",
  () => {
    audioElem.muted = true
    let p = audioElem.play()
    if (p !== undefined) {
      p.then(() => {
        audioElem.muted = false
        audioElem.pause()
        setTimeout(() => {
          audioElem.play()
        }, 100)
      }).catch(e => {
        console.log(e)
      })
    }
  },
  false
)
```

#### 场景三

创建了多个 audio 元素，但是并不是每个 audio 都是通过用户点击来调用的 play()的，这时候某些版本「在 iOS12.0.1 亲测有坑」也会触发 NotAllowedError 异常。对于这种情况，最好的办法就是只创建一个 audio 元素，后面通过改变 src 来播放不同的音乐资源。只要 audio 通过了事件回调里调用过 play，后续都可以直接调用 play 了，而无需再次绑定事件回调里去执行，并且这样也可以避免创建多个 audio 来减少内存使用。

```javascript
playButton.addEventListener(
  "click",
  () => {
    audioElem.src = "https://a.mp3"
    audioElem.play()
  },
  false
)

// 后面其他地方，可以改变src来直接play
audioElem.src = "https://b.mp3"
audioElem.play()
```

### 4. iOS 中页面隐藏和显示时，播放 audio 行为异常

原因：在某些 iOS 版本中「iOS12.0.1 亲测有坑」，当我们监听页面隐藏和显示事件，在隐藏时调用 pause() 暂停，显示时调用 play()恢复播放。当按下 home 键，页面进入系统后台时，pause()正常调用，audio 被正常暂停，但是但再次进入页面，显示事件中调用 play()就会出现异常了，

第一种异常，如果我们只是单纯的调用`audioElem.play()`，不会抛出任何错误，但是 audio 实际却没有真正播放，无任何声音；

第二种异常，如果我们每次在显示事件中执行如下代码中任意一种场景，都会在很多情况下会抛出一个`AbortError`异常，极少数情况才会正常播放。

```javascript
// 监听页面显示隐藏事件
addPageVisibilityListener(
  () => {
    // 隐藏时暂停
    audioElem.pause()
  },
  () => {
    // 显示时恢复播放

    // 重新直接赋值src
    audioElem.src = "https://b.mp3"
    audioElem.play()

    // 或者load
    // audioElem.load()
    // audioElem.play()
  }
)
```

解决：这两种异常行为应该都是 iOS 12.0.1 系统本身的 bug。我们可以通过如下 2 中方式来避免这种两种异常的发生，

方式 1， 显示 load()，并监听 `canplaythrough`，推荐使用这种方式

```javascript
const playAudio = () => {
  audioElem1.removeEventListener("canplaythrough", playAudio)
  let p = audioElem.play()
  if (p !== undefined) {
    p.catch(e => {
      console.log(e)
    })
  }
}
// 监听页面显示隐藏事件
addPageVisibilityListener(
  () => {
    // 隐藏时暂停
    audioElem.pause()
  },
  () => {
    // 显示时恢复播放
    audioElem.load()
    audioElem.addEventListener("canplaythrough", playAudio)
  }
)
```

方式 2，通过 `setTimeout` 以及 retry 来 hack 避免这种异常发生

```javascript
let playAudio = (retry: boolean) => {
  let p = audioElem.play()
  if (p !== undefined) {
    p.catch(e => {
      if (retry) {
        setTimeout(() => {
          playAudio(false)
        }, 0)
      }
    })
  }
}
// 监听页面显示隐藏事件
addPageVisibilityListener(
  () => {
    // 隐藏时暂停
    audioElem.pause()
  },
  () => {
    // 显示时恢复播放
    setTimeout(() => {
      playAudio(true)
    }, 500)
  }
)
```
