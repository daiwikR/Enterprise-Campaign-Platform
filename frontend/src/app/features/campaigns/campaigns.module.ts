import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { CampaignListComponent } from './campaign-list/campaign-list.component';
import { CampaignFormComponent } from './campaign-form/campaign-form.component';

const routes: Routes = [
  {
    path: '',
    component: CampaignListComponent
  },
  {
    path: 'new',
    component: CampaignFormComponent
  },
  {
    path: ':id/edit',
    component: CampaignFormComponent
  }
];

@NgModule({
  declarations: [
    CampaignListComponent,
    CampaignFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class CampaignsModule {}
