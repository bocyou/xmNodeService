import { Component, OnInit } from '@angular/core';
import {Http, Jsonp} from "@angular/http";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  user_name:String;
  password:String;
  constructor(private http:Http, private jsonp:Jsonp) { }

  ngOnInit() {
  }
  InputUserName(event:any){
     this.user_name=event.target.value
  }
  InputPassword(event:any){
    this.password=event.target.value
  }
  siginIn(){
    var self=this;
    console.log(self.user_name);
    console.log(self.password);
    if(self.user_name==''||self.password==''){
      alert('请输入完整');
    }else{
      this.http.post("/angular/login/user_login", {user_name:self.user_name,password:self.password})
        .map(response => response.json()).subscribe(
        data => {
          if(data.code==200){
            window.location.href='/'
          }
          else if(data.code==502){

            window.location.href='/login';
          }else{
            alert('用户名或密码错误');
          }


        }
      )
    }
  }
}
