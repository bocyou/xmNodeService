// pages/signup/signup.js

const util = require('../../utils/util.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    area: [
      { name: 'bj', value: '北京', checked: 'true' },
      { name: 'sh', value: '上海' },
      { name: 'nj', value: '南京' }
    ],
    select_area: 'bj',//默认为北京
    user_name: null,
    invite: null
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
  areaChange: function (e) {
    var self = this;
    self.data.select_area = e.detail.value;
  },
  bindUserName: function (e) {
    var self = this;
    var value = e.detail.value;
    self.data.user_name = value;
  },
  bindInvite: function (e) {
    var self = this;
    var value = e.detail.value;
    self.data.invite = value;
  },
  sinup: function () {
    var self = this;
    var param = {};
    param.user_name = self.data.user_name;
    param.invite = self.data.invite;
    param.area = self.data.select_area;

    if (param.user_name != null && param.invite != null && param.area != null) {
      wx.login({
        success: function (res) {
          if (res.code) {
            console.log(res.code);
            param.wx_code = res.code;
            //调用注册接口
            //获取用户基本信息
            //先检查用户是否授权
            var postData = function (param) {
              util.request({
                url: util.api+'/api/user_sign_up', param: param, complete: function (res) {
                  var data = res.data;
                  if (data.code == 200 && data.result == true) {
                    //返回首页
                    //缓存后台传来的sessionKey
                    var userInfo = param.userInfo;
                    userInfo.session = res.data.session


                    wx.setStorageSync('userInfo', userInfo);
                    wx.switchTab({
                      url: '../index/index'
                    })
                  } else if (data.code == 200 && data.result == 3) {
                      wx.showModal({
                          title: '',
                          content: '您输入的邀请码无效，请更换后再次注册',
                          success: function(res) {
                              if (res.confirm) {
                              } else if (res.cancel) {
                              }
                          }
                      })
                  } else if (data.code == 200 && data.result == 2) {
                    //返回登录页面

                      wx.showModal({
                          title: '',
                          content: '该用户已存在,请授权登录',
                          success: function(res) {
                              if (res.confirm) {
                              } else if (res.cancel) {
                              }
                          }
                      })
                  } else {

                      wx.showModal({
                          title: '',
                          content: '创建失败，截图联系郭浩',
                          success: function(res) {
                              if (res.confirm) {
                              } else if (res.cancel) {
                              }
                          }
                      })
                  }

                }
              });
            }

            param.userInfo = app.globalData.userInfo;

            postData(param);

          } else {
            console.log('获取用户登录态失败！' + res.errMsg)
          }
        }
      });
      /* */
    } else {
      wx.showToast({
        title: '请填写完整',
        icon: 'none',
        duration: 1000
      });
    }
  }
})