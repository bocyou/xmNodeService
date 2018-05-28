// pages/me/me.js
const util = require('../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        user_info: "",
        week_txt: ' 本周已花费',
        user_area: {"bj": "北京", "nj": "南京", "sh": "上海"},
        bill_money: 0,
        bill_ary: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var self = this;



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
        var self = this;
        util.checkPermission(function (userInfo) {

             self.getUserInfo();
            util.request({
                url: util.api + '/me/get_user_not_pay', param: '', complete: function (res) {
                    //获取当前用户账单
                    var data = res.data;
                    if (data.code == 200 && JSON.stringify(data.result) != '{}') {
                        console.log(data.result);
                        var result_data=data.result;
                        var sun_money = 0;
                        result_data.dinner.forEach(function (item, idx) {
                            sun_money += parseFloat(item.spread_money);
                        });
                        result_data.lucky.forEach(function (item, idx) {
                            sun_money += parseFloat(item.money);
                        });
                        result_data.shop_money.forEach(function(item,idx){
                            sun_money+=parseFloat(item.money);
                        })
                        self.setData({
                            bill_money: sun_money
                        });
                    } else {
                        wx.showToast({
                            title: '获取数据失败',
                            icon: 'none',
                            duration: 2000
                        })
                    }
                }
            });
            self.getBill();

        });

    },
    getUserInfo:function(){
        var self=this;
        util.request({
            url: util.api + '/api/get_current_user', param: '', complete: function (res) {
                //获取当前用户信息
                var data = res.data;
                if (data.code == 200 && JSON.stringify(data.result) != '{}') {
                    self.setData({
                        user_info: data.result
                    });
                } else {
                    wx.showToast({
                        title: '获取数据失败',
                        icon: 'none',
                        duration: 2000
                    })
                }
            }
        });
    },

    getBill: function () {
        var self = this;

        util.request({
            url: util.api + '/me/get_user_bill', param: '', complete: function (res) {
                //获取当前用户账单信息
                var data = res.data;
                if (data.code == 200) {
                    if (data.result.length > 0) {
                        self.setData({
                            bill_ary: data.result.map(function (item, idx) {
                                item.create_time = new Date(item.create_time).Format('MM月dd日');
                                return item
                            })
                        })
                    } else {
                        self.setData({
                            bill_ary: []
                        })
                    }
                } else {
                    wx.showToast({
                        title: '获取数据失败',
                        icon: 'none',
                        duration: 2000
                    })
                }
            }
        });
    },
    payMoney: function (e) {
        var self = this;
        var bill_id = e.currentTarget.dataset.billid;
        console.log(bill_id);
        wx.showModal({
            title: '',
            content: '确定已付款给王老师了？',
            success: function (res) {
                if (res.confirm) {
                    util.request({
                        url: util.api + '/me/user_pay_bill', param: {bill_id: bill_id}, complete: function (res) {
                            //获取当前用户账单信息
                            var data = res.data;
                            if (data.code == 200) {
                                wx.showToast({
                                    title: '确认成功',
                                    icon: 'none',
                                    duration: 2000
                                })
                                self.getBill();

                            } else {
                                wx.showToast({
                                    title: '确认失败',
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

    },
    refreshFace:function(){
        var self=this;
        wx.showModal({
            title: '',
            content: '确定刷新您的头像吗？',
            success: function (res) {
                if (res.confirm) {
                    wx.getUserInfo({
                        success: function(res) {
                            var userInfo = res.userInfo;

                            var avatarUrl = userInfo.avatarUrl;
                            console.log(avatarUrl);
                            util.request({
                                url: util.api + '/me/refresh_user_face', param: {user_img: avatarUrl}, complete: function (res) {
                                    //获取当前用户账单信息
                                    var data = res.data;
                                    if (data.code == 200) {
                                        self.getUserInfo();

                                    } else {
                                        wx.showToast({
                                            title:'更新失败',
                                            icon:'none',
                                            duration:'2000'
                                        });
                                    }
                                }
                            });
                        },
                        fail:function(res){
                            wx.showToast({
                                title: '获取头像信息失败',
                                icon: 'none',
                                duration: 2000
                            })
                        }
                    })
                } else if (res.cancel) {
                }
            }
        })

     /*   util.request({
            url: util.api + '/me/user_pay_bill', param: {bill_id: bill_id}, complete: function (res) {
                //获取当前用户账单信息
                var data = res.data;
                if (data.code == 200) {
                    wx.showToast({
                        title: '确认成功',
                        icon: 'none',
                        duration: 2000
                    })
                    self.getBill();

                } else {
                    wx.showToast({
                        title: '确认失败',
                        icon: 'none',
                        duration: 2000
                    })
                }
            }
        });*/
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

    }
})