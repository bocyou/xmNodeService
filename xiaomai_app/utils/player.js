//封装音频播放功能
'use strict';

class AudioPlayer {
    constructor(opt) {
        let def = {
            loop:false,
            volume:1,
            turn_on:true
        };
        this.opt = Object.assign(def, opt);
        this.init();
    }


    init() {
        this.audio_content = wx.createInnerAudioContext();
        const opt=this.opt;
        this.audio_content.loop=opt.loop;
        this.audio_content.volume=opt.volume;
        this.monitor();
    }
    changeSetting(opt){
        const self=this;
        self.opt=Object.assign(self.opt,opt)
    }
    play(src){
        const self=this;
        if(self.opt.turn_on){
            const player = self.audio_content;
            player.stop();
            if(src){
                self.opt.src=src;
            }
            player.src=self.opt.src;

            player.play();
        }

    }
    pause(){
        const player = this.audio_content;
        player.pause();
    }
    stop(){
        const player = this.audio_content;
        player.stop();
    }

    monitor() {
        const self=this;
        const player = this.audio_content;
        player.onPlay(function () {
          self.checkFunction(self.opt.play);
        });
        player.onPause(function () {

        });
        player.onStop(function () {

        });
        player.onEnded(function () {
            self.checkFunction(self.opt.end);
        });
        player.onTimeUpdate(function () {
        });
        player.onError(function () {
            self.checkFunction(self.opt.onerror);
        })
    }
    checkFunction(callback){
        const self=this;
        if(callback&&typeof callback==='function'){
            callback(self);
        }
    }
}

export default AudioPlayer;