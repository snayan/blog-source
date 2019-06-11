---
title: webpack构建常见流程
date: 2018-06-27 16:03:05
tags: [webpack]
---

现在前端项目的构建一般基本都是基于webpack的。项目的技术栈目前比较主流的是react全家桶和vue全家桶。
趁空闲，以公司一个项目整理了webpack构建常见的流程,这个项目是使用vue全家桶开发的。

### 技术栈：

* vue
* typescript

### 浏览器支持：

````json
"browserslist": [
    "> 1%",
    "last 2 versions",
    "not ie <= 9",
    "Android >= 4.3"
]
````
<!--more-->
### 流程图

![](./webpack_build.png)

### 功能

* babel
* postcss
* eslint

#### babel
javascript compiler，让我们可以在项目中使用较新JavaScript特性。可以通过**.babelrc**文件指定我们需要编译到的目标版本
````json
{
  "presets": [
    ["env", {
      "modules": false,
      "useBuiltIns": "usage"
    }],
    "stage-2"
  ],
  "plugins": ["transform-vue-jsx", "transform-runtime"]
}
````

#### postcss
a tool for transforming styles with JS plugins，可以让我们在项目使用一些较新css的特性。可以通过**.postcssrc.js**文件指定我们配置的postcss插件
* 可以通过rem方案来处理移动设备上的适配，在构建过程中，使用了px2rem插件来将px转为rem。
* 使用了postcss-import将@import引入的css文件内容内联到当前文件内
* postcss-url，配合postcss-import使用
* postcss-cssnext，使用一些css新特性，**目前已建议使用postcss-preset-env替换**。
* postss-pxtorem，将px转为rem

````js
module.exports = {
  "plugins": {
    "postcss-import": {
      path: "src/css/"
    },
    "postcss-url": {},
    "postcss-cssnext": {},
    "postcss-pxtorem": {
      rootValue: 75,
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: [],
      replace: true,
      mediaQuery: false,
      minPixelValue: 2
    }
  }
}
````

#### tslint
定制项目javascript使用的标准化，建议将多个项目统一定制为一套。可以在tslint.json中定制项目的检查规则。
```json
{
    "extends": "tslint:recommended",
    "rulesDirectory": ["path/to/custom/rules/directory/", "another/path/"],
    "rules": {
        "max-line-length": {
            "options": [120]
        },
        "new-parens": true,
        "no-arg": true,
        "no-bitwise": true,
        "no-conditional-assignment": true,
        "no-consecutive-blank-lines": false,
        "no-console": {
            "severity": "warning",
            "options": [
                "debug",
                "info",
                "log",
                "time",
                "timeEnd",
                "trace"
            ]
        }
    },
    "jsRules": {
        "max-line-length": {
            "options": [120]
        }
    }
}
```
### 环境配置
在配置webpack文件时，分dev和prod环境，不同的环境配置项有所差别，主要体现在plugin的使用上。主要有三个webpack配置文件

* webpack.base.conf.js，dev和prod公用的基础配置，主要loader的配置
* webpack.dev.conf.js，dev环境的配置，主要配置了webpack-dev-serve，供开发环境使用
* webpack.prod.conf.js，production环境的配置，主要增加了一些优化的配置，比如OptimizeCSSPlugin，UglifyJsPlugin
可以根据实际业务情况，配置不同环境变量，比如，我整理的这个项目，是会区分不同国家，以及不同的测试部署环境。在区分不同国家，不同部署环境时，采用了test，staging，live等环境名称。development和production只是针对开发人员而言的，在本地开发就是development，代码部署到test，staging，live都是production。对不同国家，不同部署环境，又有dev.env.js和prod.env.js.这两个文件其实是一样的，只不过参数不同而已。**可以统一从process.env.env和process.env.cid拿参数，这样就可以不需要这两个配置文件了，且不需要在build脚本中去动态替换prod.env.js里的配置项（个人觉得，可以讨论）**
* dev.env.js

````javascript
const merge = require('webpack-merge');
const prodEnv = require('./prod.env');

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  country: '"sg"',
  environment: '"test"'
});
````

* prod.env.js

```javascript
const COUNTRY = 'sg';
const shopeeEnvironment = 'live';

module.exports = {
  NODE_ENV: '"production"',
  country: '"' + COUNTRY + '"',
  environment: '"' + shopeeEnvironment + '"'
};

```

### 使用

* 在dev开发环境，需执行`npm run start `或者`yarn start`
* 在build时，需执行`npm run build`或者`yarn build`

### 其他

* babel-polyfill，对不同设备对js的兼容，**可以考虑使用polyfill.io，针对具体设备引入具体的feature**
* normalize.css，针对Html5，样式reset