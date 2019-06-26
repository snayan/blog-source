---
title: javascript中ToPrimitive详解
date: 2017-07-06 23:36:19
tags: [javascript]
---

看了这么多框架方面的东西，但注意，基础很重要。今天就来说说 javascipt 中容易忽略的类型转换问题。
在 javascript 中有 7 种基本类型，它们为：`string`，`number`，`boolean`，`undefined`，`null`，`symbol`，`object`。判断类型的方式是`typeof`。我们把`string`，`number`，`boolean`，`undefined`，`null`，`symbol`这几类称为原始类型。

```javascript
typeof 1 // 'number'
typeof "aa" // 'string'
typeof true // 'boolean'
typeof Symbol() // 'symbol'
typeof undefined // 'undefined'
typeof null // 'object'
typeof {} // 'object'
typeof function() {} // 'function'
```

注意两点，一是，对于函数，实际上也可以认为是`object`，但使用`typeof`得到的结果是`function`；二是，对于`null`，`typeof`得到的结果是`object`。

<!--more-->

再来看看这些类型之间是怎么转换的呢？今天我们讨论的是`object`类型转为原始值，对于原始值转为`object`，可以直接进行包装即可，例如`new Number(1)`，本次不予讨论，本次也不讨论原始类型之间的相互转换。

### object 转为 number

先看看下面的几个情况，`object`转`number`，输出的值是几多

```javascript
var obj = {}
console.log(Number(obj)) // NaN
obj = {
  valueOf: function() {
    return 1
  },
}
console.log(Number(obj)) // 1
obj = {
  toString: function() {
    return 2
  },
}
console.log(Number(obj)) // 2
obj = {
  valueOf: function() {
    return 1
  },
  toString: function() {
    return 2
  },
}
console.log(Number(obj)) // 1
```

从上面的例子可以看出，`object`转为`number`是根`valueOf`和`toString`函数有关的。具体步骤如下：

1. 调用对象的`valueOf()`方法，如果返回结果是原始类型，则根据这个原始类型再转换为`number`。
2. 否则，调用对象的`toString()`方法，如果返回的结果是原始类型，则根据这个原始类型再转换为`number`。
3. 否则，抛出一个异常`TypeError`。注意一点的是，`symbol`转为`number`时会抛出异常的，`null`转为`number`是`0`。

### object 转为 string

我们再来看看下面的例子，输出是几多

```javascript
var obj = {}
console.log(String(obj)) // "[object Object]"
obj = {
  valueOf: function() {
    return "a"
  },
}
console.log(String(obj)) // "[object Object]"
obj = {
  toString: function() {
    return "b"
  },
}
console.log(String(obj))
;("b")
obj = {
  valueOf: function() {
    return "a"
  },
  toString: function() {
    return "b"
  },
}
console.log(String(obj)) // "b"
```

从上面的例子可以看出，`object`转为`string`时也是与`valueOf`和`toString`有关，步骤如下：

1. 调用对象的`toString()`方法，如果返回值是原始类型，则再把这个原始类型转为`string`
2. 否则调用对象的`valueOf()`方法，如果返回值为原始类型，则再把这个原始类型转为`string`
3. 否则，抛出一个异常`TypeError`。注意，`symbol`转为`string`时会抛出异常。

### object 转为 boolean

`object`转为`boolean`时总是`true`，在 javascript 中转为`boolean`且值为`false`时只有以下几种值；`false`，`''`，`0`，`NaN`，`undefined`，`null`。

看了这么多，实际上主要是`object`转`number`和`string`时比较复杂，涉及 javascript 中内部的 ToPrimitive 方法。下面为 ecmascript262 中的官方定义：

> The abstract operation ToPrimitive takes an input argument and an optional argument PreferredType. The abstract operation ToPrimitive converts its input argument to a non-Object type. If an object is capable of converting to more than one primitive type, it may use the optional hint PreferredType to favour that type.

函数签名为`ToPrimitive(input[,PreferredType])=>PreferredType`。如果 PreferredType 为 Number,则执行以下步骤：

1. 如果 input 是原始值，则返回这个值，结束。
2. 否则，如果 input 是对象，则调用`input.valueOf()`。如果结果是原始值，则把结果值转为`Number`。
3. 否则，调用`input.toString()`。如果结果是原始值，则把结果值转为`Number`。
4. 否则，抛出一个`TypeError`。

如果`PreferredType`是`String`，则把第二步和第三步进行交换。`PreferredType`也可以省略的，这种情况下，日期会被认为是`String`而其他值会被认为是`Number`。
需要注意的是，每个对象都有默认的`valueOf`和`toString`方法，`valueOf`，`toString`则根据具体的类型有所区别，  如下：

```javascript
var obj = {}
console.log(obj.valueOf() === obj) // true
console.log(obj.toString()) // "[object Object]"
obj = [1, 2]
console.log(obj.valueOf() === obj) // true
console.log(obj.toString()) // "1,2"
obj = function() {}
console.log(obj.valueOf() === obj) // true
console.log(obj.toString()) // "function (){}"
obj = new Date()
console.log(obj.valueOf()) // 1497082546564
console.log(obj.valueOf() === obj) // false
console.log(obj.toString()) // "Sat Jun 10 2017 16:15:46 GMT+0800 (CST)"
//......
```

#### 参考

[ecma-262](http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive)
