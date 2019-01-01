---
title: 理解h5与native(ios)通信细节
date: 2018-12-31 11:11:00
tags: [h5, bridge]
---

在跨平台客户端开发中，H5是使用最为广泛的方式，它既可以运行在iOS中，也可以运行在Android中，还可以运行在web浏览器中，可以说是"write once, run anywhere"。但是，H5最为人诟病的就是用户体验不如native流畅，特别是对于低端机型和较差的网络环境，在页面加载时通常有较长一段时间的白屏等待时间。H5开发者想尽办法缩短首屏时间，用户可交互时间，为此使用了一系列的优化手段，比如ssr，code split，compress，lazy load，preload等等，其实主要是围绕**尽量少**这一核心原则。为了平衡跨终端能力和用户体验，现在流行的又有RN和Flutter解决方案等。咦，感觉跑题了，还是回到标题说的，具体来看看在IOS中，H5是怎么与native通信的。文字略长，但是我相信你看完了，会有所收获。

说到通信，无非就是两种方式，native调用h5，h5调用native。H5在iOS中的宿主是UIWebView或者WKWebView，在IOS8中，Apple引入了WKWebView，将UIWebView标记为Deprecated。现在来说，大部分app应该都是使用的WKWebView，除非那些需要兼容IOS8以下系统的才会兼容使用UIWebView，本文也主要是说说使用WKWebView的场景。在实现H5与native之间的通信，比较流行的库就是[WebViewJavascriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge)，为了真正弄明白原理，我也是通读了它的源码，然后根据它的实现思路，自己用swift也实现了一遍。下面就结合一个小例子，谈谈它的实现原理。
<!--more-->
假如有一个需求，是H5在app内会有一个截屏按钮，点击这个按钮能对当前webView截图，然后显示在我们的H5中一个`img`元素里。

<img src="/assert/img/bridge/p1.png" style="zoom:30%" />

如图可以看到，有一个截屏按钮，以及一个紫色区域，这个区域内有一个`img`，用来显示我们截屏之后的图片。

这个通常需要H5与native配合才能完成，截屏的功能肯定是native那边完成，但是触发时机肯定是H5这边来控制。native需要提供一个bridge接口，比如takeSnapshot，然后在H5中就需要调用takeSnapshot接口并获得相应数据，

```react
// h5部分代码
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      src: null,
    };
    this.takeSnapshot = this.takeSnapshot.bind(this);
  }
  takeSnapshot() {
    if (window.mpBridge) {
      window.mpBridge.ready((bridge) => {
        bridge.callHandler('takeSnapshot', ({ status, data }) => {
          if (status) {
            this.setState(() => {
              return {
                src: data.path,
              };
            });
          }
        });
      });
    }
  }
  render() {
    return (
      <div>
        <div className="operate">
          <button onClick={this.takeSnapshot}>截屏</button>
        </div>
        <div className="result">
          <img src={this.state.src} />
        </div>
      </div>
    );
  }
}

export default App;
```

这段代码比较简单，就不解释。可以看到在调用takeSnapshot的回调中，h5拿到了path，然后将path赋值给了`img`标签。

#### Bridge的初始化

在完成上面这个例子时，H5和native两边都需要先完成bridge的初始化。H5这边通常会在`html`的 `head`中加载一段sdk代码，用来触发生成H5端bridge对象，每个公司都会自己提供一个对外的sdk脚本，比如微信提供的sdk等。通常放在`head` 中，是因为它需要最先执行完成，这样你代码中才可以使用。这个sdk脚本，其实就是提供了一个`ready`函数，bridge对象完成之后，会调用里面的回调函数，并提供`bridge`对象作为参数。

```javascript
/* bridge sdk
 mpBridge.ready(bridge => {
   bridge.callHandler('cmd', params, (error, data) => {

   })
})
*/

(function(w, d) {
  // 已经加载了就直接返回，防止加载2遍
  if (w.mpBridge) {
    return;
  }

  // 是否bridge初始化完成
  let initialized = false;
  let queue = [];

  function ready(handler) {
    if (initialized) {
      // 如果bridge初始化完成，则直接派发，执行
      dispatch(handler);
    } else {
      // 否则，先缓存在队列里，等待bridge完成后派发，执行
      queue.push(handler);
    }
  }

  function dispatch(handler) {
    // 派发，执行时，会提供bridge对象当作第一个参数
    handler(w.ClientBridge);
  }

  function _initialize() {
    // bridge初始化完成了，就开始派发，执行先前缓存在队列里的
    for (var handler of queue) {
      dispatch(handler);
    }
    queue = [];
    initialized = true;
  }

  // 通知native，注入bridge对象到当前的window对象上
  setTimeout(function() {
    var iframe = d.createElement('iframe');
    iframe.hidden = true;
    // 这个src会被native那边拦截，然后根据host == 'bridgeinject',来判断是否注入bridge对象
    iframe.src = 'https://bridgeinject';
    d.body.appendChild(iframe);
    setTimeout(function() {
      iframe.remove();
    });
  });

  // interface api
  const mpBridge = {
    ready: ready,
    version: '1.0',
    _initialize: _initialize,
  };

  window.mpBridge = mpBridge;
})(window, document);
```

这是我写的sdk，用于完成上面那个截屏的例子。最为主要功能是生成一个隐藏的iframe，来通知native注入bridge对象到window上，注入的bridge对象就是ClientBridge。它本身自己也会生成一个对象`mpBridge`，用来提供给开发人员。当然，这个 sdk的功能比较简单，其他公司的可能比较复杂，但是它绝对包含了最为重要的功能。这个时候h5中ClientBridge的初始化才算完成了一半，ClientBridge还没有被真正创建，真正被创建的过程是在native中完成的。

在native端，在viewController中创建了webview并实现了navigationDelegate，并且也创建了NativeBridge。在navigationDelegate中，**我们可以拦截h5中iframe发送的请求，理解这点非常重要，h5与native之间的通信就是通过这个拦截操完成的**，后面会看到具体拦截细节，我们先看native端NativeBridge初始化的过程。

```swift
/// native 代码
///  创建webview
webView = WKWebView(frame: CGRect.zero, configuration: configuration)
webView.navigationDelegate = self
/// 初始化native端bridge
if let bridgeScriptPath = Bundle.main.path(forResource: "bridge", ofType: "js") {
    self.bridge = Bridge(webView: webView, scriptURL: URL(fileURLWithPath: bridgeScriptPath))
}
```

在native端，也会生成一个bridge对象，通过这个对象，native可以注册接口函数给h5调用，native也可以调用h5中注册的函数。通过sdk中生成的iframe，触发注入h5端ClientBridge，此时，native端才开始把ClientBridge注入到h5中去，

```swift
/// native 代码
func injectClientBridge(completionHandler handler: EvaluateJavasriptHandler?) {
    if let data = try? Data(contentsOf: scriptURL),
    let code = String(data: data, encoding: .utf8) {
        /// 核心点就是，native可以直接执行JavaScript
        evaluateJavascript(code, completionHandler: handler)
    } else {
        handler?(nil, BridgeError.injectBridgeError)
    }
}
```

**在native端，可以直接以字符串形式执行JavaScript脚本**。通常，会先准备好ClientBridge的脚本，然后在native直接执行，就可以将它注入到H5中去了。我准备的ClientBridge脚本如下，

```javascript
/*
   ClientBridge.callHandler('cmd', params, (error, data) => {

   })
*/

(function(w, d) {
  // 已经注入了ClientBridge
  if (w.ClientBridge) {
    return;
  }

  // uid自增，用来标记callBackID的
  var uid = 0;
  // h5中消息队列，用来发送到native中去的
  var messageQueue = [];
  // h5回调函数映射表，通过callBackID关联  
  var callbacksMap = {};

  // 通信的scheme，可以是其他字符串
  var scheme = 'https';
  // 通信的host，用来标记请求是h5通信发出的
  var messageHost = 'bridgemessage';
  var messageUrl = scheme + '://' + messageHost;
  // 会创建一个iframe，h5发送消息给native，通过iframe触发  
  var iframe = (function() {
    var i = d.createElement('iframe');
    i.hidden = true;
    d.body.appendChild(i);
    return i;
  })();

  function _noop() {}

  // 处理来自native端的消息，
  function _handlerMessageFromNative(dataString) {
    console.log('receive message from native: ' + dataString);
    let data = JSON.parse(dataString);
    if (data.responseId) {
      // 如果有responseId , 则说明消息是h5调用了native的接口，根据responseId可以找到存储的回调函数，然后执行回调，将数据传递给H5
      var callback = callbacksMap[data.responseId];
      if (typeof callback === 'function') {
        callback(data.responseData);
      }
      callbacksMap[data.responseId] = null;
    } else {
      // 否则，就是native直接调用h5的接口，
      var callback;
      if (data.callbackId) {
        // 如果有callbackId，则要回发结果
        callback = function(res) {
          _doSend({ responseId: data.callbackId, responseData: res });
        };
      } else {
        // 否则，不处理
        callback = _noop;
      }
      // 通过handlerName,找到h5注册好的接口函数
      var handler = callbacksMap[data.handlerName];
      if (typeof handler === 'function') {
        handler(data.data, callback);
      } else {
        console.warn('receive unknown message from native:' + dataString);
      }
    }
  }

  // native 通过调用_fetchQueue函数来获取H5中消息队列里的消息
  function _fetchQueue() {
    var message = JSON.stringify(messageQueue);
    messageQueue = [];
    console.log('send message to native : ' + message);
    return message;
  }

  // 发送消息  
  function _doSend(message) {
    // 将消息加到消息队列里，  
    messageQueue.push(message);
    // 然后通过iframe触发  
    iframe.src = messageUrl;
  }

  // ClientBridge对外H5的函数，h5可以通过callHandler来调用native中的接口
  function callHandler(name, data, callback) {
    uid = uid + 1;
    if (typeof data === 'function') {
      callback = data;
      data = null;
    }
    if (typeof callback !== 'function') {
      callback = _noop;
    }
    // 先生成一个唯一的callbackId， 
    var callbackId = 'callback_' + uid + new Date().valueOf();
    // 将回调函数保存在哈希表中，后面通过responseId可以取出  
    callbacksMap[callbackId] = callback;
    // 发送  
    _doSend({ handlerName: name, data: data, callbackId: callbackId });
  }

  // ClientBridge对外h5的函数，h5可以通过registerHandler来注册接口，供native来调用
  function registerHandler(name, callback) {
    // 直接将注册的接口保存在哈希表中  
    callbacksMap[name] = callback;
  }

  // 在window上生成ClientBridge对象
  w.ClientBridge = {
    callHandler: callHandler,
    registerHandler: registerHandler,
    _fetchQueue: _fetchQueue,
    _handlerMessageFromNative: _handlerMessageFromNative,
  };

  // 调用sdk中的初始化方法  
  if (w.mpBridge) {
    w.mpBridge._initialize();
  }
})(window, document);

```

核心原理也是通过在h5中生成一个iframe，通过iframe来充当h5与native之间的信使。`ClientBridge.callHandler`和`ClientBridge.registerHandler`是暴露给h5端使用的，`ClientBridge._fetchQueue`和`ClientBridge._handlerMessageFromNative`是提供给native端使用的。只有当native执行了这一段脚本，h5中bridge才算真正初始化完成。

#### 拦截请求

在native端，通过实现WkWebView的WKNavigationDelegate，可以拦截h5中加载frame的请求，然后通过请求的scheme和host来判断是否是我们约定好的，例如上面注入bridge的sdk中，我们约定的scheme是https，host是bridgeinject。

```swift
/// native 部分代码   
/// 此函数就是拦截h5中iframe发送的请求
func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard webView == self.webView,
            let bridge = self.bridge,
            let url = navigationAction.request.url
        else {
            decisionHandler(.allow)
            return
        }
        if bridge.isBridgeInjectURL(url) {
            /// 如果注入bridge的请求，则开始注入bridge到h5中
            bridge.injectClientBridge(completionHandler: nil)
            /// 并取消掉本次请求，因为并不是真正的需要请求，
            decisionHandler(.cancel)
        } else if bridge.isBridgeMessageURL(url) {
            /// 如果是h5与native之间的消息请求，则处理h5那边的消息，
            bridge.flushMessageQueue()
            /// 同样的，需要取消掉本次请求，
            decisionHandler(.cancel)
        } else {
            /// 否则，其他情况，都正常请求
            decisionHandler(.allow)
        }
    }
```

上面的native中代码可以看到，通过实现了WKNavigationDelegate中decidePolicyForNavigationAction的方法，我们可以拦截iframe以及mainFrame的请求，然后做如下处理：

* 如果请求是注入bridge到h5的请求，则开始处理注入bridge对象到h5中，并取消本次请求。这个请求就是上面sdk中创建的iframe触发的。它的请求url是*https://bridgeinject*
* 如果请求是h5与native之间通信的请求，则开始处理h5中传递的消息，并取消本次请求。这个请求会在后面看到。它的请求url是*https://bridgemessage*
* 否则，就是正常的mainFrame或者iframe请求，正常处理请求

#### H5调用native接口

先来看看第一种通信方式，就是h5调用native中的接口，比如例子中，h5调用native提供的takeSnapshot接口实现截屏功能。

首先，native端必须先注册好takeSnapshot接口，这样h5才能使用。native端注册takeSnapshot接口代码如下，

```swift
/// native端，通过NativeBridge注册takeSnapshot接口
bridge?.registerHandler("takeSnapshot") {
    _, callback in
    /// 调用webView的takeSnapshot函数实现截屏
    self.webView.takeSnapshot(with: nil) {
        image, error in
        let fileName = "snapshot"
        guard let image = image, error == nil else {
            callback(Bridge.HandlerResult(status: .fail(-1)))
            return
        }
        // 将得到的UIimage保存到cache file目录下
        guard let _ = LocalStore.storeCacheImage(image, fileName: fileName) else {
            callback(Bridge.HandlerResult(status: .fail(-2)))
            return
        }
        // 生成src，提供给h5
        guard let src = ImageBridge.generateSRC(fileName: fileName) else {
            callback(Bridge.HandlerResult(status: .fail(-3)))
            return
        }
        // 生成返回数据，包含src
        var result = Bridge.HandlerResult(status: .success)
        result.data = ["path": src]
        callback(result)
    }
}
```

至于native端的NativeBridge实现细节，其实与ClientBridge思路一样的，大致也是有一个字典保存注册的函数，然后根据h5调用handlerName来查找出这个函数，然后执行，具体细节就不说了，感兴趣可以看看[这里](https://github.com/snayan/MusicPlayer/blob/master/MusicPlayer/bridge/Bridge.swift)。可以看到，h5与native两边必须提供相同的handlerName。通常呢，这个handlerName是native开发人员定义好的，然后H5开发人员按照文档使用。native定义好了接口，那么h5这边就需要调用了，

```javascript
// h5端，调用native定义的接口
if (window.mpBridge) {
    window.mpBridge.ready((bridge) => {
        bridge.callHandler('takeSnapshot', ({ status, data }) => {
            if (status) {
                this.setState(() => {
                    return {
                        src: data.path,
                    };
                });
            }
        });
    });
}
```

h5在调用`bridge.callHandler`时，生成唯一的callbackId，并将回调保存在哈希表中，然后通过iframe触发通知native。

```javascript
function callHandler(name, data, callback) {
    uid = uid + 1;
    if (typeof data === 'function') {
        callback = data;
        data = null;
    }
    if (typeof callback !== 'function') {
        callback = _noop;
    }
    // 生成一个唯一的callbackId
    var callbackId = 'callback_' + uid + new Date().valueOf();
    // 将回调函数保存在哈希表中
    callbacksMap[callbackId] = callback;
    // 触发iframe发送消息
    _doSend({ handlerName: name, data: data, callbackId: callbackId });
}
```

native通过拦截iframe的请求，判断是否h5中通信请求，如果是就开始处理，处理过程如下，

```swift
//native 核心代码如下
func flushMessageQueue() {
    // 执行ClientBridge._fetchQueue,获取h5中消息队列中数据
    evaluateJavascript("ClientBridge._fetchQueue()") {
        result, error in
         // 转成json
        let jsonData = try JSONSerialization.jsonObject(with: result, options: [])
        let messages = jsonData as! [BridgeData]
        for message in messages {
            if let callbackId =  message["callbackId"] as? String {
                /// 生成RequestMesage，调用native接口
                self.resumeWebCallHandlerMessage(RequestMessage(handlerName: message["handlerName"] as? String, data: message["data"] as? BridgeData, callbackId: callbackId))

            } 
        }
    }
}
```

获取了h5中消息之后，判断消息中是否包含了callbackId，如果包含了，则说明是h5发送的一个RequestMessage。通过handlerName取出native注册好的接口函数，然后执行，并返回结果。

```swift
func resumeWebCallHandlerMessage(_ message: RequestMessage) {
    // 通过handlerName拿到native注册的接口，
    guard let name = message.handlerName, let handler = self.responseHandlersMap[name] else {
        debugPrint("unkown handler name")
        return
    }
    // 然后执行接口，并返回数据
    handler(message.data) {
        result in
        // callbackId对应变成了responseId，返回的数据在responseData中
        let responseMessage = ResponseMessage(responseData: result.getData(), responseId: message.callbackId)
        self.sendToWeb(responseMessage)
    }
}
```

最后，native通过执行`ClientBridge._handlerMessageFromNative`来将结果返回给h5。

```swift
/// 将消息发送给h5端
func sendToWeb(_ message: MessageProtocol) {
    do {
        /// 先序列化json数据
        let data = try JSONSerialization.data(withJSONObject: message.serialization(), options: [])
        let result = String(data: data, encoding: .utf8) ?? ""
        // 最后执行ClientBridge._handlerMessageFromNative
        evaluateJavascript("\(clientBridgeName)._handlerMessageFromNative('\(result)')", completionHandler: { _,_ in
                                                                                                            })
    } catch {
        debugPrint(error)
    }
}
```

#### native调用h5接口

再来看看第二种通信方式，就是native调用h5端的接口，比如h5中会注册一个监听导航条上的返回按钮的函数，比较叫做onBackEvent，native通过调用h5中onBackEvent的接口函数，决定是否直接关闭当前webView。

类似的，h5中必须先注册onBackEvent接口，

```javascript
if (window.mpBridge) {
    window.mpBridge.ready((bridge) => {
        bridge.registerHandler('onBackEvent', (data, done) => {
            // do something, 
            // 返回true 则直接关闭当前webView，false 则不关闭当前webView
            done(true);
        });
    });
}
```

然后，在native中监听导航条那个返回按钮的点击事件中，调用h5的onBackEvent，根据结果来决定是否关闭当前webView。

```swift
/// 导航条返回按钮的点击事件 
@objc private func handleBackTap() {
    if let bridge = self.bridge {
        /// 调用h5中注册的onBackEvent函数，
        bridge.callHandler("onBackEvent") {
            data in
            guard let pop = data as? Bool else {
                return
            }
            // 如果为true，则关闭当前webView
            if pop {
                self.navigationController?.popViewController(animated: true)
            }
        }
    } else {
        self.navigationController?.popViewController(animated: true)
    }
}
```

NativeBridge中的callHandler函数实现思路和h5中的一样，也是生成一个唯一的callbackId，然后将回调保存在字典表中，再将消息发送到h5。

```swift
/// native 端 callHandler的实现
func callHandler(_ name: String, callback: @escaping RequestCallback) {
    // 生成一个唯一的callbackId
    let uuid = UUID().uuidString
    // 将回调保存在字典表中
    requestHandlersMap[uuid] = callback
    // 生成一个requestmessage，
    let requestMessage = RequestMessage(handlerName: name, data: nil, callbackId: uuid)
    // 然后发送到h5去
    sendToWeb(requestMessage)
}
```

h5这边通过`ClientBridge._handlerMessageFromNative` 可以接受这个消息，然后根据handlerName查找到h5已经注册的接口函数，最后执行并返回数据给native。

```javascript
// native call web
var callback;
if (data.callbackId) {
    // 如果有callbackId，则要回发结果
    callback = function(res) {
        _doSend({ responseId: data.callbackId, responseData: res });
    };
} else {
    // 否则，不处理
    callback = _noop;
}
var handler = callbacksMap[data.handlerName];
if (typeof handler === 'function') {
    handler(data.data, callback);
} else {
    console.warn('receive unknown message from native:' + dataString);
}
```

#### 通信流程图

![WebViewJavascriptBridge原理图](/assert/img/bridge/WebViewJavascriptBridge.png)

#### 展示截屏图片

其实，在h5调用native中takeSnapshot接口后，native实现了截屏，获得到UIImage，有两种返回可以返回数据给h5

1. native直接返回图片的base64数据，h5端直接展示
2. native现将图片存在cache 目录里，生成一个src，返回给h5，h5请求这个src的图片

其中第一种方式简单，但是图片直接生成的base64格式，数据太大，对于传递和调试极为不方便。第二种方式，麻烦一点，生成的src又必须是一个约定好的scheme格式，native又通过拦截请求，然后从cache目录里拿到图片，作为response返回。这次的拦截与iframe的拦截方式又不同，是通过`WKWebViewConfiguration.setURLSchemeHandler `来实现的，具体就不详细讨论了，感兴趣可以查看[这里](https://github.com/snayan/MusicPlayer/blob/master/MusicPlayer/Controllers/MPWebViewController.swift#L56-L58)。

#### 小结

通过一个例子，详细的讨论了h5与native之间的通信方式，核心原理如下

* native可以直接执行JavaScript字符串形式执行js脚本，与h5通信
* native可以拦截iframe的请求，执行h5的通信请求
* h5通过iframe来发送数据给native



