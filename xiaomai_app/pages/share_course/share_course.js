// pages/share_course/share_course.js
const util = require('../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        course_list:[]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
       this.getCourse();
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
    getCourse: function () {
        const self=this;
        util.request({
            url: util.api+'/share_course/get_share_course',param:{} ,complete: function (res) {
                let data = res.data;
                if(data.code==200){
                     self.setData({
                         course_list:data.result.sort((a,b)=>{
                             return new Date(a.start_time).getTime()-new Date(b.start_time).getTime();
                         }).map((item,idx)=>{
                              item.start_time=util.customDate(new Date(item.start_time),'MM月dd日');
                              return item;
                         })
                     });
                }else{
                }
            }
        });
    }
})