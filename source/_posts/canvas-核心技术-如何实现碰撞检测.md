---
title: canvas-核心技术-如何实现碰撞检测
date: 2018-08-26 19:22:17
tags: canvas
---

这篇是学习和回顾canvas系列笔记的第六篇，完整笔记详见：[canvas核心技术](https://snayan.github.io/2018/07/09/canvas-%E6%A0%B8%E5%BF%83%E6%8A%80%E6%9C%AF/)。

在上一篇[canvas核心技术-如何实现复杂的动画](https://snayan.github.io/2018/08/19/canavs%E6%A0%B8%E5%BF%83%E6%8A%80%E6%9C%AF-%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0%E5%A4%8D%E6%9D%82%E7%9A%84%E5%8A%A8%E7%94%BB/)笔记中，我们详细讨论了在制作复杂动画时，需要考虑时间因素，物理因素等，同时还回顾了如何使用缓动函数来扭曲时间轴实现非线性运动，比如常见的缓入，缓出，缓入缓出等。在游戏或者动画中，运动的物体在变化的过程中，它们是有可能碰撞在一起的，那么这一篇我们就来详细学习下如何进行碰撞检测。

#### 边界值检测

最简单的检测手段就是边界值检测了，就是对一个运动的物体的某些属性进行条件判断，如果达到了这个条件，则说明发生了碰撞。例如在上一篇中的示例，小球自由下落，当在检测小球是否与地面发生碰撞时，我们是检测小球下落的高度fh是否达到了小球本身距离地面的高度dh，如果fh>dh，则说明小球与地面发生了碰撞。

```javascript
    let distance = ball.currentSpeed * t; 
    if (ball.offset + distance > ball.verticalHeight) {
      //落到地面了，发生了碰撞
      // ...
    } else {
      // 还没有落到地面，没有发生碰撞
      ball.offset += distance;
    }
```
<!--more-->
[这里是我的小球自由落体完整在线示例](https://snayan.github.io/canvas-demo/?module=free_fall)

这种检测方式非常的简单且准确，在针对类似业务开发时，我们可以简化成边界值检测。但是当我们开发较为复杂游戏时，边界值检测通常不能很好的实现，为了更加真实，它通常与其他检测方法一起使用。

#### 外接图形检测

在canvas游戏中，对于不规则的物体，比如运动的小人等，我们可以通过抽象成一个矩形，使得这个矩形恰好可以包裹这个物体，在进行碰撞检测时，就可以使用这个矩形来代替实际的物体。这种方法，实际上就是通过抽象，将复杂简单化，对于精确度不是那么高的动画或者游戏，我们直接使用这种外接图形来检测就可以了。在抽象图形的时候，我们要根据具体的物体，比如小人可以抽象成矩形，太阳就要抽象成圆了，把具体的物体抽象的跟它相似的形状，这样在检测时就会更加准确。

进行了图形抽象之后，我们在检测就只需对图形进行检测了。对于两个图形是否发生碰撞，我们只需要判断它们是否存在相交的部分，如果存在相交的部分，那么则可以认为是发生了碰撞，否则就没有。下面，我们分别来学习矩形和矩形的碰撞检测，圆和圆的碰撞检测，矩形和圆的碰撞检测。

矩形与矩形碰撞情况，

![rect_rect](/assert/img/canvas/rect_rect.png)

这里列举两个矩形发生碰撞的所有情况，在canvas中具体代码实现如下，

```javascript
  /* 判断是否两个矩形发生碰撞 */
  private didRectCollide(sprite: RectSprite, otherSprite: RectSprite) {
    let horizontal = sprite.left + sprite.width > otherSprite.left && sprite.left < otherSprite.left + otherSprite.width;
    let vertical = sprite.top < otherSprite.top + otherSprite.height && sprite.top + sprite.height > otherSprite.top;
    return horizontal && vertical;
  }
```

其实就是分别在水平方向和垂直方向判断这两个矩形是否发生重叠。

圆和圆碰撞情况，

![circle_circle](/assert/img/canvas/circle_circle.png)

判断两个圆是否发生碰撞，就是判断两个圆的圆心之间的距离是否小于它们的半径之和，如果小于半径之和，则发生碰撞，否则就没有发生碰撞。主要就是计算两个圆心之间的距离，可以根据坐标系中两点之间距离公式得到，
$$
|AB| = \sqrt{(x_1-x_2)^2 + (y_1-y2)^2}
$$
在canvas中具体代码实现如下，

```javascript
  /* 判断是否两个圆发生碰撞 */
  private didCircleCollide(sprite: CircleSprite, otherSprite: CircleSprite) {
    return distance(sprite.x, sprite.y, otherSprite.x, otherSprite.y) < sprite.radius + otherSprite.radius;
  }
```

矩形和圆碰撞情况，

![rect_circle](/assert/img/canvas/rect_circle.png)

这种情况，就是判断圆形到矩形上最近的一点的距离是否小于圆的半径，如果小于圆的半径，则发生碰撞，否则就没有发生碰撞。我们首先要找到圆距离矩形上最近的点的坐标，这种就要考虑圆心在矩形左侧，圆心在矩形上面，圆心在矩形右侧，圆心在矩形下面，圆心在矩形里面这五种情况。如果圆心在矩形里面，那么一定是碰撞的。其他四种情况根据每一种情况来计算得到矩形上离圆心最近的一点，下面举例其中一种情况，其他情况原理类似，比如圆心在矩形左侧，

![rect_circle_left](/assert/img/canvas/rect_circle_left.png)

这种情况下，最近一点的X轴坐标跟矩形左上角坐标的X轴坐标相等，跟圆心Y轴坐标相等，这样就可以得出来了，$(rect_x,circle_y)$。在canvas中具体代码实现如下，

```javascript
  /* 判断是否矩形和圆形发生碰撞 */
  private didRectWidthCircleCollide(rectSprite: RectSprite, circleSprite: CircleSprite) {
    let closePoint = { x: undefined, y: undefined };
    if (circleSprite.x < rectSprite.left) {
      closePoint.x = rectSprite.left;
    } else if (circleSprite.x < rectSprite.left + rectSprite.width) {
      closePoint.x = circleSprite.x;
    } else {
      closePoint.x = rectSprite.left + rectSprite.width;
    }
    if (circleSprite.y < rectSprite.top) {
      closePoint.y = rectSprite.top;
    } else if (circleSprite.y < rectSprite.top + rectSprite.height) {
      closePoint.y = circleSprite.y;
    } else {
      closePoint.y = rectSprite.top + rectSprite.height;
    }
    return distance(circleSprite.x, circleSprite.y, closePoint.x, closePoint.y) < circleSprite.radius;
  }
```

[这里是我的外接图形碰撞检测在线示例](https://snayan.github.io/canvas-demo/?module=collide_01)。

#### 光线投射检测

> 光线投射法：画一条与物体的速度向量相重合的线，然后再从另外一个待检测物体出发，绘制第二条线，根据两条线的交点位置来判定是否发生碰撞。

![light_collide](/assert/img/canvas/light_collide.png)

 光线投射法一般还会结合边界值检测来进行严格准确的判断，这种方法要求我们在动画更新中，不断计算出两个速度向量的交点坐标，根据交点坐标判断是否满足碰撞条件，交点满足了条件，我们还要运用边界值检测方法来检测运动物体是否满足边界值条件，只有同时满足才判断为发生碰撞。这种检测，准确度一般比较高，特别是适用于运动速度快的物体。以小球投桶示例，检测代码如下，

```javascript
  /* 是否发生碰撞 */
  public didCollide(ball: CircleSprite, bucket: ImageSprite) {
    let k1 = ball.verticalVelocity / ball.horizontalVelocity;
    let b1 = ball.y - k1 * ball.x;
    let inertSectionY = bucket.mockTop; //计算交点Y坐标
    let insertSectionX = (inertSectionY - b1) / k1; //计算交点X坐标
    return (
      insertSectionX > bucket.mockLeft &&
      insertSectionX < bucket.mockLeft + bucket.mockWidth &&
      ball.x > bucket.mockLeft &&
      ball.x < bucket.mockLeft + bucket.mockWidth &&
      ball.y > bucket.mockTop &&
      ball.y < bucket.mockTop + bucket.mockHeight
    );
  }
}
```

[这里是我的光线投射检测在线示例](https://snayan.github.io/canvas-demo/?module=collide_02)。

#### 分离轴检测

在判断凸多边形的碰撞检测时，我们可以使用分离轴方法。在学习分离轴检测之前，我们需要先熟悉向量的一些基础知识。

向量基础知识：

* 在平面二维坐标系中，我们可以使用向量来表示某个点的位置。向量表示法就是从坐标原点（0，0）指向目标点（x，y） 。
* 两个向量相减，结果是另外一条新的向量。
* 两个向量做点积，可以得到投影的值。
* 单位向量，就是长度为1的向量，其实际作用是表示方向。
* 一个向量垂直于另外一个向量，我们叫做法向量。

![system](/assert/img/canvas/system.png)

图中可以看到，$\overrightarrow{oa} -\overrightarrow{ob} = \overrightarrow{ba}$，$\overrightarrow{oa} * \overrightarrow{ob} = |od|$。多余凸多边形的每个顶点，我们可以用向量来表示。

分离轴检测思路，

1. 先获取被检测多边形的所有的投影轴，一般只需要计算出多边形对应边的投影轴即可
2. 计算出被检测多边形在每一条投影轴上的投影
3. 判断它们的投影是否重叠，如果存在在任意一条投影轴的投影不重叠，则说明它们没有发生碰撞，否则就发生了碰撞

```typescript
  /* 判断是否发生碰撞 */
  public didCollide(sprite: Sprite, otherSprite: Sprite) {
    let axes1 = sprite.type === 'circle' ? (sprite as Circle).getAxes(otherSprite as Polygon) : (sprite as Polygon).getAxes();
    let axes2 = otherSprite.type === 'circle' ? (otherSprite as Circle).getAxes(sprite as Polygon) : (otherSprite as Polygon).getAxes();
    // 第一步：获取所有的投影轴
    // 第二步：获取多边形在各个投影轴的投影
    // 第三步：判断是否存在一条投影轴上，多边形的投影不相交，如果存在不相交的投影则直接返回false，如果有所的投影轴上的投影都存在相交，则说明相碰了。
    let axes = [...axes1, ...axes2];
    for (let axis of axes) {
      let projections1 = sprite.getProjection(axis);
      let projections2 = otherSprite.getProjection(axis);
      if (!projections1.overlaps(projections2)) {
        return false;
      }
    }
    return true;
  }
}
```

下面我们就按照这三个步骤来，一步一步实现分离轴检测方法。


获取投影轴

![projection](/assert/img/canvas/projection.png)

在多边形中，我们是以边来建立边向量的，边向量的法向量，就是这条边的投影轴了。对于投影轴，我们只需它的方向，所以一般会把它格式化为单位向量。

```typescript
//获取凸多边形的投影轴  
public getAxes() {
    let points = this.points;
    let axes = [];
    for (let i = 0, j = points.length - 1; i < j; i++) {
        let v1 = new Vector(points[i].x, points[i].y);
        let v2 = new Vector(points[i + 1].x, points[i + 1].y);
        axes.push(
            v1
            .subtract(v2)
            .perpendicular()
            .normalize(),
        );
    }
    let firstPoint = points[0];
    let lastPoint = points[points.length - 1];
    let v1 = new Vector(lastPoint.x, lastPoint.y);
    let v2 = new Vector(firstPoint.x, firstPoint.y);
    axes.push(
        v1
        .subtract(v2)
        .perpendicular()
        .normalize(),
    );
    return axes;
 }
```

获取了待检测图形的投影轴之后，我们就需要计算图形在每条投影轴上的投影

```typescript
  public getProjection(v: Vector) {
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    for (let point of this.points) {
      let p = new Vector(point.x, point.y);
      let dotProduct = p.dotProduct(v);
      min = Math.min(min, dotProduct);
      max = Math.max(max, dotProduct);
    }
    return new Projection(min, max);
  }
```

最后判断投影是否重叠

```typescript
  /* 投影是否重叠 */
  overlaps(p: Projection) {
    return this.max > p.min && p.max > this.min;
  }
```

其中，如果是一个圆形与一个凸多边形的检测时，在计算圆对应的投影轴时比较特殊，圆只有一条投影轴，就是圆心与它距离多边形最近顶点的向量，

```typescript
  //获取圆的投影轴
  public getAxes(polygon: Polygon) {
    // 对于圆来说，获取其投影轴就是将圆心与他距离多边形最近顶点的连线
    let { x, y } = this;
    let nearestPoint = null;
    let nearestDistance = Number.MAX_SAFE_INTEGER;
    for (let [index, point] of polygon.points.entries()) {
      let d = distance(x, y, point.x, point.y);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestPoint = point;
      }
    }
    let v1 = new Vector(x, y);
    let v2 = new Vector(nearestPoint.x, nearestPoint.y);
    return [v1.subtract(v2).normalize()];
  }
```

[这里是我的分离轴检测在线示例](https://snayan.github.io/canvas-demo/?module=collide_03)。

#### 小结

这篇笔记详细记录了2d图形中碰撞检测的方法，比较简单的方法是外接图形法和边界值检测法，它们相对不是那么精确，比较复杂和精确的方法有光线投射法和分离轴法。根据不同的场景和精确度要求，我们选择不同的方法。其他，除了上面几种，还有像素检测等方法也可以实现碰撞检测，像素检测是以像素为单位来检测，如果存在不透明的像素在同一个坐标上重叠，则说明发生了碰撞，具体实现可以查看[Pixel accurate collision detection with Javascript and Canvas](https://benjaminhorn.io/code/pixel-accurate-collision-detection-with-javascript-and-canvas/)。

对于这几种检测方法，强力建议熟悉掌握分离轴法，因为它使用的范围最为广泛，对于任意的凸多边形，它都可以较精确的检测出来。由于分离轴检测法计算量一般比较大，所以在检测之前，我们先过滤掉那些根本不可能发生碰撞的图形，一般方法是空间分隔法，或者过滤可视区间不可见的图形等，然后再对较小的一部分可能发生碰撞的图形来进行计算检测，这样可以提升检测的速度。

#### 参考

* [“等一下，我碰！”——常见的2D碰撞检测](https://github.com/JChehe/blog/issues/8) **[部分图片引用这篇文章的，这篇文章写的较好，建议读者看看]**
* [《HTML5 Canvas 核心技术：图形、动画与游戏开发》](https://item.jd.com/11231175.html?dist=jd)