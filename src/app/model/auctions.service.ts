import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AuctionDto } from './auction-dto';
import { AuctionViewModel } from '../viewmodel/auction-viewmodel';
import { BidDto } from './bid-dto';
import { HighestBidDto } from './highest-bid-dto';
import { BidViewModel } from '../viewmodel/bid-viewmodel';
import { HighestBidViewModel } from '../viewmodel/highest-bid-viewmodel';

import { MessageService } from '../message.service';

import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class AuctionsService {

  private auctionsServiceUrl = environment.apiUrl + '/api/auctions';  // URL to web api

  constructor(
	private http: HttpClient,
	private messageService: MessageService) { }

    searchAuctions(searchText: string): Observable<AuctionViewModel[]> {
        this.messageService.add('AuctionsService: fetched auctions');
        const url = `${this.auctionsServiceUrl}/${searchText}`;
        return this.http.get<AuctionDto[]>(url)
          .pipe(
            tap(auctions => this.log(`fetched auctions`)),
            map(auctions => {
              var viewModels : AuctionViewModel[] = [];
              for (let index = 0; index < auctions.length; index++) {
                const dto = auctions[index];
                var viewModel = new AuctionViewModel();
                this.mapAuctionDto2AuctionViewModel(dto, viewModel);
                viewModel.update();
                viewModel.hasChanges = false;
                viewModels.push(viewModel);
              }
              return viewModels;
            }),
            catchError(this.handleError('searchAuctions', []))
          );
      }

	getAuctions(): Observable<AuctionViewModel[]> {
	  this.messageService.add('AuctionsService: fetched auctions');
	  return this.http.get<AuctionDto[]>(this.auctionsServiceUrl)
		.pipe(
		  tap(auctions => this.log(`fetched auctions`)),
		  map(auctions => {
			var viewModels : AuctionViewModel[] = [];
			for (let index = 0; index < auctions.length; index++) {
			  const dto = auctions[index];
			  var viewModel = new AuctionViewModel();
			  this.mapAuctionDto2AuctionViewModel(dto, viewModel);
			  viewModel.update();
			  viewModel.hasChanges = false;
			  viewModels.push(viewModel);
			}
			return viewModels;
		  }),
		  catchError(this.handleError('getAuctions', []))
		);
	}

	getAuction(author: string, id: number): Observable<AuctionViewModel> {
	  this.messageService.add(`AuctionsService: fetched auction author=${author}/id=${id}`);
	  const url = `${this.auctionsServiceUrl}/${author}/${id}`;
	  return this.http.get<AuctionDto>(url).pipe(
		tap(_ => this.log(`fetched auction id=${author}/${id}`)),
		map(dto => {
		  if (dto === null) return null;
		  var viewModel = new AuctionViewModel();
		  this.mapAuctionDto2AuctionViewModel(dto, viewModel);
		  viewModel.update();
		  viewModel.hasChanges = false;
		  return viewModel;
		}),
		catchError(this.handleError<AuctionViewModel>(`getAuction id=${author}/${id}`))
	  );
	}

	private mapAuctionDto2AuctionViewModel(source: AuctionDto, target: AuctionViewModel){
		target.id = source.id;
		target.author = source.author;
		target.permlink = source.permlink;
		target.title = source.title;
		target.tags = source.tags;
		target.created = source.created;
		target.finished = source.finished;
		target.cashout_time = source.cashout_time;
		target.state = source.state;
		target.start_amount = source.start_amount;
		target.currency = source.currency;
		target.main_image_url = source.main_image_url;

		var targetHighestBid: HighestBidViewModel = new HighestBidViewModel();
		if (source.highest_bid !== undefined && source.highest_bid !== null) this.mapHighestBidDto2BidViewModel(source.highest_bid, targetHighestBid);
		target.highest_bid = targetHighestBid;

		var bidViewModelArray: BidViewModel[] = [];
		if (source.bids !== undefined && source.bids !== null && source.bids.length > 0) {
			for (let bidArrayIndex = 0; bidArrayIndex < source.bids.length; bidArrayIndex++) {
				const bidElement = source.bids[bidArrayIndex];
				var bidViewModel: BidViewModel = new BidViewModel();
				this.mapBidDto2BidViewModel(bidElement, bidViewModel);
				bidViewModelArray.push(bidViewModel);
			}
		}

		target.hasChanges = false;

		// set auction price
		target.price  = 
		target.highest_bid !== null && target.highest_bid.bid_amount !== null 
			? target.highest_bid.bid_amount 
			: target.start_amount;
	}

	private mapHighestBidDto2BidViewModel(source: HighestBidDto, target: HighestBidViewModel){
		target.author = source.author;
		target.permlink = source.permlink;
		target.created = source.created;
		target.bid_amount = source.bid_amount;
	  }

	private mapBidDto2BidViewModel(source: BidDto, target: BidViewModel){
		target.id = source.id;
		target.author = source.author;
		target.permlink = source.permlink;
		target.created = source.created;
		target.bidAmount = source.bidAmount;
		target.isStart = source.isStart;
		target.isBid = source.isBid;
		target.isBidAccepted = source.isBidAccepted;
		target.isBidOverbid = source.isBidOverbid;
		target.isBidRejected = source.isBidRejected;
		target.isBidRevoked = source.isBidRevoked;
		target.isBidReactivated = source.isBidReactivated;
	  }

	  // private mapAuctionViewModel2AuctionDto(source: AuctionViewModel, target: AuctionDto){
	//     target.id = source.id;
	//     target.author = source.author;
	//     target.permlink = source.permlink;
	//     target.created = source.created;
	//     target.cashout_time = source.cashout_time;
	//     target.state = source.state;
	//     target.highest_bid = source.highest_bid;
	//   }

	/**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
	return (error: any): Observable<T> => {
 
	  // TODO: send the error to remote logging infrastructure
	  console.error(error); // log to console instead
 
	  // TODO: better job of transforming error for user consumption
	  this.log(`${operation} failed: ${error.message}`);
 
	  // Let the app keep running by returning an empty result.
	  return of(result as T);
	};
  }
 
  /** Log a AuctionsService message with the MessageService */
  private log(message: string) {
	this.messageService.add('AuctionsService: ' + message);
  }
}
