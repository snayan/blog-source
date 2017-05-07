---
title: 单例模式
date: 2017-05-02 23:24:19
tags: 设计模式
---

单例模式，简单的说就是保证一个特定的类仅有一个实例，也就是不管实例化几次，都是返回的同一个实例。在javascript中，没有类的概念，每一个对象字面量都可以是认为是一个单例。对象全等，表示引用的同一个内存地址。

在javascript中实现单例模式，有如下几种方式：

* 全局变量方式，这种方式不好，全局变量可被随意改变，且可能与其他类库命名冲突

  ````javascript
  var instance;
  function Singleton(){
    if(!(this instanceof Singleton)){
      return new Singleton();
    }
    if(instance instanceof Singleton){
      return instance;
    }
    //做一些其他操作
    instance=this;
  }
  ````
<!--more-->
* 函数静态属性方式，这种方式也不好，函数静态属性也是公共的访问权，比第一种要好。

  ````javascript
  function Singleton(){
    if(!(this instanceof Singleton)){
      return new Singleton();
    }
    if(Singleton.instance instanceof Singleton){
      return Singleton.instance;
    }
    Singleton.instance=this;
  }
  ````

* 闭包模式，这种方式会创建一个闭包，使得实例不可被外部直接修改，比第二种好。

  ````javascript
  function Singleton(){
    if(!(this instanceof Singleton)){
      return new Singleton();
    }
    var instance;
    //改写Singleton构造函数
    Singleton=function(){
      return instance;
    }
    //使得改写后的Singleton的原型指向原构造函数的原型
    Singleton.prototype=this.constructor.prototype;
    //修改改写后的Singleton的原型的constracutor指向自己，这个地方比较容易被忽略
    Singleton.prototype.constracutor=Singleton;
    instance=new Singleton();
    return instance;
  }
  ````

  实际上还有另外一种闭包模式，相比上面这种形式，更好理解一些，但代码封装性和移植性不是很好。

  ````javascript
  var Singleton;
  (function(){
    var instance;
    Singleton=function(){
      if(!(this instanceof Singleton)){
        return new Singleton();
      }
      if(instance instanceof Singleton){
        return instance;
      }
      instance=this;
    }
  })();
  ````

  ​


