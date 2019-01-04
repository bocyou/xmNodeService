// pages/year/year.js
const app = getApp();
const {requestAuth} = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  this.getDinner();
  this.getDraw();
  this.getUserBet();
  this.getUserWinMoney();
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
  getDinner(){
    requestAuth({
      url: '/year/get_year_dinner',
      tip:'获取订餐数据失败',
      success: (res) => {
     
      
      }
  });
  },
  getDraw(){
    requestAuth({
      url: '/year/get_year_draw',
      tip:'获取刮卡数据失败',
      success: (res) => {
     
      
      }
  });
  },
  getUserBet(){
    requestAuth({
      url: '/year/get_year_user_bet',
      tip:'获取押注数据失败',
      success: (res) => {
      
      }
  });
  },
  getUserWinMoney(){
    requestAuth({
      url: '/year/get_year_user_win_money',
      tip:'获取押注数据失败',
      success: (res) => {
      
      }
  });
  }
})