// pages/lucky_draw/lucky_draw.js
const app = getApp();
const util = require('../../utils/util.js');
var is_draw=true;//默认可刮奖
Page({

  /**
   * 页面的初始数据
   */
  data: {
      img:['0.png','1.gif','2.gif','2.gif','2.gif','2.gif','6.gif','','8.gif'],
      show_draw_result:0,//显示刮奖结果页面0不显示，1显示
      hide_draw:0,//隐藏开奖区域，1隐藏
    is_loading:1,
     random_ary:[8,6,0,0,1,2],
     status:0,//0表示未刮奖，1表示已刮奖,2表示周末
     current_user_money:-1,//刮奖后的显示张泰-1表示尚未请求到后台-2表示失败，
     all_list:[],
     month_list:[],//本月前三
     special_list: [{ name: '', img: '8-1' }, { name: '', img: '6-1' }, { name: '', img: '0-1' }, { name: '', img: '0-1' }]//得奖用户
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self=this;

     var today=new Date().getDay();
     console.log(today);
     if(today==0||today==6){
         wx.showModal({
             title: '',
             content: '今天不用刮卡',
             success: function (res) {
                 if (res.confirm) {
                 } else if (res.cancel) {
                 }
             }
         })
     }else{
         util.checkPermission(function(userInfo){
             self.checkCurrentUserDraw();

         

         });
     }


    

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
    checkCurrentUserDraw:function(){
        var self=this;
        util.request({
            url: util.api+'/lucky_draw/check_current_user_draw', complete: function (res) {
                var data = res.data;

                if(data.code==200&&data.result){
                    //已经刮卡
                    self.getTopList();
                    self.getAllList();
                    self.setData({
                        status:1,
                        is_loading:0
                    });

                }else{
                    //没有刮卡
                    self.setData({
                        status: 0,
                        is_loading:0
                    });
                }


            }
        });
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
/*    util.request({
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

        }


      }
    });*/
  },
  getAllList:function(){
    var self=this;
    util.request({
      url: util.api+'/lucky_draw/get_user_draw_list', complete: function (res) {
        var data = res.data;
        if (data.code == 200 && data.result) {
            var resul_ary=self.data.special_list;
            var is_repeat_one=false;
            var special_ary = data.result.filter(function (item, idx) {
                return item.money == 0 || item.money == 8 || item.money == 6
            });
            special_ary=special_ary.forEach(function(item,idx){
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
            all_list:data.result,
              special_list:resul_ary
          });
        } else {
          self.setData({
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
    showList:function(e){
      var self=this;
        self.getAllList();
        self.getTopList();
        self.setData({
            status:1
        });
        util.request({
            url: util.api+'/api/save_user_fromid', param:{formid:e.detail.formId,type:0},complete: function (res) {
                var data = res.data;
                if (data.code == 200) {


                } else {

                }


            }
        })
    },
  startDraw:function(e){
    var self=this;
      self.setData({
          show_draw_result:1
      });



    if(is_draw){
        is_draw=false;
        util.request({
            url: util.api+'/lucky_draw/save_user_draw', complete: function (res) {
                var data = res.data;
                    is_draw=true;
                if(data.code==200){


                    self.setData({
                        is_loading:0,
                        current_user_money:data.result
                    });
                    setInterval(function(){
                        self.setData({
                            hide_draw:1
                        });
                    },1000)

                } else{
                  wx.showModal({
                      title: '',
                      content: data.message,
                      success: function (res) {
                          if (res.confirm) {
                          } else if (res.cancel) {
                          }
                      }
                  });

                }
            }
        });
    }
      util.request({
          url: util.api+'/api/save_user_fromid', param:{formid:e.detail.formId,type:0},complete: function (res) {
              var data = res.data;
              if (data.code == 200) {


              } else {

              }


          }
      })

  }
});