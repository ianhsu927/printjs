import { capitalizePrint, addHeader, addFooter } from './functions'
import Print from './print'

export default {
  print: (params, printFrame) => {
    // 验证数据
    if (typeof params.printable !== 'object') {
      throw new Error('Invalid javascript data object (JSON).')
    }

    // 验证 repeatTableHeader 参数
    if (typeof params.repeatTableHeader !== 'boolean') {
      throw new Error('Invalid value for repeatTableHeader attribute (JSON).')
    }

    // 验证 properties
    if (!params.properties || !Array.isArray(params.properties)) {
      throw new Error('Invalid properties array for your JSON data.')
    }

    // 格式化属性对象以保持 JSON api 与旧版本兼容
    params.properties = params.properties.map(property => {
      return {
        field: typeof property === 'object' ? property.field : property,
        displayName: typeof property === 'object' ? property.displayName : property,
        columnSize: typeof property === 'object' && property.columnSize ? property.columnSize + ';' : 100 / params.properties.length + '%;'
      }
    })

    // 创建打印元素容器
    params.printableElement = document.createElement('div')

    // 检查是否正在添加打印头
    if (params.header) {
      addHeader(params.printableElement, params)
    }

    // 构建 printable html 数据
    params.printableElement.innerHTML += jsonToHTML(params)

    // 检查是否正在添加打印尾部
    if (params.footer) {
      addFooter(params.printableElement, params)
    }

    // 打印 JSON 数据
    Print.send(params, printFrame)
  }
}

function jsonToHTML(params) {
  // 获得行和列数据
  const data = params.printable
  const properties = params.properties

  // 创建 html table
  let htmlData = '<table style="border-collapse: collapse; width: 100%;">'

  // 检查是否应该重复 header
  if (params.repeatTableHeader) {
    htmlData += '<thead>'
  }

  // 添加表头行
  htmlData += '<tr>'

  // 添加表头列
  for (let a = 0; a < properties.length; a++) {
    htmlData += '<th style="width:' + properties[a].columnSize + ';' + params.gridHeaderStyle + '">' + capitalizePrint(properties[a].displayName) + '</th>'
  }

  // 添加表头行的结束标签
  htmlData += '</tr>'

  // 如果表头标记为重复，则添加关闭标记
  if (params.repeatTableHeader) {
    htmlData += '</thead>'
  }

  // 创建表格 body
  htmlData += '<tbody>'

  // 添加表格数据行
  for (let i = 0; i < data.length; i++) {
    // 添加行开始标签
    htmlData += '<tr>'

    // 仅打印选定的属性
    for (let n = 0; n < properties.length; n++) {
      let stringData = data[i]

      // 支持嵌套对象
      const property = properties[n].field.split('.')
      if (property.length > 1) {
        for (let p = 0; p < property.length; p++) {
          stringData = stringData[property[p]]
        }
      } else {
        stringData = stringData[properties[n].field]
      }

      // 添加行内容和样式
      htmlData += '<td style="width:' + properties[n].columnSize + params.gridStyle + '">' + stringData + '</td>'
    }

    // 添加行结束标签
    htmlData += '</tr>'
  }

  // 添加表格和 body 结束标签
  htmlData += '</tbody></table>'

  return htmlData
}
