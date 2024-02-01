import Browser from './browser'
import { cleanUp } from './functions'

const Print = {
  send: (params, printFrame) => {
    // 添加 iframe 元素到 body 中
    document.getElementsByTagName('body')[0].appendChild(printFrame)

    // 找到 iframe 元素
    const iframeElement = document.getElementById(params.frameId)

    // 等待 iframe 元素加载完成
    iframeElement.onload = () => {
      if (params.type === 'pdf') {
        // Add a delay for Firefox. In my tests, 1000ms was sufficient but 100ms was not
        if (Browser.isFirefox() && Browser.getFirefoxMajorVersion() < 110) {
          setTimeout(() => performPrint(iframeElement, params), 1000)
        } else {
          performPrint(iframeElement, params)
        }
        return
      }

      // 获取 iframe 元素的 document
      let printDocument = (iframeElement.contentWindow || iframeElement.contentDocument)
      if (printDocument.document) printDocument = printDocument.document

      // 添加 printable 元素到 iframe 的 body 中
      printDocument.body.appendChild(params.printableElement)

      // 添加自定义 CSS
      if (params.type !== 'pdf' && params.style) {
        // 创建 style 元素
        const style = document.createElement('style')
        style.innerHTML = params.style

        // 添加 style 元素到 iframe 的 head 中
        printDocument.head.appendChild(style)
      }

      // 如果 iframe 中有图片，等待图片加载完成
      const images = printDocument.getElementsByTagName('img')

      if (images.length > 0) {
        loadIframeImages(Array.from(images)).then(() => performPrint(iframeElement, params))
      } else {
        performPrint(iframeElement, params)
      }
    }
  }
}

function performPrint(iframeElement, params) {
  try {
    iframeElement.focus()

    // 如果是 Edge 或者 IE, 使用 execCommand 进行 try-catch
    if (Browser.isEdge() || Browser.isIE()) {
      try {
        iframeElement.contentWindow.document.execCommand('print', false, null)
      } catch (e) {
        setTimeout(function () {
          iframeElement.contentWindow.print()
        }, 1000)
      }
    } else {
      // 其他浏览器
      setTimeout(function () {
        iframeElement.contentWindow.print()
      }, 1000)
    }
  } catch (error) {
    params.onError(error)
  } finally {
    if (Browser.isFirefox() && Browser.getFirefoxMajorVersion() < 110) {
      // 移动 iframe 元素到屏幕外并且隐藏
      iframeElement.style.visibility = 'hidden'
      iframeElement.style.left = '-1px'
    }

    cleanUp(params)
  }
}

function loadIframeImages(images) {
  const promises = images.map(image => {
    if (image.src && image.src !== window.location.href) {
      return loadIframeImage(image)
    }
  })

  return Promise.all(promises)
}

function loadIframeImage(image) {
  return new Promise(resolve => {
    const pollImage = () => {
      !image || typeof image.naturalWidth === 'undefined' || image.naturalWidth === 0 || !image.complete
        ? setTimeout(pollImage, 500)
        : resolve()
    }
    pollImage()
  })
}

export default Print
