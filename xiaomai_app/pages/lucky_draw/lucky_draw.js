// pages/lucky_draw/lucky_draw.js
const app = getApp();
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
     random_ary:[8,6,0,0,1,2],
     status:0,//0表示未刮奖，1表示已刮奖
     current_user_money:0,
     all_list:[],
     month_list:[],//本月前三
     special_list: [{ name: '', img: '8-1' }, { name: '', img: '6-1' }, { name: '', img: '0-1' }, { name: '', img: '0-1' }]//得奖用户
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self=this;
    wx.showLoading();
    self.getAllList();
    self.getSpecialList();
    self.getTopList();
    self.checkCurrentUserDraw();
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
  getTopList:function(){
    var self = this;
    util.request({
      url: util.api+'/lucky_draw/month_top_list', complete: function (res) {
        var data = res.data;
        if (data.code == 200 && data.result) {
          self.setData({
            month_list:data.result
          })
         
        } else {
         
        }


      }
    });
  },
  getSpecialList:function(){
    var self=this;
    util.request({
      url: util.api+'/lucky_draw/get_user_special_list', complete: function (res) {
        var data = res.data;
        if (data.code == 200 && data.result) {
          var ary=data.result;
          var resul_ary=self.data.special_list;
          var is_repeat_one=false;
          ary.forEach(function(item,idx){
            switch(item.money){
                case 8:
                resul_ary[0].name=item.user_name;
                resul_ary[0].img = '8-2';
                break;
                case 6:
                  resul_ary[1].name = item.user_name;
                  resul_ary[1].img = '6-2';
                  break;
                  case 0:
                if (is_repeat_one){
                  resul_ary[3].name = item.user_name;
                  resul_ary[3].img = '0-2';
                  }else{
                  resul_ary[2].name = item.user_name;
                  resul_ary[2].img = '0-2';
                  is_repeat_one=true;
                  }
                  break;
            }
          });
          self.setData({
            special_list:resul_ary
          });
        } else {
          self.setData({
          });
        }


      }
    });
  },
  getAllList:function(){
    var self=this;
    util.request({
      url: util.api+'/lucky_draw/get_user_draw_list', complete: function (res) {
        var data = res.data;
        if (data.code == 200 && data.result) {
          self.setData({
            all_list:data.result
          });
        } else {
          self.setData({
          });
        }


      }
    });
  },
  checkCurrentUserDraw:function(){
    var self=this;
    util.request({
      url: util.api+'/lucky_draw/check_current_user_draw', complete: function (res) {
        var data = res.data;
        console.log(data);
        wx.hideLoading();
        if(data.code==200&&data.result){
           //已经刮卡
            console.log('已刮卡');
           self.setData({
             status:1,
             current_user_money:data.result.money
           });
        }else{
          //没有刮卡
            console.log('未刮卡');
          self.setData({
            status: 0
          });
        }
        

      }
    });
  },
  getDrawList:function(){
    var self=this;
    util.request({
      url: util.api+'/lucky_draw/get_user_draw_list', complete: function (res) {
        var data = res.data;
        if (data.code == 200) {

          self.setData({
            all_list:data.result
          });
        } else {
          wx.showModal({
            title: '',
            content: '获取刮奖列表失败，请检查您的网络状态并退出重试',
            success: function (res) {
              if (res.confirm) {
              } else if (res.cancel) {
              }
            }
          })
        }


      }
    });
  },
  startDraw:function(){
    var self=this;
    console.log(1);
    util.request({
      url: util.api+'/lucky_draw/save_user_draw', complete: function (res) {
        var data = res.data;
        console.log(res);
        if(data.code==200){
          console.log('发送');
          self.getAllList();
          self.getTopList();
          self.getSpecialList();
          self.checkCurrentUserDraw();
        } else{
        }


      }
    });
  }
})