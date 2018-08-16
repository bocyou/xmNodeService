// pages/pay/pay.js
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        user_pay: 0,
        err_tip:''

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    getUserPay(e) {
        this.setData({
            user_pay: e.detail.value
        });
    },
    pay() {
        const self = this;
        if(self.data.user_pay==''||self.data.user_pay<=0){
            self.setData({err_tip:'请输入大于0的数字'});
        }else{
            if((/^[0-9]+([.]{1}[0-9]+){0,1}$/ig).test(self.data.user_pay)){
                let money=Number(self.data.user_pay).toFixed(1);
                self.setData({err_tip:''});
                wx.showModal({
                    title: '支付提示',
                    content: '您将支付'+money+'元',
                    success: function(res) {
                        if (res.confirm) {
                            util.request({
                                url: util.api+'/shop_money/save_shop_money',param:{money:money} ,complete: function (res) {
                                    let data = res.data;
                                    if(data.code==200){
                                        wx.showToast({
                                            title: '成功',
                                            icon: 'success',
                                            duration: 2000
                                        });
                                        setTimeout(()=>{
                                            wx.switchTab({
                                                url: '../me/me'
                                            })
                                        },1600)

                                    }else{
                                        wx.showToast({
                                            title: '支付失败',
                                            icon: 'none',
                                            duration: 2000
                                        })

                                    }


                                }
                            });
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
            }else{
                self.setData({err_tip:'只能输入数字'})
            }
        }



    }
})