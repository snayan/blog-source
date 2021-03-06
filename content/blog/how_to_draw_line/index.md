---
title: canvas核心技术-如何绘制线段
date: 2018-07-09 20:16:12
tags: [canvas]
---

这篇是学习和回顾 canvas 系列笔记的第一篇，完整笔记详见：[canvas 核心技术](/post/core_html5_canvas/)
学习 canvas，首先得知道如何去绘制线段，然后才能通过很多简单的线段去实现比较复杂的图形，比如常见的图表，柱状图，折线图等都是通过一段一段的线段实现的。

### 基础知识

canvas 的基础知识不算多，主要掌握如何绘制线段，图形，图片，文本等。canvas 可以在浏览器中绘制，也可以借助 [node-canvas](https://github.com/Automattic/node-canvas)在 node 服务端绘制简单的图片。本文只记录在浏览器中绘制，至于在 node 端如何绘制，自己可以去查看相关资料。

在浏览器中绘制，就先在 html 中定义 canvas 元素，默认宽高是 300 \* 150，可以通过`width`和`height`设置。注意 canvas 元素样式宽高和 canvas 绘图画布宽高不是一个东西，详见*知识点 5 中 canvas 宽高*。

```html
<canvas id="canvas">
  <p>当前浏览器不支持canvas，请升级浏览器</p>
</canvas>
```

<!--more-->

在绘制之前，我们要先获取当前 canvas 的 2d 绘制上下文 context，后续总是通过操作 context 来进行绘制。

```javascript
let canvas = document.querySelector("#canvas")
if (!canvas) {
  throw new Error("can not find canvas element")
}
// 注意2d.参数必须是小写的；
// 通过设置参数为webgl，可以获取3d绘制上下文
let ctx = canvas.getContext("2d")
```

_注：后续示例中会忽略上面的代码片段，直接使用 `ctx` 变量表示 canvas 的 2d 绘制上下文。_

再来看看 canvas 2d 绘制中的坐标系统，当前 canvas 元素左上角为坐标原点(0,0)，水平向右为 X 轴正方向，垂直向下为 Y 轴正方向，如下图。可以通过平移(translate)，旋转(rotate)，缩放(scale)来操作坐标系，实现一些动画，这部分将在动画知识部分详细讲解。

![坐标系统](./coordinate.png)

### 线段

在绘制一条简单的线段时，一般会先设置线段的样式，比如，颜色，线条宽度，线条端点样式等，我们通过设置`strokeStyle`来设置`ctx`的全局绘制样式，可以是`rgba`或合法的 16 进制颜色值，或者渐变对象等。如下代码简单的绘制了一条从(10,10)到(50,60)的，宽度为 10 的，红色的线段。

```javascript
ctx.strokeStyle = "red"
ctx.lineWidth = 10
ctx.moveTo(10, 10)
ctx.lineTo(50, 60)
ctx.stroke()
```

![line](./line.jpg)

先看看与绘制线段相关的方法以及属性，

相关属性：

- lineCap，该值告诉浏览器如何绘制线段的端点，可选值为以下三个之一：butt，round，square。默认为 butt。
- lineWidth，该值决定了线段的像素宽度。必须为非负，非无穷，默认为 1.0。
- lineJoin，决定了两条线段相交时如何绘制焦点，只有当两条线段方向不同时，才会生效。可取值：bevel，round，miter。默认值是 miter。
- miterLimit，告诉浏览器如何绘制 miter 形式的线段焦点，只有当`lineJoin='miter'`有效，默认为 10.0。
- lineDashOffset，设置虚线偏移量，默认为 0.0。

相关方法：

- beginPath，将当前路径之中的所有子路径都要清除掉，以此来重置当前路径。一般在绘制闭合图形时要先调用。
- closePath ,显示的封闭某段路径。该方法用于封闭圆弧路径以及由曲线或线段所创建的开放路径。
- moveTo，移动当前绘制点到指定的坐标。
- lineTo，从上一个点绘制一条到指定坐标点的线段。
- setLineDash，用来设置虚线的方法，参数是一个数组，表明绘制实线的长度，以及实线之间的间隙的长度。

试试用设置不同的`lineCap`值来绘制同样的线段

```javascript
ctx.lineWidth = 10
ctx.textAlign = "center"
let colors = ["red", "green", "blue"]
let lineCaps = ["butt", "round", "square"]
for (let [index, lc] of lineCaps.entries()) {
  // 设置线段的颜色
  ctx.strokeStyle = colors[index]
  // 设置lineCap
  ctx.lineCap = lc
  // 清空当前路径
  ctx.beginPath()
  ctx.moveTo(10, 20 + 20 * index)
  ctx.lineTo(50, 20 + 20 * index)
  ctx.stroke()
  ctx.fillText(lc, 80, 25 + 20 * index)
}
```

![lineCap](./lineCap.jpg)

从上图结果可以看出，再将`lineCap`设置为**round** 和**square**时会在原线段的两端加上一定长度的端点，只不过**round**是圆弧样式，**square**是矩形样式。需要注意的一点是，在 canvas 绘制上下文中同一时刻只能存在一个当前路径，为了绘制不同的线段，必须在每次绘制之前调用`beginPath()`来清空当前路线，开始新的路径。

再来试试用不同的`lineJoin`值来绘制两个线段焦点处的样式

```javascript
ctx.lineWidth = 20
ctx.textAlign = "center"
ctx.lineCap = "butt"
let colors = ["red", "green", "blue"]
let lineJoins = ["bevel", "round", "miter"]
for (let [index, lj] of lineJoins.entries()) {
  // 设置线段的颜色
  ctx.strokeStyle = colors[index]
  // 设置lineJoin
  ctx.lineJoin = lj
  // 清空当前路径
  ctx.beginPath()
  ctx.moveTo(10 + 80 * index, 20)
  ctx.lineTo(50 + 80 * index, 20)
  ctx.lineTo(50 + 80 * index, 60)
  ctx.stroke()
  ctx.fillText(lj, 40 + 80 * index, 80)
}
```

![lineJoin](./lineJoin.jpg)

可以看到，三种`lineJoin`在处理两条线段的焦点处的不同。其中，在设置`lineJoin="miter"`时，通过设置`miterLimit`属性可以设置斜接线的长度与二分之一线宽的最大比值，当超过这个比值时，则`lineJoin`会采用**bevel**方式。

canvas 不仅可以绘制实线，还可以绘制虚线。绘制虚线，通过设置`lineDashOffset`属性和调用`setLineDash()`方式。

```javascript
ctx.lineWidth = 10
ctx.textAlign = "center"
// 表示实线部分8个像素，间隙部分8个像素
ctx.setLineDash([8, 8])
let colors = ["red", "green", "blue"]
let lineDashOffsets = [1, 2, 4]
for (let [index, ldOffset] of lineDashOffsets.entries()) {
  // 线段颜色
  ctx.strokeStyle = colors[index]
  // 设置了偏移量
  ctx.lineDashOffset = ldOffset
  ctx.beginPath()
  ctx.moveTo(10, 20 + 20 * index)
  ctx.lineTo(100, 20 + 20 * index)
  ctx.stroke()
  ctx.fillText(`lineDashOffset:${ldOffset}`, 160, 25 + 20 * index)
}
```

![lineDashOffset](./lineDashOffset.jpg)

从图可以看到`lineDashOffset`就是设置的开始绘制虚线的偏移量。`setLineDash()`方法，接受一个数组参数，如果数组个数是奇数，则会默认把当前数组元素复制一份，使之变成偶数。从第 0 个元素，表示实线部分长度，第 1 个元素，表示间隙部分长度，第 2 个元素，表示实线部分长度，第 3 个元素，表示间隙部分长度，如果到数组最后一个元素了，又会从头开始，以此类推。

```javascript
ctx.lineWidth = 10
ctx.textAlign = "center"
let colors = ["red", "green", "blue", "gray"]
let lineDashes = [[20, 20], [40, 40], [20, 40], [20, 40, 20]]
for (let [index, ld] of lineDashes.entries()) {
  ctx.strokeStyle = colors[index]
  // 设置lineDash
  ctx.setLineDash(ld)
  ctx.beginPath()
  ctx.moveTo(10, 20 + 20 * index)
  ctx.lineTo(171, 20 + 20 * index)
  ctx.stroke()
  ctx.fillText(`lineDashes:[${ld}]`, 240, 25 + 20 * index)
}
```

![setLineDash](./setLineDash.jpg)

可以通过动态设置`lineDashOffset`来实现蚁线，比如选择 PS 中选区边缘的蚁线。

```javascript
// 初始lineDashOffset
let lineDashOffset = 0
ctx.strokeStyle = "green"
function animate() {
  if (lineDashOffset > 25) {
    lineDashOffset = 0
  }
  // 清空当前canvas
  ctx.clearRect(0, 0, width, height)
  // 设置lineDashOffset
  ctx.lineDashOffset = -lineDashOffset
  // 设置实线长度和间隙长度
  ctx.setLineDash([4, 4])
  //绘制一个矩形
  ctx.rect(20, 20, 100, 100)
  // 对canvas当前路径描边
  ctx.stroke()
  // lineDashOffset偏移加1
  lineDashOffset += 1
  // 用浏览器帧速率来反复执行animate函数
  window.requestAnimationFrame(animate)
}
animate()
```

![dynamicLineDashOffset](./dynamicLineDashOffset.jpg)

### 小结

绘制线段时，要理解 canvas 当前路径概念，某一时刻，canvas 中当前路径只有一条，在开始新的路径时，必须调用`beginPath()`。可以通过设置`lineWidth`，`lineCap`，`lineJoin`设置线段的绘制样式。在描边线段时，可以通过`strokeStyle`来设置线段的颜色。

canvas 中不仅可以绘制实线，还可以通过`lineDashOffset`和`setLineDash()`来绘制虚线。
