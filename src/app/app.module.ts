import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { AuctionsOverviewComponent } from './auctions-overview/auctions-overview.component';
import { MessageComponent } from './message/message.component';
import { SteemConnect2Component } from './steem-connect2/steem-connect2.component';
import { AuctionDetailComponent } from './auction-detail/auction-detail.component';
import { SellComponent } from './sell/sell.component';
import { AboutComponent } from './about/about.component';
import { LegalComponent } from './legal/legal.component';
import { BusyIndicatorComponent } from './busy-indicator/busy-indicator.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        AppRoutingModule,
        HttpClientModule
    ],
    declarations: [
        AppComponent,
        AuctionsOverviewComponent,
        MessageComponent,
        SteemConnect2Component,
        AuctionDetailComponent,
        SellComponent,
        AboutComponent,
        BusyIndicatorComponent,
        LegalComponent
    ],
    providers: [
        { provide: 'LOCALSTORAGE', useFactory: getLocalStorage }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

export function getLocalStorage() {
    return (typeof window !== "undefined") ? window.localStorage : null;
}
