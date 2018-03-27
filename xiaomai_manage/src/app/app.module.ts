import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpModule,JsonpModule } from '@angular/http';//数据请求模块
import { FormsModule , ReactiveFormsModule} from '@angular/forms';//表单模块

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { FooterComponent } from './footer/footer.component';
import { ContentComponent } from './content/content.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DinnerComponent } from './dinner/dinner.component';
import { DinnerManageComponent } from './order-dinner/dinner-manage/dinner-manage.component';
import { DinnerFilterPipe } from './order-dinner/dinner-filter.pipe';
import { Page404Component } from './page404/page404.component';
import { DinnerStatisticsComponent } from './order-dinner/dinner-statistics/dinner-statistics.component';
import { UserDinnerListPipe } from './pipe/user-dinner-list.pipe';
import { InviteCodeComponent } from './manage/invite-code/invite-code.component';
import { LoginComponent } from './login/login.component';
import { ManageComponent } from './manage/manage.component';
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MenuComponent,
    FooterComponent,
    ContentComponent,
    SidebarComponent,
    DinnerComponent,
    DinnerManageComponent,
    Page404Component ,
    DinnerStatisticsComponent ,
    UserDinnerListPipe ,
    InviteCodeComponent ,
    LoginComponent,
    ManageComponent,
    DinnerFilterPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpModule,
    JsonpModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
