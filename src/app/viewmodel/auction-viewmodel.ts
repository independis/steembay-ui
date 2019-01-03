import { SafeStyle } from '@angular/platform-browser';

import { BidViewModel } from "./bid-viewmodel";
import { HighestBidViewModel } from "./highest-bid-viewmodel";
import { TimerService } from '../timer.service';

export class AuctionViewModel {
	id: number;
	author: string;
	permlink: string;
    title: string;
    tags: string[];
	created: Date;
	finished: Date;
	cashout_time: Date;
	state: string;
	start_amount: number;
	currency: string;
	main_image_url: string;
	highest_bid: HighestBidViewModel;
	price: number;
	hasChanges: boolean;

	remaining_time: number;
	remaining_time_text : string;
	start_info_text: string;
	end_info_text: string;
	bid_info_text: string;

	create_bid_enabled: boolean;
	create_bid_is_valid: boolean;
	create_bid_amount: number;
	create_bid_step: number;
	create_bid_min: number;
	create_bid_max: number;

    private timerService: TimerService = new TimerService();
	private currentUTC: Date = new Date(); // on nodeJS this is already the UTC time

    constructor() {
        this.timerService.timer.subscribe(() => {
            this.timerUpdate();
        });
    }

    public Dispose() : void {
        // unsubscribe???
    }

	public onCreateBidAmountChanged() : void {
		this.setAuctionCreateBidIsValid();
	}

	public timerUpdate(): void {
		this.setRemainingTime();
	}

	public update(): void {
        this.setRemainingTime();
		this.setAuctionStartInfoText();
		this.setAuctionEndInfoText();
		this.setAuctionBidInfoText();
		this.setAuctionCreateBidValues();
	}

	private setAuctionCreateBidIsValid() {
		this.create_bid_is_valid = 
			this.create_bid_amount >= this.create_bid_min && 
			this.create_bid_amount < this.create_bid_max;
	}

	private setAuctionCreateBidValues() {
		this.create_bid_step = 0.1;
		this.create_bid_min = 
			this.highest_bid !== null && this.highest_bid.bid_amount !== undefined && this.highest_bid.bid_amount !== null
			? this.highest_bid.bid_amount + this.create_bid_step
			: this.start_amount;
		this.create_bid_max = 999999.999;
		this.create_bid_amount = this.create_bid_min;
		this.setAuctionCreateBidIsValid();
	}

    private setRemainingTime() {
		// first calculate remaining_time
		this.currentUTC = new Date(); // on nodeJS this is already the UTC time
        var cashout_time_date = new Date(this.cashout_time);
        if (this.state === "RUNNING" || this.state === "STARTED") {
			this.remaining_time =
				cashout_time_date > this.currentUTC
				? cashout_time_date.getTime() - this.currentUTC.getTime()
				: 0;
        } else {
            this.remaining_time = 0;
		} 
        this.remaining_time_text = this.remaining_time > 0 ? this.toHHMMSS(this.remaining_time) : '00:00:00';
        this.create_bid_enabled = this.remaining_time > 0;
    }

	private setAuctionEndInfoText() {
		// set endInfoText
		if (this.state === "ENDED") {
			this.end_info_text = 'Auction ended at ' + this.convertDateUtcToStringYyyyMmDdHhMmSs(this.finished, true) + ' GMT';
		} else if (this.state === "CANCELED") {
			this.end_info_text = 'Auction canceled at ' + this.convertDateUtcToStringYyyyMmDdHhMmSs(this.finished, true) + ' GMT';
		} else if (this.state === "FINISHED") {
			this.end_info_text = 'Auction closed at ' + this.convertDateUtcToStringYyyyMmDdHhMmSs(this.finished, true) + ' GMT';
		} else if (this.state === "RUNNING" || this.state === "STARTED") {
			this.end_info_text = '';
		} else if (this.state === "NOTSTARTED") {
			this.end_info_text = '';
		} else {
			this.end_info_text = "TODO: " + this.state;
		}
	}
	
	private setAuctionBidInfoText() {
		var bidText = 
		(this.highest_bid !== null && this.highest_bid.bid_amount !== undefined && this.highest_bid.bid_amount !== null)
		? this.highest_bid.bid_amount.toFixed(3) + ' ' + this.currency + ' by @' + this.highest_bid.author
		: '';

		// set endInfoText
		if (this.state === "FINISHED" || this.state === "ENDED" ) {
			this.bid_info_text = (this.highest_bid !== null && this.highest_bid.bid_amount !== undefined && this.highest_bid.bid_amount !== null)
			? 'Winning Bid of ' + bidText
			: 'No Bid';
		} else if (this.state === "CANCELED") {
			this.bid_info_text = '';
		} else if (this.state === "RUNNING" || this.state === "STARTED") {
			this.bid_info_text = (this.highest_bid !== null && this.highest_bid.bid_amount !== undefined && this.highest_bid.bid_amount !== null)
			? 'Highest Bid of ' + bidText
			: 'No Bids till now...';
		} else if (this.state === "NOTSTARTED") {
			this.bid_info_text = '';
		} else {
			this.bid_info_text = "TODO: " + this.state;
		}
	}

	private setAuctionStartInfoText() {
		this.start_info_text =
		(this.state !== "NOTSTARTED" && this.start_amount !== undefined && this.start_amount !== null)
		? `Start Amount of ${this.start_amount.toFixed(3)} ${this.currency}`
		: 'Auction not started yet...';
	}

	private toHHMMSS (pTime) : string {
		var secNum = parseInt(pTime, 10); // don't forget the second param
		var days = Math.floor(secNum / (1000 * 60 * 60 * 24));
		var hours = Math.floor((secNum - (days * 1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		var minutes = Math.floor((secNum - (days * 1000 * 60 * 60 * 24) - (hours * 1000 * 60 * 60)) / (1000 * 60));
		var seconds = Math.floor((secNum - (days * 1000 * 60 * 60 * 24) - (hours * 1000 * 60 * 60) - (minutes * 1000 * 60)) / 1000);
		// var milliseconds = Math.floor((secNum - (days * 1000 * 60 * 60 * 24) - (hours * 1000 * 60 * 60) - (minutes * 1000 * 60) - (seconds * 60)));
	
		var hours_text = (hours < 10) ? '0' + hours : hours;
		var minutes_text = (minutes < 10) ? '0' + minutes : minutes;
		var seconds_text = (seconds < 10) ? '0' + seconds : seconds;
		return (days > 0 ? days + ' days ' : '') + hours_text + ':' + minutes_text + ':' + seconds_text;
	}

	
	private convertToDetailedDate(pDate) {
		if (pDate === undefined || pDate === null) pDate = new Date();
		if (typeof pDate === 'string') pDate = new Date(pDate);
		return {
			year: pDate.getFullYear(),
			month: pDate.getMonth() + 1, /* getMonth() is zero-based */
			day: pDate.getDate(),
			hours: pDate.getHours(),
			minutes: pDate.getMinutes(),
			seconds: pDate.getSeconds()
		};
	}

	private convertToStringYyyyMmDdHhMmSs (pYear, pMonth, pDay, pHour, pMinute, pSecond, pPrettyPrint) {
		return [ pYear,
				(pMonth > 9 ? '' : '0') + pMonth,
				(pDay > 9 ? '' : '0') + pDay
			].join('-') +
			(pPrettyPrint ? ' ' : '-') +
			[	(pHour > 9 ? '' : '0') + pHour,
				(pMinute > 9 ? '' : '0') + pMinute,
				(pSecond > 9 ? '' : '0') + pSecond
			].join((pPrettyPrint ? ':' : '-'));
	}

	private convertToUtcDetailedDate(pDate) {
		if (pDate === undefined || pDate === null) pDate = new Date();
		if (typeof pDate === 'string') pDate = new Date(pDate);
		return {
			year: pDate.getUTCFullYear(),
			month: pDate.getUTCMonth() + 1, /* getMonth() is zero-based */
			day: pDate.getUTCDate(),
			hours: pDate.getUTCHours(),
			minutes: pDate.getUTCMinutes(),
			seconds: pDate.getUTCSeconds()
		};
	}
	
	private convertDateUtcToStringYyyyMmDdHhMmSs(pDate, pPrettyPrint) {
		var detailedDate = this.convertToUtcDetailedDate(pDate);
		return this.convertToStringYyyyMmDdHhMmSs(detailedDate.year, detailedDate.month, detailedDate.day, detailedDate.hours, detailedDate.minutes, detailedDate.seconds, pPrettyPrint);
	}
}
