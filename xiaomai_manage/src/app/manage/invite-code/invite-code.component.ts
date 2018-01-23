import {Component, OnInit} from '@angular/core';
import {Http, Jsonp, Headers} from "@angular/http";
//使用rxjs
import {Observable} from "rxjs";
import 'rxjs/Rx';
@Component({
  selector: 'app-invite-code',
  templateUrl: './invite-code.component.html',
  styleUrls: ['./invite-code.component.css']
})
export class InviteCodeComponent implements OnInit {

  all_list=[];
  constructor(private http:Http, private jsonp:Jsonp) {
    this.getAllList();
  }

  ngOnInit() {
  }
  getAllList(){

      this.http.post("/invite/get_invite_list", "")
        .map(response => response.json()).subscribe(
      data => {
        if(data.code==200){
          this.all_list = data.result;
        }
      else if(data.code==502){
          alert('session无效');
          window.location.href='/login';
        }


      }
    )
  }
  createInvite(){
    this.http.post("/invite/create_invite", {num:5})
      .map(response => response.json()).subscribe(
      data => {
        console.log(data);
        if(data.code==200&&data.result==1){
          this.getAllList();
          alert('生成成功');
        }else if(data.code==502){
          alert('session无效');
          window.location.href='/login';
        }else{
          alert('生成失败');
        }

      }
    )
  }

}
