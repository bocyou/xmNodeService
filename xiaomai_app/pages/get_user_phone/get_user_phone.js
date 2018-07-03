// pages/get_user_phone/get_user_phone.js
const app = getApp();
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        towords_phone: '',
        disabled:false
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

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },
    towordsPhone: function (e) {
        this.setData({
            towords_phone: e.detail.value
        })
    },
    bindPhone:function(){
        let self=this;
        if(self.data.towords_phone==null||self.data.towords_phone==''){
            wx.showToast({
                title: '请输入手机号',
                icon: 'none',
                duration: 2000
            })
        }else{
            let reg_phone = /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;
            if(reg_phone.test(self.data.towords_phone)){
                self.setData({disabled:true});
                util.request({
                    url: util.api+'/me/bind_towords_phone',param:{phone:self.data.towords_phone}, complete: function (res) {
                        let data = res.data;
                        if(data.code==200){
                            wx.showToast({
                                title: '绑定成功！',
                                icon: 'none',
                                duration: 2000
                            })
                            let userInfo = wx.getStorageSync('userInfo');
                            userInfo.towords_phone=self.data.towords_phone;
                            wx.setStorageSync('userInfo', userInfo);
                            setTimeout(function(){
                                wx.redirectTo({
                                    url: '../lottery/lottery'
                                })
                            },2000)
                        }else{
                            wx.showToast({
                                title: '绑定失败！请退出重试',
                                icon: 'none',
                                duration: 2000
                            })
                        }

                    }
                });
            }else{
                wx.showToast({
                    title: '请输入正确的手机号',
                    icon: 'none',
                    duration: 2000
                })
            }
        }

    }
})