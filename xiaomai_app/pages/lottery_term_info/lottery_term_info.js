// pages/lottery_term_info/lottery_term_info.js
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        issue: 0,
        user_bet:[],
        last_lucky_users:[],
        lucky_num:'',
        money:''

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({
            issue: options.issue
        })
        this.getTermInfo();
        this.getCurrentBet();
        this.getLuckyUsers();
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
    getTermInfo:function(){
        let self=this;
        util.request({
            url: util.api + '/lottery/get_custom_bet_issue', param: {issue:self.data.issue}, complete: function (res) {
                let data = res.data;

                if (data.code == 200) {
                    self.setData({
                        lucky_num:data.result.lucky_num,
                        money:data.result.current_poor+data.result.begin_poor
                    })
                } else {
                }

            }
        });
    },
    getCurrentBet: function () {
        let self = this;
        util.request({
            url: util.api + '/lottery/get_user_bet', param: {issue: self.data.issue}, complete: function (res) {
                let data = res.data;
                if (data.code == 200) {
                    self.setData({
                        user_bet: data.result
                    });
                } else {
                }
            }
        });

    },
    getLuckyUsers:function(){
        let self=this;

        util.request({
            url: util.api + '/lottery/get_lucky_users', param: {issue:(self.data.issue)}, complete: function (res) {
                let data = res.data;
                if (data.code == 200) {
                    self.setData({
                        last_lucky_users:data.result
                    });
                } else {
                }
            }
        });
    }
})