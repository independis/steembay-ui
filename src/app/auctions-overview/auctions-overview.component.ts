import { Component, OnInit } from '@angular/core';
import { AuctionViewModel } from '../viewmodel/auction-viewmodel';
import { AuctionsService } from '../model/auctions.service';
import { SteemConnect2Service } from '../steem-connect2.service';
import { BusyIndicatorService } from '../busy-indicator.service';

@Component({
	selector: 'app-auctions-overview',
	templateUrl: './auctions-overview.component.html',
	styleUrls: ['./auctions-overview.component.css']
})
export class AuctionsOverviewComponent implements OnInit {

	auctions : AuctionViewModel[] = [];
    selectedAuctionViewModel: AuctionViewModel;
    
    searchText: string;

	constructor(
		private auctionsService: AuctionsService,
		public steemConnect2Service : SteemConnect2Service,
		public busyIndicatorService : BusyIndicatorService) { }

	ngOnInit() {
		this.getAuctions();
	}

	getAuctions(): void {
		for (let auctionIndex = 0; auctionIndex < this.auctions.length; auctionIndex++) {
			const auction = this.auctions[auctionIndex];
			auction.Dispose();
        }
        if (this.searchText != null && this.searchText !== "") {
            this.auctionsService.searchAuctions(this.searchText)
                .subscribe(auctions => this.auctions = auctions);
        } else {
            this.auctionsService.getAuctions()
                .subscribe(auctions => this.auctions = auctions);
        }
	}

	onSelect(auctionViewModel: AuctionViewModel) : void {
		this.selectedAuctionViewModel = auctionViewModel;
	}

    public onSearch() : void {
        this.getAuctions();
    }

	public onCreateBid(auctionViewModel) : void {
		var context = this;
		var currentDate = new Date();
		var busyIndicatorServiceRef = this.busyIndicatorService;
		var author = this.steemConnect2Service.Sc2Username;
		var permlink = auctionViewModel.permlink + '-bid-' + currentDate.getFullYear()  + currentDate.getMonth() + currentDate.getDay() + currentDate.getHours() + currentDate.getMinutes() + currentDate.getSeconds();
		var commentBody = 'BID ' + auctionViewModel.create_bid_amount.toFixed(3);
		if (confirm("CREATE " + commentBody + ' ' + auctionViewModel.currency + '\n\nAre you sure?'))
		{
			var waitToken = busyIndicatorServiceRef.add(`Creating Comment @${author}/${permlink} ...`);
			this.steemConnect2Service.createComment(
				auctionViewModel.author, auctionViewModel.permlink,
				author, permlink,
				'', commentBody,
				auctionViewModel.tags,
				function(err,result) {
					if (err) {
						alert("Error occured:\n\n" + err);
					}
					if (result) {
						//alert("Comment successfully created: " + commentBody + "\n\nPlease give the steembay bot a short moment until it has updated the auction data!");
						busyIndicatorServiceRef.remove(waitToken);
						context.waitForConfirmation(context.waitForConfirmation, auctionViewModel, author, permlink, busyIndicatorServiceRef);
					}
				}
			);
		}
	}

	public waitForConfirmation(waitForConfirmationRef ,auctionViewModel:AuctionViewModel, author, permlink, busyIndicatorServiceRef: BusyIndicatorService) {
		var waitToken = busyIndicatorServiceRef.add(`Comment @${author}/${permlink} successfully created.\n\nnPlease give the steembay bot a short moment until it has updated the auction data...`);
		this.auctionsService
			.getAuction(auctionViewModel.author, auctionViewModel.id)
			.subscribe(loadedAuction => {
				var hasError = loadedAuction === null;
				var isHighestBid = false;
				var bidConfirmed = this.checkIfBidIsConfirmed(auctionViewModel, author, permlink, isHighestBid);
				if (bidConfirmed) {
					busyIndicatorServiceRef.remove(waitToken);
					// TODO UPDATE
					for (let auctionIndex = 0; auctionIndex < this.auctions.length; auctionIndex++) {
						const auction = this.auctions[auctionIndex];
						if (auction.id === loadedAuction.id){
							auction.Dispose();
							this.auctions[auctionIndex] = loadedAuction;
						}
					}
				} else {
					setTimeout(() => {
						busyIndicatorServiceRef.remove(waitToken);
						waitForConfirmationRef(auctionViewModel, author, permlink, busyIndicatorServiceRef);
					}, 1000)
			}
		});
	}

	private checkIfBidIsConfirmed(auctionViewModel:AuctionViewModel, author, permlink, isHighestBid:boolean):boolean {
		// first find bid-comment
		isHighestBid = false;

		return false; // bid still not processed

		// check if was confirmed and if it is the highest bid
		isHighestBid = true;
		return true;

		// check if was confirmed but is not the highest bid
		isHighestBid = true;
		return true;
	}
}
