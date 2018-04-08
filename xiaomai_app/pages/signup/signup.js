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
      { name: 'nj', value: '南京' },
    ],
    select_area: 'bj',//默认为北京
    user_name: null,
    invite: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //统计数组中重复项及个数
    var ary = [1, 2, 2, 11, 1];
    var res = [];
    ary.sort();
    for (var i = 0; i < ary.length;) {
      var count = 0;
      for (var j = i; j < ary.length; j++) {
        if (ary[i] == ary[j]) {
          count++;
        }
      }
      res.push({ name: ary[i], num: count });
      i += count;
    }
    //[{"name":1,"num":2},{"name":11,"num":1},{"name":2,"num":2}]
    console.log(JSON.stringify(res));
    //按首字母排序
    var arr = [{ name: "zlw", age: 24 }, { name: "wlz", age: 25 }, { name: "alz", age: 25 }, { name: "blz", age: 25 }];
    var compare = function (obj1, obj2) {
      var val1 = obj1.name;
      var val2 = obj2.name;
      if (val1 < val2) {
        return -1;
      } else if (val1 > val2) {
        return 1;
      } else {
        return 0;
      }
    }
    //[{"name":"alz","age":25},{"name":"blz","age":25},{"name":"wlz","age":25},{"name":"zlw","age":24}]
    console.log(JSON.stringify(arr.sort(compare)));
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
                  console.log(data);
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
                    wx.showToast({
                      title: '您输入的邀请码无效，请更换后再次注册',
                      icon: 'loading',
                      duration: 1000
                    });
                  } else if (data.code == 200 && data.result == 2) {
                    //返回登录页面
                    wx.showToast({
                      title: '该用户已存在,请授权登录',
                      icon: 'none',
                      duration: 1000
                    });
                  } else {
                    wx.showToast({
                      title: '创建失败',
                      icon: 'none',
                      duration: 1000
                    });
                  }

                }
              });
            }

            param.userInfo = app.globalData.userInfo;
            console.log(param.userInfo);
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