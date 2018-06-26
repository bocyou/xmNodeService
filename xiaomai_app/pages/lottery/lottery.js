// pages/lottery/lottery.js
const app = getApp();
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        screenInfo: {},
        word_list: []
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
        var self = this;
        util.getScreen(function (screenInfo) {
            self.setData({
                screenInfo: screenInfo
            })
        });


        util.checkPermission(function (userInfo) {
            //已登陆
            console.log(userInfo);
            self.getUserWord();

        });

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
    getUserWord: function () {
        var self = this;
        util.request({
            url: util.api + '/lottery/get_user_words', param: '', complete: function (res) {
                //获取所有用户的单词量
                var data = res.data;
                if (data.code == 200) {
                    console.log(data.result);
                    self.setData({word_list: data.result})
                } else {

                }

            }
        });
    }
})