---
title: canvas核心技术
date: 2018-07-09 19:53:41
tags: [canvas]
---

最近项目需求中要写较多 H5 小游戏，游戏本身体量不是很复杂，主要是承载较多业务逻辑，所以决定用 canvas 来完成游戏部分。之前只是知道 H5 中有 canvas 这个东西，也知道它大概是画图的，但具体怎么用，还是一无所知的。在[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)在看了一些相关资料，一口气也看了[HTML 5 Canvas 核心技术](https://book.douban.com/subject/24533314/)和[HTML5 2D 游戏编程核心技术](https://book.douban.com/subject/27088021/)，对 canvas H5 游戏编程有了大致的了解，发现 canvas 游戏编程其实挺有趣的。目前也在学习 webgl 相关知识，打算把前端可视化这一块也深入学习。现在先记录一些自己认为 canvas 比较重要的知识，回顾和再学习。后续在记录 webgl 相关知识。

### 主要知识点

本系列主要深入学习 canvas 2d 编程中相关比较重要和基础的知识，算是对「HTML 5 Canvas 核心技术」这本书的读后感，大致知识点如下：

1. 基础知识，学习如何绘制线段，图形，图片，文本等。
2. 动画知识，学习如何用 canvas 实现简单的动画以及相关影响因素
3. 碰撞检测，学习如何检测两个物体在运动过程中是否发生碰撞
4. 2D 游戏开发，学习用 canvas 开发 2D 游戏
5. canvas 相关小知识点

在学习过程中，最好是自己能动手实现，我就专门建了一个 canvas demo 的项目，里面都是自己在学习 canvas 时动手写的一些例子，感兴趣的可以去看看。

项目仓库地址：<https://github.com/snayan/canvas-demo>

demo 预览地址：<https://snayan.github.io/canvas-demo/>

我会按照上面的主要知识点，分篇幅来学习和回顾 canvas 相关的核心技术。主要如下：

- [canvas 核心技术-如何绘制线段](/post/how_to_draw_line/)
- [canvas 核心技术-如何绘制图形](/post/how_to_draw_graphics/)
- [canvas 核心技术-如何图片和文本](/post/how_to_draw_image_and_text/)
- [canvas 核心技术-如何实现简单动画](/post/how_to_implement_simple_animations/)
- [canvas 核心技术-如何实现复杂动画](/post/how_to_implement_complex_animations/)
- [canvas 核心技术-如何实现碰撞检测](/post/how_to_detect_collision/)
- canvas 核心技术-如何实现一个简单的 2D 游戏引擎
- canvas 核心技术-宽高，渐变，绘制真正 1px 线段
- canvas 核心技术-向量，三角函数
