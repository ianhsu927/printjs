import Print from './print'
import { cleanUp } from './functions'

export default {
    print: (params, printFrame) => {
        // 检查是否有 base64 数据
        if (params.base64) {
            if (params.printable.indexOf(',') !== -1) {
                /*
                    如果 pdf base64 开头是 `data:application/pdf;base64,`
                    执行 atob 函数会抛出错误。所以我们获取 `,` 后面的内容
                */
                params.printable = params.printable.split(',')[1];
            }
            const bytesArray = Uint8Array.from(atob(params.printable), c => c.charCodeAt(0))
            createBlobAndPrint(params, printFrame, bytesArray)
            return
        }

        // 格式化 pdf url
        params.printable = /^(blob|http|\/\/)/i.test(params.printable)
            ? params.printable
            : window.location.origin + (params.printable.charAt(0) !== '/' ? '/' + params.printable : params.printable)

        // 通过 http 获得文件(预加载)
        const req = new window.XMLHttpRequest() // XHR 请求
        req.responseType = 'arraybuffer'

        req.addEventListener('error', () => {
            cleanUp(params)
            params.onError(req.statusText, req)
            // 没有有效的 pdf 文档，停止打印
        })

        req.addEventListener('load', () => {
            // 检查错误
            if ([200, 201].indexOf(req.status) === -1) {
                cleanUp(params)
                params.onError(req.statusText, req)
                // 没有有效的 pdf 文档，停止打印
                return
            }

            // 打印请求的文档
            createBlobAndPrint(params, printFrame, req.response)
        })

        req.open('GET', params.printable, true)
        req.send()
    }
}

function createBlobAndPrint(params, printFrame, data) {
    // 通过响应获得 base64 数据到一个 blob 并创建一个本地对象 url
    // blob -->> binary large object
    let localPdf = new window.Blob([data], { type: 'application/pdf' })
    localPdf = window.URL.createObjectURL(localPdf)

    // 设置 iframe 的 src 属性为 PDF document url
    printFrame.setAttribute('src', localPdf)

    Print.send(params, printFrame)
}
