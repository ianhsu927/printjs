'use strict'

import Browser from './browser'
import Modal from './modal'
import Pdf from './pdf'
import Html from './html'
import RawHtml from './raw-html'
import Image from './image'
import Json from './json'

const printTypes = ['pdf', 'html', 'image', 'json', 'raw-html']

export default {
  init() {
    const params = {
      printable: null,
      fallbackPrintable: null,
      type: 'pdf',
      header: null,
      headerStyle: 'font-weight: 300;',
      footer: null,
      footerStyle: 'font-weight: 300;',
      maxWidth: 800,
      properties: null,
      gridHeaderStyle: 'font-weight: bold; padding: 5px; border: 1px solid #dddddd;',
      gridStyle: 'border: 1px solid lightgray; margin-bottom: -1px;',
      showModal: false,
      onError: (error) => { throw error },
      onLoadingStart: null,
      onLoadingEnd: null,
      onPrintDialogClose: () => { },
      onIncompatibleBrowser: () => { },
      modalMessage: 'Retrieving Document...',
      frameId: 'printJS',
      frameRemoveDelay: null,
      printableElement: null,
      documentTitle: 'Document',
      targetStyle: ['clear', 'display', 'width', 'min-width', 'height', 'min-height', 'max-height'],
      targetStyles: ['border', 'box', 'break', 'text-decoration'],
      ignoreElements: [],
      repeatTableHeader: true,  // 用于 JSON 和打印
      css: null,
      style: null,
      scanStyles: true,
      base64: false,

      // 弃用
      onPdfOpen: null,
      font: 'TimesNewRoman',
      font_size: '12pt',
      honorMarginPadding: true,
      honorColor: false,
      imageStyle: 'max-width: 100%;'
    }

    // 检查是否提供了可打印的文档或对象
    const args = arguments[0]
    if (args === undefined) {
      throw new Error('printJS expects at least 1 attribute.')
    }

    // 处理参数
    switch (typeof args) {
      case 'string':
        params.printable = encodeURI(args)
        params.fallbackPrintable = params.printable
        params.type = arguments[1] || params.type
        break
      case 'object':
        params.printable = args.printable
        params.fallbackPrintable = typeof args.fallbackPrintable !== 'undefined' ? args.fallbackPrintable : params.printable
        params.fallbackPrintable = params.base64 ? `data:application/pdf;base64,${params.fallbackPrintable}` : params.fallbackPrintable
        for (var k in params) {
          if (k === 'printable' || k === 'fallbackPrintable') continue

          params[k] = typeof args[k] !== 'undefined' ? args[k] : params[k]
        }
        break
      default:
        throw new Error('Unexpected argument type! Expected "string" or "object", got ' + typeof args)
    }

    // 验证 printable
    if (!params.printable) throw new Error('Missing printable information.')

    // 验证类型
    if (!params.type || typeof params.type !== 'string' || printTypes.indexOf(params.type.toLowerCase()) === -1) {
      throw new Error('Invalid print type. Available types are: pdf, html, image and json.')
    }

    // Check if we are showing a feedback message to the user (useful for large files)
    // 检查是否正在展示一个用户反馈信息(对于大型文件有用)
    if (params.showModal) Modal.show(params)

    // 检查是否有打印开始 hook 函数
    if (params.onLoadingStart) params.onLoadingStart()

    // 防止重复(duplication)和问题，从 DOM 中删除任何已使用的 printFrame
    const usedFrame = document.getElementById(params.frameId)

    if (usedFrame) usedFrame.parentNode.removeChild(usedFrame)

    // 为打印任务创建一个新的 iframe
    const printFrame = document.createElement('iframe')

    if (Browser.isFirefox()) {
      // 设置 iframe 页面可见(guaranteed by fixed position)但是使用 opacity 0 隐藏，因为这在 Firefox 中有效。
      // 高度需要足够的空间来显示文档中的某些部分，而不是 PDF 查看器的工具栏。
      printFrame.setAttribute('style', 'width: 1px; height: 100px; position: fixed; left: 0; top: 0; opacity: 0; border-width: 0; margin: 0; padding: 0')
    } else {
      // 在其他浏览器中隐藏 iframe
      printFrame.setAttribute('style', 'visibility: hidden; height: 0; width: 0; position: absolute; border: 0')
    }

    // 设置 iframe 元素 id
    printFrame.setAttribute('id', params.frameId)

    // 对于非 PDF 打印, 传递一个 html 文档字符串到 srcdoc (强制 onload 回调)
    if (params.type !== 'pdf') {
      printFrame.srcdoc = '<html><head><title>' + params.documentTitle + '</title>'

      // 添加 css 文件
      if (params.css) {
        // 添加对单个文件的支持
        if (!Array.isArray(params.css)) params.css = [params.css]

        // 为每个 css 文件创建 link 标签
        params.css.forEach(file => {
          printFrame.srcdoc += '<link rel="stylesheet" href="' + file + '">'
        })
      }

      printFrame.srcdoc += '</head><body></body></html>'
    }

    // 检查 printable 类型
    switch (params.type) {
      case 'pdf':
        // 检查浏览器是否支持 pdf，如果不支持，我们将打开 pdf 文件
        if (Browser.isIE()) {
          try {
            console.info('Print.js doesn\'t support PDF printing in Internet Explorer.')
            const win = window.open(params.fallbackPrintable, '_blank')
            win.focus()
            params.onIncompatibleBrowser()
          } catch (error) {
            params.onError(error)
          } finally {
            // 确保没有打开的加载模态框
            if (params.showModal) Modal.close()
            if (params.onLoadingEnd) params.onLoadingEnd()
          }
        } else {
          Pdf.print(params, printFrame)
        }
        break
      case 'image':
        Image.print(params, printFrame)
        break
      case 'html':
        Html.print(params, printFrame)
        break
      case 'raw-html':
        RawHtml.print(params, printFrame)
        break
      case 'json':
        Json.print(params, printFrame)
        break
    }
  }
}
