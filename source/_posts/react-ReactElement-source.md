---
title: 阅读react源码--ReactElement部分
date: 2017-05-30 16:12:19
tags: react
---

ReactElement对象为React提供了`createElement`，`createFactory`，`cloneElement`，`isValidElement`四个方法。ReactElement是一个工厂方法，不是类模式，不要使用`new`去调用。检查一个对象是否是react element对象，通过检查这个对象的`$$typeof`是否等于`Symbol.for('react.element')`

````javascript
var ReactElement=function(type,key,ref,self,source,owner,props){
  var element={
	$$typeof:REACT_ELEMENT_TYPE,//Symbol['for']('react.element')
    type:type,
    key:key,
    ref:ref,
    props:props,
    _owner:owner
  };
  if(process.env.NODE_ENV!=='production'{
      .......//增加一些其他的属性
      if(Object.freeze){
      Object.freeze(element.props);
      Object.freeze(element);
    }
  })
  return element;
}
````
<!--more-->
* `createElement`
  第一个参数是`type`，实际是一个Component的构造函数，在`type.defaultProps`上定义默认的`props`值；第二个参数`config`是一个对象或者`null`，对象提供了`props`名，也可以提供`key`，`ref`，`__self`，`__source`，第三个参数及后续的参数是`children`
  ````javascript
  ReactElement.createElement=function(type,config,children){
    var propName;
    var props={};
    var key=null,ref=null,self=null,source=null;
    if(config!=null){
      if(hasValidRef(config)){
        ref=config.ref;
      }
      if(hasValidKey(config)){
        key=''+config.key;
      }
    }
    self=config.__self===undefined?null:config.__self;
    source=config.__source===undefined?null:config.__source;
    //赋值config里配置的props
    for(propName in config){
      if(hasOWnProperty.call(config,propName) && !['key','ref','__selft','__source'].includes(propName)){
        props[propName]=config[propName];
      }
    }
    //赋值props.children
    var childrenLength=arguments.length-2;
    if(childrenLength===1){
      props.children=children;
    }else if(childrenLength>1){
      var childArray=Array(childrenLength);
      for(var i=0;i<childrenLength;i++){
        childArray[i]=arguments[i+2];
      }
      props.children=childArray;
    }
    //赋值props的默认值
    if(type && type.defaultProps){
      var defaultProps=type.defaultProps;
      for(propName in defaultProps){
        if(props[propName]===undefined){
          props[propName]=defaultProps[propName];
        }
      }
    }
    ....//非开发环境配置
    //返回react elment
    return ReactElement(type,key,ref,self,source,ReactCurrentOwner.current,props);
  }
  ````

* `createFactory`
  这个方法返回一个创建react element的函数。接受一个参数，`type`，用于指定要创建的element的类型。
  ````javascript
  ReactElement.createFactory=function(type){
    var factory=ReactElemet.createElement.bind(null,type);
    factory.type=type;
    return factory;
  }
  ````

* `cloneElement`
  这个方法用于克隆一个已存在的element，第一个参数就是`element`，用于被复制的，第二个是`config`，第三个是`children`，第二个和第三个参数与`createElement`意义一样，用于设置props和children的。其中，如果指定了config，则会覆盖原element中的props，如果指定了children，则同样会覆盖原element的children。
  ````javascript
  ReactElement.cloneElement=function(element,config,children){
    var propName;
    //先复制原element的props和key,ref.
    var props=_assign({},element.props);
    var key=element.key,ref=element.ref;
    var self=element._self,source=element._source,owner=element._owner;
    //如果config不为null,则覆盖原element的props和,key,self..
    if(config!=null){
      if(hasValidRef(config)){
        ref=config.ref;
        owner=ReactCurrentOwner.cuurent;
      }
      if(hasValidKey(config)){
        key=config.key;
      }
      var defaultProps;
      if(element.type && element.defaultProps){
        defaultProps=element.type.defaultProps;
      }
      for(propName in config){
        if(hasOwnProperty.call(config,propName) && !['key','ref','__self','__source'].includes(propName)){
          if(config[propName]===undefined &&  defaultProps[propName]!==undefined){
            props[propName]=defaultProps[propName];
          }else{
            props[propName]=config[propName];
          }
        }
      }
    }
    //如果children不为null,则重新指定新的element的children
    var childrenLength=arguments.length-2;
    if(childrenLength===1){
      props.children=children;
    }else if(childrenLength>1){
      var childArray=Array(childrenLength);
      for(var i=0;i<childrenLength;i++){
        childArray[i]=arguments[i+2];
      }
      props.children=childArray;
    }

    //最后也是使用ReactElement工厂创建新的react element
    return ReactElement(element.type,key,ref,self,source,owner,props);
  }
  ````

* `isValidElement`
  这个方法是用于来判断一个对象是否是react element对象。判断的依据就是react element的对象会有一个属性`$$typeof`，它等于`Symbol['for']('react.element')`
  ````javascript
  ReactElement.isValidElement=function(object){
    return typeof object==='object' && object !==null && object.$$typeof===Symbol['for']('react.element');
  }
  ````
 react版本15.5.4。