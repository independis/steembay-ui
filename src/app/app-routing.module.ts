import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
 
import { AuctionsOverviewComponent }   from './auctions-overview/auctions-overview.component';
import { AuctionDetailComponent }  from './auction-detail/auction-detail.component';
import { SellComponent }      from './sell/sell.component';
import { AboutComponent }      from './about/about.component';
import { LegalComponent }      from './legal/legal.component';

const routes: Routes = [
  { path: '', redirectTo: '/auctions', pathMatch: 'full' },
  { path: 'auctions', component: AuctionsOverviewComponent,  },
  { path: 'auction/:id', component: AuctionDetailComponent },
  { path: 'sell', component: SellComponent },
  { path: 'about', component: AboutComponent },
  { path: 'legal', component: LegalComponent }
];
 
@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}