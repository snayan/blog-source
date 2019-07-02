import React from "react"
import Page from "../../components/Page"

class About extends React.Component {
  render() {
    return (
      <Page location={this.props.location} title="关于">
        <h1>关于</h1>
        <main>
          <p>朋友，你好，欢迎来到三羊的小站。</p>
          <p>
            这个小站主要是博主记录自己在学习中的总结，以及对生活的思考。站内所有文章均是博主原创，仅代表个人想法，与其他任何组织或单位无关。
          </p>
          <h2>前端之旅</h2>
          <p>
            博主14年毕业于武汉科技大学计算机专业，目前正在深圳从事前端开发相关工作。刚毕业时，在武汉做了2年多的.net开发。
            在武汉工作期间，每天生活很简单，相对来说比较快乐，可能是刚毕业，想法没有那么多，也没什么压力。还记得每天中午休息时，跟同事一起开黑玩lol。随着慢慢成长，想法自然就多了一些。
            首先就是想去别的公司看看，想着出去，自己能不能找到工作。正好16年3月份，来深圳出差了一个星期。周末休息时，找了糖球，带着我转转，去了腾讯大厦，心里想，在腾讯工作的人肯定很牛。冲着这份向往，毅然辞职，选择了深圳。
            其次，觉得做.net没有多大意思，可能是因为自己当时主要是做一些ERP相关的系统，想往其他方向发展。正好那个时候，前端是非常热门的行业，听说找工作相对容易一些。
            于是，在16年清明节前一天辞职了，没告诉父母。辞职走出公司楼下，第一感觉就是又自由了，更轻松了。
          </p>
          <p>
            正好清明节，没回老家，自己在网上找了些前端相关的资料，面试题等，看了三天。清明过后，就直接来了深圳，在糖球那里落脚，暂时跟他一起住。
            然后开始疯狂的投简历，去面试。由于缺乏前端经验，以及没有什么技术积累，所以只能从小公司开始。后面经朋友介绍，认识了校友教授，他当时也离职了，但已经找好工作了。教授工作经历跟我类似，也是之前做.net，后面转的前端。
            教授跟我指出了前端面试的知识要点，以及帮我内推了一些前端岗位。大概找了两个星期左右，才开始收到两家公司的offer。
            两家都是创业公司，于是就选择其中一家规模大一点，而且面试官很厉害。这样，就正式开始了深圳的前端之旅。
          </p>
          <h2>本站历程</h2>
          <ul>
            <li>
              <p>
                16年，在深圳开始工作之后，就开始搭建了
                <a href="https://github.com/snayan/myblog" target="__blank">
                  第一个博客站点
                </a>
                。觉得维护起来特别不方便，并且每年还要续缴域名和服务器的费用。
              </p>
            </li>
            <li>
              <p>
                于是在17年，又使用了
                <a href="https://hexo.io/zh-cn/" target="__blank">
                  hexo
                </a>
                搭建了
                <a
                  href="https://github.com/snayan/blog-source/tree/v1.0"
                  target="__blank"
                >
                  第二个博客站点
                </a>
                。结合github
                page，虽然省去了域名和服务器费用，但是页面样式，以及内容结构不能自己控制，或者说需要学习hexo文档才能改变。
              </p>
            </li>
            <li>
              使用了2年之后，在19年，使用
              <a href="https://www.gatsbyjs.org/" target="__blank">
                gatsby
              </a>
              重新搭建了
              <a href="https://github.com/snayan/blog-source" target="__blank">
                第三个博客站点
              </a>
              ，也就是现在这个。现在，可以使用react方便更改页面样式，或者增加页面结构。
            </li>
          </ul>
          <h2>版权说明</h2>
          <p>
            站内所有文章，均采用
            <a
              href="https://creativecommons.org/licenses/by/4.0/deed.zh"
              target="__blank"
            >
              「署名 4.0 国际（CC BY 4.0）」
            </a>
            创作共享协议。只要在使用时署名，那么使用者可以对本站所有原创内容进行转载、节选、混编、二次创作，允许商业性使用。
          </p>
          <h2>转载说明 </h2>
          <p>
            站内所有文章的markdown版本均可以在
            <a
              href="https://github.com/snayan/blog-source/tree/master/content/blog"
              target="__blank"
            >
              content/blog
            </a>
            目录里找到。为了更好的学习和交流，欢迎各自形式的转载，请大家在转载时保留文章最后的出处。对于微信平台，在转载时请不要标注为「原创」。
          </p>
          <h2>支持</h2>
          <p>
            坚持做一件事特别不容易。我是从2017年开始写的，自己定的一个目标是，每年写12篇左右，坚持写十年。由于本人技术能力有限，有些文章可能是有错误的地方，希望看到的朋友能够帮我指正。每次想写一篇好的文章，特别不容易，需要查很多的资料。对于某一块知识点，必须深入弄懂，才能写清楚，不至于误导别人。如果你觉得本站对你有所帮助，请告诉你身边的朋友们吧，这就是对我最大的鼓励。
          </p>
        </main>
      </Page>
    )
  }
}

export default About
