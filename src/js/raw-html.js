import Print from './print'
import { addHeader, addFooter } from './functions'

export default {
  print: (params, printFrame) => {
    // 创建 printable 元素(容器)
    params.printableElement = document.createElement('div')
    params.printableElement.setAttribute('style', 'width:100%')

    // 设置原始 html 为 printable 元素的 inner html 内容
    params.printableElement.innerHTML = params.printable

    // 添加 header
    if (params.header) {
      addHeader(params.printableElement, params)
    }

    // 添加 footer
    if (params.footer) {
      addFooter(params.printableElement, params)
    }

    // 打印 HTML 内容
    Print.send(params, printFrame)
  }
}
