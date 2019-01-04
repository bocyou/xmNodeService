'use strict';
const config = require('config');
class Request {
    constructor() {
    }
    static post(custom) {
        const self = this;
        const def = {
            domain: 'https://xiaomai.towords.com/xm',
            url: '',
            tip: '获取数据失败',
            success: null,
            complete: null,
            version: config.v,
            session: '',
            params: {}
        };
        const opt = Object.assign(def, custom);
        wx.request({
            url: opt.domain + opt.url + '?v=' + opt.version,
            method: 'POST',
            data: opt.params,
            header: {
                'content-type': 'application/x-www-form-urlencoded', // 默认值
                'sessionkey': opt.session
            },
            complete: function (res) {
                const data = res.data;
                self.checkFunction(opt.complete, data);
                self.checkFunction(opt.success, data);
            }
        })
    }
    static get() { }
    static checkFunction(callback, data) {
        if (callback && typeof callback === 'function') {
            callback(data);
        }
    }

}

export default Request
