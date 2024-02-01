import { collectStyles, addHeader, addFooter } from './functions'
import Print from './print'

export default {
  print: (params, printFrame) => {
    // Get the DOM printable element
    // 获得 DOM printable 元素
    const printElement = isHtmlElement(params.printable) ? params.printable : document.getElementById(params.printable)

    // 检查元素是否存在
    if (!printElement) {
      window.console.error('Invalid HTML element id: ' + params.printable)
      return
    }

    // 复制目标元素及其子元素（如果有）
    params.printableElement = cloneElement(printElement, params)

    // 添加 header
    if (params.header) {
      addHeader(params.printableElement, params)
    }

    // 添加 footer
    if (params.footer) {
      addFooter(params.printableElement, params)
    }

    // 打印 HTML 元素内容
    Print.send(params, printFrame)
  }
}

function cloneElement(element, params) {
  // 复制主节点（如果不在递归过程中）
  const clone = element.cloneNode()

  // 循环处理子元素/节点（包括文本节点）
  const childNodesArray = Array.prototype.slice.call(element.childNodes)
  for (let i = 0; i < childNodesArray.length; i++) {
    // 检查是否跳过当前元素
    if (params.ignoreElements.indexOf(childNodesArray[i].id) !== -1) {
      continue
    }

    // 复制子元素
    const clonedChild = cloneElement(childNodesArray[i], params)

    // 将复制的子元素添加到复制的父节点中
    clone.appendChild(clonedChild)
  }

  // 获得打印元素的所有样式（仅适用于元素类型的节点）
  if (params.scanStyles && element.nodeType === 1) {
    clone.setAttribute('style', collectStyles(element, params))
  }

  // 检查元素是否需要状态处理（复制用户输入数据）
  switch (element.tagName) {
    case 'SELECT':
      // 复制当前选择值到其(克隆?)
      clone.value = element.value
      break
    case 'CANVAS':
      // 将 canvas 内容复制到其(克隆?)
      clone.getContext('2d').drawImage(element, 0, 0)
      break
  }

  return clone
}

function isHtmlElement(printable) {
  // 检查元素是否是 HTMLElement 的实例或者 nodeType === 1 (用于 iframe 中的元素)
  return typeof printable === 'object' && printable && (printable instanceof HTMLElement || printable.nodeType === 1)
}
