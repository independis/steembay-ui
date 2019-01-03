import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { SteemConnect2Service } from '../steem-connect2.service';
import { BusyIndicatorService } from '../busy-indicator.service';

@Component({
  selector: 'app-sell',
  templateUrl: './sell.component.html',
  styleUrls: ['./sell.component.css']
})
export class SellComponent implements OnInit {

	self = this;

	public title: string = "";
	public description: string;
	public tags: string = "";
	public start_amount: number;
	public currency: string;

	constructor(
		public steemConnect2Service : SteemConnect2Service, 
		public busyIndicatorService : BusyIndicatorService) { }

	ngOnInit() {
		this.start_amount = 1.0;
		this.currency = "STEEM";
		this.description = 
			"# What Do you sell\n\n" +
			"Describe in detail what you want to sell.\n\n" +
			"# Start Amount and Currency\n\n" +
			"Start Amount: 1.000 SBD/STEEM\n\n" +
			"<hr>\n\n" +
			"This is an automatically created auction through the [steembay UI](http://steembay.steemtool.de). \n\n" +
			"**The #steembay auction system was created by [@pollux.one](https://www.steemit.com/@pollux.one), [@schererf](https://www.steemit.com/@schererf) and [@independis](https://www.steemit.com/@independis).**";
	}

	public createAuction() : void {
		// First check SC2 Login
		if (!this.steemConnect2Service.Sc2IsLoggedIn) {
			alert("Please Login via SteemConnect2 first!");
			return;
		}
		// Confirmation
		var validationMessage = "";
		if (this.title.trim() === "") {
			validationMessage += "Title is required.\n";
		}
		if (this.description.trim() === "") {
			validationMessage += "Description is required.\n";
		}
		if (this.start_amount < 0.001) {
			validationMessage += "Start Price has to 0.001 or greater.\n";
		}
		if (this.currency === null || this.currency === null || (this.currency !== "SBD" && this.currency !== "STEEM")) {
			validationMessage += "Currency has to be \"SBD\" oder \"STEEM\".\n";
		}
		if (validationMessage !== "") {
			alert ("Please check your data first!\n\n" + validationMessage);
		} else {
			var metadataTags = [environment.steembayTag];
			var tagsOfInput = this.tags.split(' ');
			for (let tagIndex = 0; tagIndex < tagsOfInput.length; tagIndex++) {
				const tagOfInput = tagsOfInput[tagIndex];
				if (tagOfInput !== null && tagOfInput.trim() !== "") metadataTags.push(tagOfInput);
			}
			var message = "Do you really want to create the following auction?\n\n" +
			"----------------------------------------\n" +
			`TITLE: ${this.title}\n` +
			"----------------------------------------\n" +
			`${this.description}\n` +
			"----------------------------------------\n" +
			`TAGS: ${metadataTags.join(",")}\n` +
			"----------------------------------------\n" +
			`START ${this.start_amount.toFixed(3)} ${this.currency}\n` +
			"----------------------------------------\n";
			if (confirm(message)) {
				// TODO: create auction and start comment !!!
				// error callback
				var errorCallback = function(err) {
					alert(err + '\n' + JSON.stringify(err));
				}
				var permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
				this.broadcastAuction(this.steemConnect2Service.Sc2Username, permlink, this.title, this.description, metadataTags, this.start_amount, this.currency, errorCallback);
			}
		}
	}

	broadcastAuction(author:string, permlink:string, title:string, body:string, tags:string[], startPrice:number, currency:string, errorCallback) {
		var steemConnect2ServiceRef = this.steemConnect2Service;
		var busyIndicatorServiceRef = this.busyIndicatorService;
		var postToken = busyIndicatorServiceRef.add( `@${author}/${permlink}: creating auction...`);
		try {
			// create post
			this.createPostWithBeneficiaries(
				author,
				permlink, 
				title,
				body,
				tags[0],
				tags,
				(err, result) => {
					busyIndicatorServiceRef.remove(postToken);
					if (err) {
						errorCallback(err);
					}
					if (result) {
						// create start comment
						postToken = busyIndicatorServiceRef.add( `@${author}/${permlink}: successfully created - waiting for creation of start comment, this will take about 20 seconds...`);
						setTimeout(function() {
							busyIndicatorServiceRef.remove(postToken);
							postToken = busyIndicatorServiceRef.add( `@${author}/${permlink}: creating start comment...`);
							steemConnect2ServiceRef.comment(
								author, permlink,
								author, permlink + '-start',
								'',
								'START ' +  startPrice.toFixed(3) + ' ' + currency,
								JSON.stringify({"tags": tags, "app": environment.appName}), // metadata
								(err, result) => {
									busyIndicatorServiceRef.remove(postToken);
									if (err) {
										errorCallback(err);
									}
									if (result) {
										alert(`@${author}/${permlink}: done - post with beneficiaries and comment successfully created`);
									}
								});	
						}, 20000);
					}
				});
		} catch (error) {
			alert(JSON.stringify(error));
		}
	}
	
	createPostWithBeneficiaries(pAuthor, pPermlink, pTitle, pBody, pRootTag, pTags, pCallback) {
		// beneficiaries
		var operations = [
			["comment", {
				"parent_author": '',
				"parent_permlink": pRootTag,
				"author": pAuthor, 
				"permlink": pPermlink,
				"title": pTitle,
				"body": pBody,
				"json_metadata": JSON.stringify({"tags": pTags, "app": environment.appName})
			}],
			["comment_options", {
				"author": pAuthor,
				"permlink": pPermlink,
				"max_accepted_payout": '1000000.000 SBD', 
				"percent_steem_dollars": 10000, 
				"allow_votes": true, 
				"allow_curation_rewards": true, 
				"extensions": [ 
					[0, { 
						"beneficiaries": [ 
							{ "account": 'steembay', "weight": 10000.0 }
						] 
					}] 
				] 
			}]
		];
		this.steemConnect2Service.broadcast(operations, (pErr, pResult) => pCallback(pErr, pResult));
	}

}
