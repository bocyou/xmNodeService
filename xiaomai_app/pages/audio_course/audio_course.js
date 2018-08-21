// pages/audio_course/audio_course.js
const util = require('../../utils/util.js');
import Player from "../../utils/player";


let disc = null;

function secChange(s) {
    let t;
    if (s > -1) {
        var hour = Math.floor(s / 3600);
        var min = Math.floor(s / 60) % 60;
        var sec = s % 60;
        if (hour < 10 && hour > 0) {
            t = '0' + hour + ":";
        } else if (hour == 0) {
            t = '';
        } else {
            t = hour + ":";
        }

        if (min < 10) {
            t += "0";
        }
        t += min + ":";
        if (sec < 10) {
            t += "0";
        }
        t += sec.toFixed(0);
    }
    return t;
}

class Disc {
    constructor(opt) {

        let def = {
            r: 100,
            time: 10
        };
        this.timer = null;
        this.current_deg = 0;
        this.opt = Object.assign(def, opt);
        this.ctx = null;
        this.cover = null;
        this.init();
    }

    init() {
        const self = this;
        this.ctx = wx.createCanvasContext(this.opt.id);

        wx.getImageInfo({
            src: 'https://xiaomai.towords.com/img/disc.jpg',
            header: {
                'content-type': 'application/x-www-form-urlencoded', // 默认值
            },
            fail: function () {
                wx.showModal({
                    title: '',
                    content: '下载专辑封面失败，请删除小程序重试',
                    success: function (res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
            },
            success: function (res) {
                self.cover = res.path;
                self.draw();
            }
        })
    }

    draw() {
        const self = this;
        let ctx = this.ctx;
        let r = this.opt.r;
        let screen_w = this.opt.screen_w;
        ctx.setFillStyle('red');
        ctx.translate(screen_w / 2, r);
        ctx.rotate(this.current_deg * Math.PI / 180);
        /*  ctx.arc(0, 0, r, 0, 2 * Math.PI);
          ctx.fill();*/
        /*  ctx.arc(0, 0, r, 0, 2 * Math.PI);
          ctx.clip();*/
        ctx.drawImage(self.cover, -r, -r, 2 * r, 2 * r);

        ctx.draw();

    }

    start() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {

            if (this.current_deg >= 360) {
                this.current_deg = 0;
            } else {
                this.current_deg += 1;
            }
            this.draw();

        }, this.opt.time)
    }

    pause() {
        clearInterval(this.timer);
    }

}
let bg_player=null;

const bgPlayer={

    play(src){

        wx.playBackgroundAudio({
            dataUrl: src,
            title: '每日一课',
            coverImgUrl: 'https://xiaomai.towords.com/img/disc.jpg'
        });

    },
    pause(){
        wx.pauseBackgroundAudio()
    }
};


Page({

    /**
     * 页面的初始数据
     */
    data: {
        playing: 0,//播放中1，0表示未播放
        is_show_audio: 1,
        progress_time: '00:00',
        total_time: '00:00',
        duration:0,
        screen_info: {},
        progress_num: 0,
        today_time: util.customDate(new Date(), 'yyyy/MM/dd'),
        audio_src: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */

    onLoad: function (options) {
        const self = this;
        util.getScreen(function (screenInfo) {
            console.log(screenInfo);
            disc = new Disc({
                id: 'disc',
                screen_w: screenInfo.screenWidth
            });

            self.setData({
                screen_info: screenInfo
            })
        });
        let today = new Date().getDay();

        if (today == 0 || today == 6) {
            self.setData({is_show_audio: 0});
        } else {
            let audio_title = util.customDate(new Date(), 'yyyyMMdd');
            self.data.audio_src = 'https://topschool-xiaomai.oss-cn-beijing.aliyuncs.com/lesson/' + audio_title + '.mp3';
            const innerAudioContext = wx.createInnerAudioContext();
            innerAudioContext.autoplay = false;
            innerAudioContext.src = self.data.audio_src;
            setTimeout(function(){
                let duration=innerAudioContext.duration;
                console.log(duration);
          /*      if(parseInt(duration)>0){
                    self.setData({
                        duration:duration,
                        total_time:secChange(duration)
                    })
                }*/
            },1000)
      /*       let timer=setInterval(()=>{
                 let duration=innerAudioContext.duration;
                 console.log(duration);
                 if(parseInt(duration)>0){
                     clearInterval(timer);
                     self.setData({
                         duration:duration,
                         total_time:secChange(duration)
                     })
                 }
             },100);*/
            bg_player=wx.getBackgroundAudioManager();
            if(bg_player.title=='每日一课'){
                if(bg_player.paused==true){
                    self.audioStopStatus();
                }else{
                    //播放中
                    self.audioPlayStatus();
                }
                let currentTime=bg_player.currentTime,
                    duration=bg_player.duration;
                self.setData({
                    progress_time: secChange(currentTime),
                    progress_num:currentTime/duration*100,
                    total_time:secChange(duration)
                });
                self.watchPlay();
            }else{
                //表示没有播放当前音频
                self.audioStopStatus();
                wx.stopBackgroundAudio()
            }


            /*            bg_player = new BgPlayer({
                            title: '每日一课',
                            cover_img_url: 'https://xiaomai.towords.com/img/disc.jpg',
                            src: self.data.audio_src,

                            onPlay: (() => {
                                disc.start();
                                self.setData({
                                    playing: 1
                                })
                            }),
                            onPause: (() => {
                                self.audioStop();
                            }),
                            onStop: (() => {
                                self.audioStop();
                            }),
                            onEnded: (() => {
                                self.audioStop();
                            }),
                            onTimeUpdate: ((currentTime,duration) => {
                                console.log(currentTime);
                                self.setData({
                                    progress_time: secChange(currentTime),
                                    progress_num:currentTime/duration*100
                                });
                            })

                        })*/

        }


    },
    audioStopStatus: function () {
        const self = this;
        self.setData({
            playing: 0
        });
        disc.pause();
    },
    audioPlayStatus:function(){
        const self = this;
        self.setData({
            playing: 1
        });
        disc.start();
    },
    watchPlay:function(){
        const self=this;
            bg_player.onTimeUpdate(()=>{
                let currentTime=bg_player.currentTime,
                    duration=bg_player.duration;
                self.setData({
                    progress_time: secChange(currentTime),
                    progress_num:currentTime/duration*100,
                    total_time:secChange(duration)
                });
            })


    },
    progressChange: function (e) {
        const self = this;
        let ratio = e.detail.value / 100;
        console.log(Math.round(self.duration));
        wx.seekBackgroundAudio({
            position: Math.round(ratio*bgPlayer.total_time)
        })

    },
    stop_progress: function () {
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
        const self = this;
        //检测当前音频是否在播放
        /*      if (self.data.playing == 1) {
                //正在播放

              } else {

              }

              wx.playBackgroundAudio({
                  dataUrl: 'https://topschool-xiaomai.oss-cn-beijing.aliyuncs.com/lesson/20180820.mp3',
                  title: '每日一课',
                  coverImgUrl: 'https://xiaomai.towords.com/img/disc.jpg'
              })*/
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
    playBtn: function () {
        const self = this;
           if (self.data.playing == 1) {
               self.audioStopStatus();
               bgPlayer.pause();
           } else {
               self.audioPlayStatus();
               bgPlayer.play(self.data.audio_src);

               self.watchPlay();

           }
    }
})