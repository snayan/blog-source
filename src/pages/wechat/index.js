import React from "react"
import Page from "../../components/Page"

class Wechat extends React.Component {
  render() {
    return (
      <Page location={this.props.location} title="加好友">
        <h2>加好友</h2>
        <main>
          <p>
            最近有收到一些朋友想加博主微信的小请求，这里做简单说明
          </p>
          <ul>
            <li>博主很少发朋友圈，一年估计不会超过10条</li>
            <li>朋友圈里大部分是博主日常生活状态和琐事，可能对读者并无帮助</li>
            <li>技术交流和沟通可以通过邮件进行，博主会定期查看邮件并回复</li>
          </ul>
          <p>
            如果你还是想加博主微信，下面一些规则可能需要了解
          </p>
          <ul>
            <li>
              加好友时，<span style={{ background: 'yellow' }}>请备注来源「三羊的小站」以及添加原因</span>，过滤一些中介或者骗子
            </li>
            <li>
              博主并不能保证回复消息，或者即时回复
            </li>
            <li>
              博主会定期清理一下微信联系人，可能会误删
            </li>
          </ul>
          <p>
            博主wx: hello_zzyy
          </p>
        </main>
      </Page>
    )
  }
}

export default Wechat
