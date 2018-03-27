import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ContentComponent} from "./content/content.component";
import {Page404Component} from "./page404/page404.component";
import {DinnerManageComponent} from "./order-dinner/dinner-manage/dinner-manage.component";
import {DinnerStatisticsComponent} from "./order-dinner/dinner-statistics/dinner-statistics.component";
import {InviteCodeComponent} from "./manage/invite-code/invite-code.component";
import {LoginComponent} from "./login/login.component";
import {ManageComponent} from "./manage/manage.component";
/*{path:'dinner',component:ContentComponent,
  children:[
  {path:'',component:DinnerManageComponent},
  {path:'statistics',component:DinnerStatisticsComponent}]
}*/
const routes: Routes = [
  {path:'',redirectTo:'/manage/dinner/menu',pathMatch:'full'},
  {path:'manage',component:ManageComponent,children:[
      {path:'dinner/menu',component:DinnerManageComponent},
      {path:'dinner/statistics',component:DinnerStatisticsComponent},
      {path:'invite',component:InviteCodeComponent},
      {path:'dinner/statistics',component:DinnerStatisticsComponent}
    ]},
  {path:'login',component:LoginComponent},

  {path:'**',component:Page404Component}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
