---
title: canavs核心技术-如何实现复杂的动画
date: 2018-08-19 18:20:34
tags: [canvas]
---

这篇是学习和回顾 canvas 系列笔记的第五篇，完整笔记详见：[canvas 核心技术](/post/core_html5_canvas/)。

在上一篇[canvas 核心技术-如何实现简单的动画](/post/how_to_implement_simple_animations/)笔记中，我们详细学习了如何进行 canvas 坐标系的平移，缩放，旋转等操作来实现一些比较简单和单一的动画。但是在实际动画中，影响一个动画的因素是很多的，比如一个小球自由落体运动，我们不仅要考虑小球的初始速度和初始方向，还要考虑重力加速度，空气阻力等外界因素。这一篇笔记，我们会详细学习复杂动画的相关知识。

### 核心逻辑

我们理解的动画，应该是在一段时间内，物体的某些属性，比如颜色，大小，位置，透明度等，发生改变。判断动画流程度的单位是动画刷新的速率，在浏览器中一般是浏览器的帧速率。帧速率越大，动画就越流畅。在现代浏览器中，我们一般是使用`requestAnimationFrame`来执行动画。

```javascript
let raf = null
let lastFrame = 0

// 动画
function animate(frame) {
  // todo:这里可以执行一些动画更新
  console.log(frame)
  raf = requestAnimationFrame(animate)
  lastFrame = frame
}

function start() {
  // 一些初始化的操作
  init()

  // 执行动画
  animate(performance.now())
}

function stop() {
  cancelAnimationFrame(raf)
}
```

<!--more-->

一般大致的结构就是这样的，通过`requestAnimationFrame`不断地在浏览器下一帧中执行`animate`，且`animate`函数会接受一个当前帧开始执行的时间戳的参数。如果想中断当前进行的动画，只需要调用`cancelAnimationFrame`，那么在下一帧中就不会执行`animate`函数了。上一帧执行的时间，可以用`frame - lastFrame`，然后再根据这个差值就可以计算出当前动画的帧速率了，如下，

```javascript
let fps = 0
let lastCalculateFpsTime = 0
function calculateFps(frame) {
  if (lastFrame && (fps === 0 || frame - lastCalculateFpsTime > 1000)) {
    fps = 1000 / (frame - lastFrame)
    lastCalculateFpsTime = frame
  }
}
//动画
function animate(frame) {
  // todo:这里可以执行一些动画更新
  calculateFps(frame)
  raf = requestAnimationFrame(animate)
  lastFrame = frame
}
```

在计算 fps 时，我们是用 1s 除以上一帧执行的时间，由于 frame 的单位是毫秒，所以是用 1000 除的。上面我们还做了一个优化，就是每 1s 才会去计算一次 fps，而不是每帧都去计算，因为每帧都去计算，意义不大，且增加了额外的计算。

### 时间因素

在绘制动画时，我们必须按照基于时间的方式来设计，而不是当前浏览器的帧速率。因为，不同浏览器会有不同的帧速率，同一浏览器在不同的 GPU 负载下帧速率也可能会不同，所以我们的动画必须是基于时间的，这样才能保证同样的速度在相同的时间内，动画变化的是一致的。比如，我们在考虑小球垂直下落时，必须设置小球的下落的速度 v，然后再根据公式$s = v * t$，得出小球在当前时间段内的移动距离，计算出当前帧内的坐标。

```javascript
/* 初始化 */
private init() {
  this.fps = 0;
  this.lastFrameTime = 0;
  this.speed = 5; // 设置小球初速速度为:5m/s
  this.distance = 50; // 设置小球距离地面高度为:50m
  let pixel = this.height - this.padding * 2;
  if (this.distance <= 0) {
    this.pixelPerMiter = 0;
  } else {
    this.pixelPerMiter = (this.height - this.padding * 2) / this.distance;
  }
}
```

在上面代码中，我们在初始化的时候，设定了小球的初始速度为$5m/s$，小球距离地面的高度为$50m$，以及计算出了物理高度与像素高度的比值 pixelPerMiter，这个值在后面计算小球的坐标时是有用到的。

```javascript
/* 更新 */
private update() {
  if (this.fps) {
    this.ball.update(1000 / this.fps); // 更新小球
  }
}
```

然后，在每帧更新小球位置时，我们将上一帧进过的时间值传递给`ball.update`。

```typescript
/* 移动 */
static move(ball: Ball, elapsed: number) {
  // 小球是静止状态，不更新
  if (ball.isStill) {
    return;
  }
  let { currentSpeed } = ball;
  let t = elapsed / 1000; // elapsed是毫秒, 而速度单位是m/s，所以要除1000
  let distance = ball.currentSpeed * t;
  if (ball.offset + distance > ball.verticalHeight) {
    // 如果小球是否已经超过实际高度,则落到地面了
    ball.isStill = true;
    ball.currentSpeed = 0;
    ball.offset = ball.verticalHeight;
  } else {
    ball.offset += distance;
  }
}
```

再根据公式计算出上一帧时间里，小球下落的距离 distance，累加每一帧下落的距离，则可以得到当前小球下落的总距离，如果小球下落的总距离大于了小球距离地面的实际高度，则表示小球落到地面了，就停止小球下落。

```typescript
/* 绘制小球 */
public render(ctx: CanvasRenderingContext2D) {
  let { x, y, radius, offset, pixelPerMiter } = this;
  ctx.save();
  ctx.translate(x, y + offset * pixelPerMiter); // offset * pixelPerMiter得到下落的像素
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
```

最后在绘制小球时，先要根据下落的实际高度 offset 和前面计算得到的实际高度与像素高度的比值，来得到小球在屏幕上下落的像素值（$offset * pixelPerMiter$）。

上面就是我们在写小球自由落体时的大致思路，重点是设置小球的初始下落速度，以及在每一帧里计算出小球下落的距离，最后根据实际高度与像素高度比，计算出小球在屏幕上下落的像素高度。这个过程中，我们还没有考虑重力加速度和空气阻力等物理因素，下面，我们就来考虑物理因素对动画的影响。

### 物理因素

为了使动画或者游戏表现的更加真实，通常需要考虑真实世界中物理因素的影响，比如我们继续考虑小球自由落体运动，真实世界中，小球自由落体运动会收到重力加速度，空气阻力，空气流向，反弹等的影响，从而改变小球下落的速度。

```typescript
/* 创建小球 */
private createBall() {
  let { width, height, padding, speed, radius, pixelPerMiter, distance } = this;
  this.ball = new Ball(width / 2, padding - radius, radius, { verticalHeight: distance, pixelPerMiter, useGravity: true });
  this.ball.setSpeed(speed);
  this.ball.addBehavior(Ball.move);
}
```

在创建小球时，我们给了一个参数`userGravity`来表示是否使用重力加速度，这里我们设置为`true`，同时我们也传递了小球的初始坐标和半径，以及初始速度等。

```typescript
const GRAVITY = 9.8; // 重力加速度9.8m/s
/* 移动 */
static move(ball: Ball, elapsed: number) {
  // ...
  // 如果应用了重力加速度，则更新速度
  if (ball.useGravity) {
    ball.currentSpeed += GRAVITY * t;
  }
  // ...
}
```

然后在更新小球时，我们增加了对小球当前速度的计算，根据公式$v = g * t $ 计算出上一帧的速度。这样，随着时间，小球的速度实际上是不断增加的，小球下落的会越来越快。

前面我们在处理小球落到地面时，只是单纯的让小球停在地面上。但是在实际生活中，我们下落的小球，碰到地面后，都会反弹一定高度，然后又下落，直到小球静止在地面上。为了更加真实模拟小球下落，我们来考虑反弹物理因素。

```typescript
//创建小球
this.ball = new Ball(width / 2, padding - radius, radius, {
  verticalHeight: distance,
  pixelPerMiter,
  useGravity: true,
  useRebound: true,
})
```

在创建小球时，我们传递了`useRebound:true`，表示当前小球应用了反弹效果，在更新小球时，需要判断小球在落地时，将当前速度方向反向，且大小减为原来的 0.6 倍，这个 0.6 系数只是一个经验值，在具体游戏中，可以调整，达到想要的效果。系数越大，反弹越高。

```typescript
/* 移动 */
static move(ball: Ball, elapsed: number) {
  // 小球是静止状态，不更新
  if (ball.isStill) {
    return;
  }
  let { currentSpeed } = ball;
  let t = elapsed / 1000; // elapsed是毫秒, 而速度单位是m/s，所以要除1000
  // 更新速度
  if (ball.useGravity) {
    ball.currentSpeed += GRAVITY * t;
  }
  let distance = ball.currentSpeed * t;
  if (ball.offset + distance > ball.verticalHeight) {
    // 落到地面了
    // 使用反弹效果
    if (ball.useRebound) {
      ball.offset = ball.verticalHeight;
      ball.currentSpeed = -ball.currentSpeed * 0.6; // 速度方向取反，大小乘0.6
      if ((distance * ball.pixelPerMiter) / t < 1) {
        // 当前移动距离小于1px，应该静止了，
        ball.isStill = true;
        ball.currentSpeed = 0;
      }
    } else {
      ball.isStill = true;
      ball.currentSpeed = 0;
      ball.offset = ball.verticalHeight;
    }
  } else {
    ball.offset += distance;
  }
}
```

在应用反弹效果时，我们判断当前速度在 1s 内在下落位移小于 1px 时，就将小球停止，这样，防止小球在反弹距离很小很小时，进行不必要的计算。

至于其他物理因素，比如风向，阻力等，我们就不具体讨论了，具体思路跟上面一样，先进行物理建模，然后在更新过程中根据物理公式计算受影响的属性，最后再根据属性值来绘制。

[这里是我的小球自由落体完整在线示例](https://snayan.github.io/canvas-demo/?module=free_fall)

### 时间轴扭曲

动画是持续一段时间的，我们可以事先给定具体的持续时间值，让动画在这段时间内持续执行，就像 css3 中`animation-duration`，然后通过扭曲时间轴，可以让动画执行非线形运动，比如我们常见缓入效果，缓出效果，缓入缓出效果等。

时间轴扭曲，是通过一系列对应的缓动函数，根据当前的时间完成比率 compeletePercent，计算得到一个扭曲后的值 effectPercent，最后根据这 2 个值得到扭曲后的时间值 elapsed

$$
eplased = actualElapsed * effectPercent/compeletePercent
$$

线性函数，

```typescript
static linear() {
  return function(percent: number) {
    return percent;
  };
}
```

缓入函数，

```typescript
static easeIn(strength: number = 1) {
  return function(percent: number) {
    return Math.pow(percent, strength * 2);
  };
}
```

缓出函数，

```typescript
static easeOut(strength: number = 1) {
  return function(percent: number) {
    return 1 - Math.pow(1 - percent, strength * 2);
  };
}
```

缓入缓出函数，

```typescript
static easeInOut() {
  return function(percent: number) {
    return percent - Math.sin(percent * Math.PI * 2) / (2 * Math.PI);
  };
}
```

[这里是我的时间轴扭曲完整在线示例](https://snayan.github.io/canvas-demo/?module=animate)。

更复杂的缓动函数还有弹簧效果，贝塞尔曲线等，详细可以参见[EasingFunctions](https://gist.github.com/gre/1650294)。

### 小结

本篇笔记主要讨论了在 canvas 中如何实现复杂的动画效果，从一个小球的自由落地运动为示例，我们在计算小球的下落距离时，是以时间维度来计算，而不是当前浏览器的帧速率，因为帧速率不是一个恒定可靠的值，它会使小球的运动变得不明确。当我们以时间为计算值时，小球在同样时间内下落的距离值，我们是可以计算出来的，是一个准确不受帧速率影响的值。为了使小球下落的更加真实，我们又考虑了影响小球下落的物理因素，比如重力加速度，反弹效果等。在制作其他一些非线性运动的动画时，我们可以使用常见的缓动函数，比如，缓入，缓出等，它们的本质都是通过扭曲时间轴，使得当前的运动受时间因素影响。

在制作 canvas 游戏时，基本都会运用到动画，有物体运动，那么一定会发生碰撞，比如上面我们的小球下落，就会发生小球与地面的碰撞，我们进行了简单的碰撞检测。下一篇笔记，我们详细讨论，如何在 canvas 中进行碰撞检测。
