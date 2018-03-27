import { Component, OnInit } from '@angular/core';
import {Http, Jsonp} from "@angular/http";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
   user_info={
     user_img:'',
     user_name:''
   };
  constructor(private http:Http, private jsonp:Jsonp) { }

  ngOnInit() {
    this.http.post("/api/get_current_userinfo", "")
      .map(response => response.json()).subscribe(
      data => {
        if(data.code==200&&JSON.stringify(data.result)!='{}'){
          console.log(data);
          this.user_info=data.result;
          console.log(this.user_info);
        }
        else if(data.code==502){

          //window.location.href='/login';
        }else{
          alert('获取当前用户信息失败');
        }


      }
    )
  }
  signOut(){
    this.http.post("angular/login/user_sign_out", "")
      .map(response => response.json()).subscribe(
      data => {
        if(data.code==200&&JSON.stringify(data.result)!='{}'){
          console.log(data);

        }
        else if(data.code==502){

          //window.location.href='/login';
        }else{
          alert('退出失败');
        }


      }
    )
  }

}
