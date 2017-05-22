---
title: 阅读react源码--createClass部分
date: 2017-05-22 22:16:40
tags: react
---

ReactClass对象为React提供了`createClass`方法，实际上ReactClass有2个属性，一个是`createClass`，另外一个是`injection`对象。
````javascript
var ReactClass={
  createClass:function(spec){
    //createClass实现
  },
  injection:{
    injectMixin:function(mixin){
      injectedMixins.push(mixin);
    }
  }
}
````
<!--more-->
* `createClass`
  接受1个参数，一个对象，这个对象必须包含`render`方法；结果返回一个构造函数。注意，`createClass`方法将在16.X版本中移除了，所以现在要用es6的`class`语法了。
  ````javascript
  var createClass=function(spec){
    var Constructor=function(props,context,updater){
        //这段代码是不是很熟悉，跟component里的一样。
        this.props=props;
        this.context=context;
        this.refs=emptyObject;
        this.updater=updater|| ReactNoopUpdaterQueue;

        //获取初始化的state
        var initialState=this.getInitialState?this.getInitialState():null;
        //getInitialState()必须返回对象
        !(typeof initialState==='object' && !Array.isArray(initialState))?'提示报错':void 0;
        this.state=initialState;

        //继承ReactComponent，并重写replaceState和isMounted
        Constructor.prototype=new ReactClassComponent();
        Constructor.prototype.constructor=Constructor;

        //mixin提前注入的对象,通过ReactClass.injection.injectMixin注入
        injectedMixins.forEach(mixSpecIntoComponent.bind(null,Constructor));
        //Mixin一些其他的属性
        mixSpecIntoComponent(Constructor,spec);

        //赋值初始化的props
        if(Constructor.getDefaultProps){
          Constructor.defaultProps=Constructor.getDefaultProps();
        }

        //判断是否有render方法，没有就报错
        !Constructor.prototype.render?'提示报错':void 0;

        //赋值没有定义的默认的生命周期的函数为null
        for(var methodName in ReactClassInterface){
          if(!Constructor.prototype[methodName]){
            Constructor.prototype[methodName]=null;
          }
        }
  	}
    //返回构造函数
    return Constructor;
  }
  ````
  继承ReactComponent并重写`replaceState`，`isMounted`的代码：
  ````javascript
  //Mixin replaceState和isMounted的对象
  var ReactClassMixin={
    replaceState:function(newState,callback){
      this.updater.enqueueReplaceStaet(this.newState);
      if(callback){
        this.updater.enqueueCallback(this,callback,'replaceState');
      }
    },
    isMounted:function(){
      return this.updater.isMounted(this);
    }
  }

  //合并ReactComponent.prototype，和 ReactClassMixin
  var ReactClassComponent=function(){};
  Object.assign(ReactClassComponent.prototype,ReactComponent.prototype,ReactClassMixin);

  //继承ReactClassComponent
  Constructor.prototype=new ReactClassComponent();
  Constructor.prototype.constructor=Constructor;
  ````
  Mixin一些其他的属性的代码：
  ````javascript
  var RESERVED_SPEC_KEYS={
    displayName:function(Constructor,displayName){
      Constructor.displayName=displayName;
    },
    mixins:function(Constructor,mixins){
      if(mixins){
        for(var i=0;i<mixins.length;i++){
          mixSpecIntoComponent(Constructor.mixins[i]);
        }
      }
    },
    childContextTypes:function(COnstrcutor,childContextTypes){
      //.....
    },
    contextTypes:function(Constructor,contextTypes){
      //......
    },
    getDefaultProps:function(Constructor,getDefaultProps){
      //....
    },
    propTypes:function(Constructor,propTypes){
      //....
    },
    statics:function(Constructor,statics){
      //....
    },
    autobind:function(){}
  }
  function mixSpecIntoComponent(Constructor,spec){
    //如果spec中有mixins，则合并
    if(spec.hasOwnProperty('mixins')){
      RESERVED_SPEC_KEYS.mixins(Constructor,spec.mixins);
    }
    var proto=Constructor.prototype;
    for(var name in spec){
      if(!spec.hasOwnProperty(name)){
        continue;
      }
      if(name==='mixins'){
        //第一步已经合并了mixins属性了，所以此处不需要再次合并
        continue;
      }
      var property=spec[name];
      //合并保留的关键属性
      if(RESERVED_SPEC_KEYS.hasOwnProperty(name)){
        RESERVED_SPEC_KEYS[name](Constructor,property);
      }else{
        //合并自定义的属性
        ....
      }

    }
  }
  ````
* `injection`
  通过调用`ReactClass.injection.injectMixin`可以全局注入需要mixin的对象，此后在调用`ReactClass.createClass(spec)`的时候就不需要在单独注入了。
  ````javascript
  var injection={
    injectMixin:function(mixin){
      injectedMixins.push(mixin);
    }
  }
  ````

  ​react版本15.5.4。