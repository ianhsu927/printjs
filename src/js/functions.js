import Modal from './modal'
import Browser from './browser'

export function addWrapper(htmlData, params) {
    const bodyStyle = 'font-family:' + params.font + ' !important; font-size: ' + params.font_size + ' !important; width:100%;'
    return '<div style="' + bodyStyle + '">' + htmlData + '</div>'
}

export function capitalizePrint(obj) {
    return obj.charAt(0).toUpperCase() + obj.slice(1)
}

export function collectStyles(element, params) {
    const win = document.defaultView || window

    // 字符串变量存储每个元素的样式
    let elementStyle = ''

    // 循环计算样式
    const styles = win.getComputedStyle(element, '')

    for (let key = 0; key < styles.length; key++) {
        // 检查样式是否应该被处理
        if (params.targetStyles.indexOf('*') !== -1 || params.targetStyle.indexOf(styles[key]) !== -1 || targetStylesMatch(params.targetStyles, styles[key])) {
            if (styles.getPropertyValue(styles[key])) elementStyle += styles[key] + ':' + styles.getPropertyValue(styles[key]) + ';'
        }
    }

    // 打印友好默认值(弃用)
    elementStyle += 'max-width: ' + params.maxWidth + 'px !important; font-size: ' + params.font_size + ' !important;'

    return elementStyle
}

function targetStylesMatch(styles, value) {
    for (let i = 0; i < styles.length; i++) {
        if (typeof value === 'object' && value.indexOf(styles[i]) !== -1) return true
    }
    return false
}

export function addHeader(printElement, params) {
    // 创建 header div(division) 容器
    const headerContainer = document.createElement('div')

    // 检查 header 是否是文本或者原始 html
    if (isRawHTML(params.header)) {
        headerContainer.innerHTML = params.header
    } else {
        // 创建 header 元素
        const headerElement = document.createElement('h1')

        // 创建 header 文本节点
        const headerNode = document.createTextNode(params.header)

        // 设置 header 元素样式并将其添加到 header 容器中
        headerElement.appendChild(headerNode)
        headerElement.setAttribute('style', params.headerStyle)
        headerContainer.appendChild(headerElement)
    }
    // 插入 header 容器到打印元素的头部
    printElement.insertBefore(headerContainer, printElement.childNodes[0])
}

export function addFooter(printElement, params) {
    // // 创建 footer div(division) 容器
    let footerContainer = document.createElement('div')

    // 检查 footer 是否是文本或者原始 html
    if (isRawHTML(params.footer)) {
        footerContainer.innerHTML = params.footer
    } else {
        // 创建 footer 元素
        let footerElement = document.createElement('h1')

        // 创建 footer 文本节点
        let footerNode = document.createTextNode(params.footer)

        // 设置 footer 元素样式并将其添加到 footer 容器中
        footerElement.appendChild(footerNode)
        footerElement.setAttribute('style', params.footerStyle)
        footerContainer.appendChild(footerElement)
    }
    // 插入 footer 容器到打印元素的尾部
    printElement.insertBefore(footerContainer, printElement.childNodes.lastChild)
}

export function cleanUp(params) {
    // 如果存在用户反馈信息，请将其删除
    if (params.showModal) Modal.close()

    // 检查是否有完成加载 hook 函数
    if (params.onLoadingEnd) params.onLoadingEnd()

    // 如果预加载 PDF 文件，清除 blob url
    if (params.showModal || params.onLoadingStart) window.URL.revokeObjectURL(params.printable)

    // 执行 onPrintDialogClose 回调函数
    let event = 'mouseover'

    if (Browser.isChrome() || Browser.isFirefox()) {
        // Ps.: Firefox 将需要额外的点击文档来触发 focus 事件。
        event = 'focus'
    }

    const handler = () => {
        // 确保事件只发生一次。
        window.removeEventListener(event, handler)

        params.onPrintDialogClose()

        // 将 iframe 元素从 DOM 中删除
        const iframe = document.getElementById(params.frameId)

        if (iframe) {
            if (params.frameRemoveDelay) {
                setTimeout(() => {
                    iframe.remove()
                },
                    params.frameRemoveDelay
                )
            } else {
                iframe.remove()
            }
        }
    }

    window.addEventListener(event, handler)
}

export function isRawHTML(raw) {
    const regexHtml = new RegExp('<([A-Za-z][A-Za-z0-9]*)\\b[^>]*>(.*?)</\\1>')
    return regexHtml.test(raw)
}
