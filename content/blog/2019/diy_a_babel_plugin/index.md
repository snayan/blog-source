---
title: DIY 一个 Babel 插件
date: 2019-08-06 19:45:00
tags: [babel]
---

Babel，是一个 JavaScript 的编译工具，它可以将 es6+语法的代码，转换为浏览器兼容的低版本的代码。它简直就是一个神兵利器，前端工程师拥有了它，就可以在项目中使用一些较新的 es 语法。笔者决定弄懂它，并实现一个自己的 Babel 插件。

Babel 的工作原理，可以用如下公式表述。它实际上就是接受输入的源代码，然后对它做一些处理和转换，最后输出为目标版本的代码。

```javascript
const babel = sourceCode => distCode
```

在将输入的源码做处理或者转换时，这就需要用到了它的插件系统。一个插件只负责处理一件事，比如`@babel/plugin-transform-arrow-functions` ，就是负责将箭头函数转换为普通函数的插件。Babel 提供了非常多的插件，这样就足以保证可以将新的 es 语法转换为旧版本的代码形式。想了解详细的 Babel 插件系统，可以查看[Babel#Plugins](https://babeljs.io/docs/en/plugins)。

如果不配置任何的插件，Babel 将不会对源码做任何的处理，它只会照原样输出。下面举个例子，

```javascript
const babel = require("@babel/core")

const code = `
  const a = () => {
    console.log(1);
  }
`

// 没有配置任何plugin，那么转换之后的code将没有任何变化
babel.transform(code, undefined, (err, result) => {
  if (err) {
    throw err
  }
  console.log(result.code)
})
```

我们将箭头函数使用 Babel 来转换，但是没有配置任何的插件，最后转换之后的结果将和输入的代码一摸一样。

```bash
➜  babel node scripts/index.ts
const a = () => {
  console.log(1);
};
```

如果配置了`@babel/plugin-transform-arrow-functions`，Babel 就能正常将我们的箭头函数转换为普通函数的形式了。如下，

```javascript
// 配置@babel/plugin-transform-arrow-functions
babel.transform(
  code,
  { plugins: ["@babel/plugin-transform-arrow-functions"] },
  (err, result) => {
    if (err) {
      throw err
    }
    console.log(result.code)
  }
)
```

转换之后的代码如下，

```bash
➜  babel node scripts/index.ts
const a = function () {
  console.log(1);
};
```

对于其他的语法形式的转换，可以添加其他的插件。如果仅仅这样，对于一个实际项目代码的转换，将要配置非常多的插件。为了简化这种形式，Babel 又提供了 Presets，简单的说，就是将很多个插件集合重新命名为一个新名称。这样，只需要配置了这个 Presets，那么就相对于配置它所包含的所有的插件。Babel 定义了常用的 Presets，详细可以查看[Babel#Presets](https://babeljs.io/docs/en/presets)。

通过加入插件处理的方式，Babel 将会有非常好的可扩展性和可插拔性，比如 esNext 中又添加了一个新的语法糖，那么 Babel 只需要单独提供这个新语法处理的插件，并将它配置进去就可以了。对于前端工程师们，也可以根据实际业务需求，写自己的插件，将输入的源码处理成自己想要的输出。

为了能写出自己的 Babel 插件，我们就需要知道 Babel 将输入的代码转换成什么样子，插件接受的参数又是什么样子，最后需要返回的值是什么样子。

### AST

Babel 会将输入的源代码先转换成 AST(Abstract Syntax Tree)，然后将 AST 作为参数传给插件，插件将在 AST 上做处理，可以添加，删除或者改变节点。例如，我们上面例子中箭头函数 a，生成的 AST 大致结构如下,

```bash
  "program": {
    "type": "Program",
    "body": [
      {
        "type": "VariableDeclaration",
        "declarations": [
          {
            "type": "VariableDeclarator",
            "id": {
              "type": "Identifier",
              "name": "a"
            },
            "init": {
              "type": "ArrowFunctionExpression",
              "params": [],
              "body": {
                "type": "BlockStatement",
                "body": [
                  { ↔ }
                ],
              }
            }
          }
        ],
        "kind": "const"
      }
    ],
  },
```

AST 可以看成一棵树，它包含了很多的节点，每个节点都会包含一个 type 字段，这个 type 字段就是用来表明当前节点的类型，比如上面的`Identifier`表明是标识符，`ArrowFunctionExpression`表明是箭头函数表达式。想详细了解 AST 结构，可以查看[astexplorer](https://astexplorer.net/)。

要处理 AST 树，就得遍历这颗树，找到我们要处理的节点位置。对于一棵树的遍历，有 DFS(深度优先搜索)和 BFS(广度优先搜索)两种方式。对于 AST 的遍历，使用的是 DFS 方式。Babel 提供了`@babel/traverse`来遍历它，可以很方便的找到需要处理的节点位置。例如上面的例子，我们可以像下面这样找到`console.log(1)`中`1`这个节点位置，

```javascript
const babel = require("@babel/core")
const traverse = require("@babel/traverse")

const code = `
  const a = () => {
    console.log(1);
  }
`

babel.parse(code, null, (err, ast) => {
  if (err) {
    throw err
  }
  traverse(ast, {
    NumericLiteral(path) {
      console.log(JSON.stringify(path.node, null, 4))
    },
  })
})
```

由于`console.log(1)`接受的参数是一个数字字面量，所以它对应的`type`就是`NumericLiteral`。最后找到这个节点的信息如下，

```bash
➜  babel node scripts/index.ts
{
    "type": "NumericLiteral",
    "start": 37,
    "end": 38,
    "loc": {
        "start": {
            "line": 3,
            "column": 16
        },
        "end": {
            "line": 3,
            "column": 17
        }
    },
    "extra": {
        "rawValue": 1,
        "raw": "1"
    },
    "value": 1
}
```

可以看到，节点包含了 type，loc 信息，以及 value 等信息。更多关于 traverse 的使用，可以查看这里[Babel#traverse](https://babeljs.io/docs/en/babel-traverse)。

### Plugin

根据上面的思路，我们可以得出如下结论，

> Babel 中插件接受 AST 作为参数，然后可以在 AST 上做一些自定义的处理，最后返回处理之后的 AST。

为了验证这个结论正确性，我们来看看官方的[`@babel/plugin-transform-arrow-functions`](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-arrow-functions)的源码，源码只有 28 行代码，我贴出来，并做一些自己的注释，一起看看。

```javascript
import { declare } from "@babel/helper-plugin-utils";
import type NodePath from "@babel/traverse";

export default function declare((api, options) {
  // 判断当前Babel版本是否是v7.x
  api.assertVersion(7);

  // 接受我们传入的参数
  const { spec } = options;

  // 返回一个对象
  return {
    name: "transform-arrow-functions",

    visitor: {
      ArrowFunctionExpression(
        path: NodePath<BabelNodeArrowFunctionExpression>,
      ) {
        // 先判断是不是箭头函数表达式，不是就直接返回
        if (!path.isArrowFunctionExpression()) return;

        // 将箭头函数转为函数表达式
        path.arrowFunctionToExpression({
          allowInsertArrow: false,
          specCompliant: !!spec,
        });
      },
    },
  };
});
```

从源码可以看出，它返回一个`declare`函数。这个函数接受两个参数，一个`api`，一个是`options`。函数处理步骤如下，

1. 判断是否 Babel v7 的版本
2. 返回一个对象，包括`name`和`visitor`；其中，`visitor`又是一个对象，它才真正包含对肩头函数表达式的处理。

实际上，`path.arrowFunctionToExpression` 就是使用`@babel/types`中`arrowfunctionexpression`，详细可以查看[babel-types#arrowfunctionexpression](https://babeljs.io/docs/en/babel-types#arrowfunctionexpression)。

跟我们猜想的 Babel 插件样子有点出入，但是它包含了我们猜想的内容。最后，我们可以总结出写一个 Babel 插件的样子应该是这样的，

```javascript
export default function declare(api, options) {
  // api可以做一些版本兼容性判断，或者缓存相关的。
  // options就是我们配置插件时，传入的参数，这里插件内部就可以使用了

  return {
    name: "my-custorm-plugin",
    visitor: {
      // 遍历AST做处理
    },
  }
}
```

### DIY

清楚了 Babel 插件的模版形式，就可以按照这个模版写我们自定义的功能插件。假设，我们要写的一个 Babel 插件，就是去掉所有的`console.log`相关调试信息的代码。

```javascript
// 源代码
const a = () => {
  console.log(1)
}
```

例如上面的代码经过我们的 Babel 插件处理之后，输出的代码应该是一个空的箭头函数 a，

```javascript
// 转换之后
const a = () => {}
```

根据 Babel 插件模版代码，我们可以这样实现如下，

```javascript
// plugins/remove-console-log.js
const types = require("@babel/types")

module.exports = function declare(api, options) {
  api.assertVersion(7)

  return {
    name: "remove-console-log",
    visitor: {
      ExpressionStatement(path) {
        const expression = path.node.expression
        if (types.isCallExpression(expression)) {
          const callee = expression.callee
          if (types.isMemberExpression(callee)) {
            const objName = callee.object.name
            const methodName = callee.property.name
            if (objName === "console" && methodName === "log") {
              path.remove()
            }
          }
        }
      },
    },
  }
}
```

然后在 babel.config.js 中配置如下，

```javascript
module.exports = {
  plugins: ["./plugins/remove-console-log.js"],
}
```

最后，我们通过 Babel 转换之后就可以得到我们期望的结果了。

### 小结

通过自己实现一个 Babel 插件，然后贯穿整个过程把 Babel 原理弄清楚。上面其实还有一个小知识点，就是 Babel 怎么将源码转换成 AST 的。其实，它的过程也不难理解，只是在转换为 AST 之前，需要先进行词法分析，把源码字符串转换成 Token 数组；然后根据词法分析得到的结果，转换成 AST。完整的 Babel 原理过程可以简单的表述为如下，

![compiler](./compiler.png)

```javascript
let tokens = tokenizer(input) // 词法分析
let ast = parser(tokens) // 转换为AST
let newAst = transformer(ast) // 调用插件，进行转换
let output = codeGenerator(newAst) // 最后，生成新的目标代码
```

如果想更加详细研究 Babel 的过程，可以看看这个简易的编译器[the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)，它实现了完整的流程过程，代码也非常简单易懂。

### 参考

- [babeljs](https://babeljs.io/docs/en/)
- [babel-handbook](https://github.com/jamiebuilds/babel-handbook)
- [the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
