'use strict';
const {version,domain} = require('config');
class Request {
    constructor() {
    }
    static post(custom) {
        const self = this;
        const def = {
            domain: domain,
            url: '',
            tip: '获取数据失败',
            success: null,
            complete: null,
            version: version,
            session: '',
            params: {}
        };
        const opt = Object.assign(def, custom);
        wx.request({
            url: opt.domain + opt.url,
            method: 'POST',
            data: opt.params,
            header: {
                'content-type': 'application/x-www-form-urlencoded', // 默认值
                'sessionkey': opt.session,
                'version':opt.version
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
