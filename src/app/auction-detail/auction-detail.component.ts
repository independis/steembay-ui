import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { AuctionViewModel } from '../viewmodel/auction-viewmodel';
import { AuctionsService } from '../model/auctions.service';

@Component({
  selector: 'app-auction-detail',
  templateUrl: './auction-detail.component.html',
  styleUrls: ['./auction-detail.component.css']
})
export class AuctionDetailComponent implements OnInit {

    @Input() auction: AuctionViewModel;

    constructor(
        private auctionsService: AuctionsService,
        private route: ActivatedRoute,
        private location: Location) { }
    
      ngOnInit() {
          this.getAuction();
      }
    
      getAuction(): void {
        const id = +this.route.snapshot.paramMap.get('id');
        this.auctionsService.getAuction("todo", id)
          .subscribe(auction => this.auction = auction);
      }

      goBack(): void {
        this.location.back();
      }
}
