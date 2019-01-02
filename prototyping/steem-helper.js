function parseDateFromUtcString(pUtcDateString) {
	var date = new Date(pUtcDateString);
	if (pUtcDateString.indexOf('Z') < 0) {
		date = date.getTime() - (date.getTimezoneOffset() * 60000);
		date = new Date(date);
	}
	return date;
}

function getCashoutTime(pAuction) {
	var cashoutTime;
	if (pAuction.cashout_time === '1969-12-31T23:59:59') {
		cashoutTime = new Date(parseDateFromUtcString(pAuction.created).getTime() + 7 * 86400000);
	} else {
		cashoutTime = parseDateFromUtcString(pAuction.cashout_time);
	}
	return cashoutTime;
}
	
function prepareAuctionInfoFields(pAuction) {
	if (pAuction === undefined || pAuction === null) return;
	if (pAuction.auction_data === undefined || pAuction.auction_data === null) return;

	// prepare price field
	pAuction.price = 
	pAuction.auction_data.highest_bid !== null && pAuction.auction_data.highest_bid.bid_amount !== null 
	? pAuction.auction_data.currency + ' ' + pAuction.auction_data.highest_bid.bid_amount.toFixed(3) 
	: pAuction.auction_data.currency + ' ' + pAuction.auction_data.start_amount.toFixed(3);

	// prepare cashouttime	
	pAuction.cashoutTime = getCashoutTime(pAuction);

	// prepare remaining field
	currentUTC = new Date(); // on nodeJS this is already the UTC time
	pAuction.remainingTime = 0;
    if (pAuction.auction_data.state !== "FINISHED" && 
        pAuction.auction_data.state !== "CANCELED" && 
        pAuction.auction_data.state !== "ENDED"
    ) {
		pAuction.remainingTime =
			pAuction.cashoutTime > currentUTC
			? pAuction.cashoutTime - currentUTC
			: null;
	}
	pAuction.remainingTimeText = pAuction.remainingTime > 0 
	? toHHMMSS(pAuction.remainingTime) 
	: '';
}

function getPostsByTagAsync(pTag, pStartTime) {
	return new Promise((resolve, reject) => {
		try {
			var foundItems = [];
			var getDiscussionsByCreatedWrapper = function(pTag, pStartTime, pAuthor, pPermlink) {
				var filter = {'tag': pTag, 'limit': 20, 'start_permlink': pPermlink, 'start_author': pAuthor};
				steem.api.getDiscussionsByCreated(filter, function(err, result) {
					try {
						if (err) {
							reject(err);
							return;
						}
						if (result) {
							var hasFoundNewItems = false;
							for (var i = 0; i < result.length; i++) {
								if (new Date(result[i].created).getTime() >= pStartTime) {
									// check if item already exists in list
									var existingItem = null;
									for (var foundItemsIndex = 0; foundItemsIndex < foundItems.length; foundItemsIndex++) {
										var elementToCheck = foundItems[foundItemsIndex];
										if (elementToCheck.id === result[i].id) {
											existingItem = elementToCheck;
										}
									}
									if (existingItem === null) {
										// add new found item
										foundItems.push({
												id: result[i].id,
												created: result[i].created,
												cashout_time: result[i].cashout_time,
												author: result[i].author,
												permlink: result[i].permlink,
												title: result[i].title,
												json_metadata: result[i].json_metadata,
												main_image: getMainImagePreviewUrl(result[i])
											}
										);
										hasFoundNewItems = true;
									}
								} else {
									// start date reached
									resolve(foundItems);
									return;
								}
							}
							// read next items
							if (hasFoundNewItems) {
								getDiscussionsByCreatedWrapper(pTag, pStartTime, result[result.length - 1].author, result[result.length - 1].permlink);
							} else {
								resolve(foundItems);
							}
						}
					} catch (ex) {
						reject(ex);
					}
				});
			}
			getDiscussionsByCreatedWrapper(pTag, pStartTime, null, null);
		} catch (ex) {
			reject(ex);
		}
	});
}

function getPostContentAsync(pAuthor, pPermlink) {
	return new Promise((resolve, reject) => {
		try {
			steem.api.getContentAsync(pAuthor, pPermlink)
			.then(function (post) { resolve(post); })
			.catch(function (err) { reject(err); });
		} catch (error) {
			reject(error);
		}
	});
}


function getAuctionHistoryReplyAsync(pAuctionId, pAuctionAuthor, pAuctionPermlink, pSteembayAccount) {
	return getPostContentAsync(pSteembayAccount, `${pAuctionAuthor}-${pAuctionId}-auction-history`);
}

function getAuctionsDetailsAsync(pAuction, pSteembayTag, pSteembayAccount) {
	return new Promise((resolve, reject) => {
		try {
			if (pAuction != null) {
				return getAuctionHistoryReplyAsync(pAuction.id, pAuction.author, pAuction.permlink, pSteembayAccount
				).then(function (auctionHistory) {
					return steem.api.getContentRepliesAsync(auctionHistory.author, auctionHistory.permlink);
				}).then(function (replies) {
					var auctionResult = pAuction;
					for (let replyIndex = 0; replyIndex < replies.length; replyIndex++) {
						const reply = replies[replyIndex];
						var auctionFinishedInfo = null;
						var auctionInfo = null;
						var auctionStartInfo = null;
						var replyMetadata = reply.json_metadata !== null && reply.json_metadata !== "" ? JSON.parse(reply.json_metadata) : null;
						if (replyMetadata != null && 
							replyMetadata.tags != null && 
							replyMetadata.tags.length >= 2 && 
							replyMetadata.tags[0] === pSteembayTag &&
							replyMetadata.data !== undefined && replyMetadata.data !== null && 
							replyMetadata.data.auctionInfo !== undefined && replyMetadata.data.auctionInfo !== null
						) {
							if (replyMetadata.tags[1] === "auction-finishedinfo") {
								auctionFinishedInfo = replyMetadata.data.auctionInfo;
							} else if (replyMetadata.tags[1] === "auction-info") {
								auctionInfo = replyMetadata.data.auctionInfo;
							} else if (replyMetadata.tags[1] === "auction-startinfo") {
								auctionStartInfo = replyMetadata.data.auctionInfo;
							}
						}
						if (auctionFinishedInfo !== null) {
							auctionResult.auction_data = auctionFinishedInfo;
						} else if (auctionInfo !== null) {
							auctionResult.auction_data = auctionInfo;
						} else if (auctionStartInfo !== null) {
							auctionResult.auction_data = auctionStartInfo;
						}
					}
					prepareAuctionInfoFields(auctionResult);
					resolve(auctionResult);
				}).catch((err) => {
					reject(err);
				});
			} else {
				resolve(pAuction);
			}
		} catch (error) {
			reject(error);
		}
	});
}

function toHHMMSS (pTime) {
	var secNum = parseInt(pTime, 10); // don't forget the second param
	var days = Math.floor(secNum / (1000 * 60 * 60 * 24));
	var hours = Math.floor((secNum - (days * 1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	var minutes = Math.floor((secNum - (days * 1000 * 60 * 60 * 24) - (hours * 1000 * 60 * 60)) / (1000 * 60));
	var seconds = Math.floor((secNum - (days * 1000 * 60 * 60 * 24) - (hours * 1000 * 60 * 60) - (minutes * 1000 * 60)) / 1000);
	// var milliseconds = Math.floor((secNum - (days * 1000 * 60 * 60 * 24) - (hours * 1000 * 60 * 60) - (minutes * 1000 * 60) - (seconds * 60)));

	if (hours < 10) { hours = '0' + hours; }
	if (minutes < 10) { minutes = '0' + minutes; }
	if (seconds < 10) { seconds = '0' + seconds; }
	return (days > 0 ? days + ' days ' : '') + hours + ':' + minutes + ':' + seconds;
}

function convertToStringYyyyMmDdHhMmSs (pYear, pMonth, pDay, pHour, pMinute, pSecond, pPrettyPrint) {
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

function convertToUtcDetailedDate(pDate) {
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

function convertToDetailedDate(pDate) {
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

function convertDateUtcToStringYyyyMmDdHhMmSs(pDate, pPrettyPrint) {
	var detailedDate = convertToUtcDetailedDate(pDate);
	return convertToStringYyyyMmDdHhMmSs(detailedDate.year, detailedDate.month, detailedDate.day, detailedDate.hours, detailedDate.minutes, detailedDate.seconds, pPrettyPrint);
}

function getAuctionInfoText(pAuction) {
	if (pAuction === undefined || pAuction === null) return null;
	if (pAuction.auction_data === undefined || pAuction.auction_data === null) return "---";

	currentUTC = new Date(); // on nodeJS this is already the UTC time
	var infoText = "";
	if (pAuction.auction_data.state === "ENDED") {
		infoText = 
			(pAuction.auction_data.highest_bid !== null && pAuction.auction_data.highest_bid.bid_amount !== null)
			? ('Auction ended at ' + convertDateUtcToStringYyyyMmDdHhMmSs(pAuction.auction_data.created, true) + ' GMT - Winning Bid of ' + pAuction.auction_data.highest_bid.bid_amount.toFixed(3) + ' SBD by @' + pAuction.auction_data.highest_bid.author)
			: 'Auction ended at ' + convertDateUtcToStringYyyyMmDdHhMmSs(pAuction.auction_data.created, true) + ' GMT - No Bid';
	} else if (pAuction.auction_data.state === "CANCELED") {
		infoText = 'Auction canceled at ' + convertDateUtcToStringYyyyMmDdHhMmSs(pAuction.auction_data.created, true) + ' GMT';
	} else if (pAuction.auction_data.state === "FINISHED") {
		infoText = 
			(pAuction.auction_data.highest_bid !== null && pAuction.auction_data.highest_bid.bid_amount !== null)
			? ('Auction closed at ' + convertDateUtcToStringYyyyMmDdHhMmSs(pAuction.auction_data.created, true) + ' GMT - Winning Bid of ' + pAuction.auction_data.highest_bid.bid_amount.toFixed(3) + ' SBD by @' + pAuction.auction_data.highest_bid.author)
			: 'Auction closed at ' + convertDateUtcToStringYyyyMmDdHhMmSs(pAuction.auction_data.created, true) + ' GMT - No Bid';
	} else if (pAuction.auction_data.state === "RUNNING" || pAuction.auction_data.state === "STARTED") {
		infoText = `<strong>${pAuction.remainingTimeText} left</strong><br><br>`
		infoText += 
			(pAuction.auction_data.highest_bid !== null && pAuction.auction_data.highest_bid.bid_amount !== null)
			? ('Highest Bid of ' + pAuction.auction_data.highest_bid.bid_amount.toFixed(3) + ' SBD by @' + pAuction.auction_data.highest_bid.author)
			: 'Start: ' + pAuction.auction_data.start_amount.toFixed(3) + ' SBD (No bids till now...)';
		infoText += '<br><br>Auction ends at ' + pAuction.auction_data.cashout_time.replace('T', ' ') + ' GMT' + (pAuction.remainingTime != null ? ' (' + pAuction.remainingTimeText + ')' : '');
	} else {
		// if (pAuction.isCashoutTimeExceeded) {
		// 	var cashouttime = new Date(pAuction.last_payout);
		// 	if (cashouttime.getUTCFullYear() <= 1970) {
		// 		cashouttime = new Date(pAuction.cashout_time);
		// 	}
		// 	stateText = 'Auction not started but the cashout time has been exceeded (' +
		// 	convertDateUtcToStringYyyyMmDdHhMmSs(cashouttime, true) + ' GMT)'
		// 	tableDataFinishedAuctions += imageUrl + seperator + auctionTitleText + '<br><br>' + stateText + '\n';
		// } else {
		// 	stateText = 'Auction not started';
		// 	tableDataOpenAuctions += imageUrl + seperator + auctionTitleText + '<br><br>' + stateText + '\n';
		// }
		infoText = "TODO";
	}
	return infoText;
}

function getMainImageUrl(pPost) {
	var imageUrl;
	try {
		var images = (pPost.json_metadata != undefined && pPost.json_metadata != '') ? JSON.parse(pPost.json_metadata).image : [];
		imageUrl = (images != null && images.length > 0)
			? imageUrl = images[0]
			: null;
	} catch (ex) {
		imageUrl = null;
	}
	return imageUrl;
}

function getMainImagePreviewUrl(pPost) {
	var imagePreviewUrl;
	try {
		var imageUrl = getMainImageUrl(pPost);
		imagePreviewUrl = imageUrl != null && imageUrl != '' ? 'https://steemitimages.com/200x200/' + imageUrl : null;
	} catch (ex) {
		imagePreviewUrl = null;
	}
	return imagePreviewUrl;
}

function getListOfAuctionsByAccountHistoryAsync(pSteembayTag, pSteembayAccount) {
	return new Promise((resolve, reject) => {
		try {
			var dateToCheck = new Date().setTime( new Date().getTime() - (10*24*60*60*1000) );
			var dataArray = [];
			getAccountHistory(pSteembayAccount,
				function(elementToCheck) {
					if (elementToCheck !== null && elementToCheck.length >= 2 && elementToCheck[1].timestamp !== undefined && elementToCheck[1].timestamp !== null) {
						return new Date(elementToCheck[1].timestamp) > dateToCheck;
					} 
					return true;
				},
				function(err,result) {
					if (err) {
						reject(err);
						return;
					}
					if (result) {
						var keys = Object.keys(result);
						for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
							const key = keys[keyIndex];
							var element = result[key];
							if (element[1].op[0] === "comment" && element[1].op[1].json_metadata.indexOf(pSteembayTag) >= 0 && element[1].op[1].json_metadata.indexOf("auction-history") >= 0) {
								dataArray.push({
									author: element[1].op[1].parent_author,
									permlink: element[1].op[1].parent_permlink
								});
							}
						}
						resolve(dataArray);
						return;
					}
				});
			} catch (error) {
				reject(error);
			}
		});
}

function getAuctionsAsync(pSteembayTag, pSteembayAccount) {
	return new Promise((resolve, reject) => {
		try {
			var startDateTime = new Date();
			var startTime = startDateTime.getTime() + (startDateTime.getTimezoneOffset() * 60 * 1000) - (10 * 24 * 60 * 60 * 1000);
			var listOfAuctionsByAccountHistory = [];
			// getListOfAuctionsByAccountHistoryAsync(pSteembayTag, pSteembayAccount
			// ).then(function(list) {
			// 	listOfAuctionsByAccountHistory = list;
			// 	return getPostsByTagAsync(pSteembayTag, startTime);
			// })
			getPostsByTagAsync(pSteembayTag, startTime)
			.then(function(auctions) {
				var auctionsToProcess = [];
				for (let auctionIndex = 0; auctionIndex < auctions.length; auctionIndex++) {
					const auction = auctions[auctionIndex];
					var auctionMetadata = auction.json_metadata != null && auction.json_metadata != "" ? JSON.parse(auction.json_metadata) : null;
					if (auction.author !== pSteembayAccount &&
						auctionMetadata != null && auctionMetadata.tags != undefined && auctionMetadata.tags.length > 1 && auctionMetadata.tags[0] == pSteembayTag
					) {
						auctionsToProcess.push(auction);
					}
				}
				return auctionsToProcess;
			}).then (function(auctionsToProcess) {
				return Promise.map(auctionsToProcess, function (auction) {
					return getAuctionsDetailsAsync(auction, pSteembayTag, pSteembayAccount);
				});
			}).then(function (auctions) {
				resolve(auctions); })
			.catch(function (err) { 
				reject(err); });
		} catch (error) {
			reject(error);
		}
	});
}

var maxItemCount = 0;

function getAccountHistory(pAccount, pCheckContinue, pFnCallback) {
	maxItemCount=0;
	var dataArray=[];
	getAccountHistoryRecursiveInternal(pAccount, -1, 1000, pCheckContinue, dataArray, null, pFnCallback);
}

function getAccountHistoryRecursive(pAccount, pFrom, pLimit, pCheckContinue, pDataArray, pSetProgess, pFnCallback) {
	maxItemCount=0;
	getAccountHistoryRecursiveInternal(pAccount, pFrom, pLimit, pCheckContinue, pDataArray, pSetProgess, pFnCallback);
}

function getAccountHistoryRecursiveInternal(pAccount, pFrom, pLimit, pCheckContinue, pDataArray, pSetProgess, pFnCallback) {
	var progressValue = 0;
	console.log( 'requesting data for @' + pAccount + ' (' + pFrom + '/' + pLimit + ')');
	if (pFrom == -1) {
		progressValue = 0; 
	} else if (pFrom <= pLimit) {
		progressValue = 100;
	} else {
		progressValue = parseInt(((maxItemCount-pFrom)*100)/maxItemCount);
	}
	if (pSetProgess !== null && typeof pSetProgess === 'function') pSetProgess(progressValue, progressValue + '%');
	steem.api.getAccountHistory(pAccount, pFrom, pLimit, function(err,result){
		if (err){
			console.error( JSON.stringify(err));
			pFnCallback(err, null);
			return;
		}
		if (result) {
			var lastIndex = -1;
			for (let index = 0; index < result.length; index++) {
				const element = result[index];
				const currentIndex = element[0];
				if (currentIndex > maxItemCount) maxItemCount = currentIndex;
				if (lastIndex === -1 || lastIndex > currentIndex) lastIndex = currentIndex;
				if (pDataArray[currentIndex] === undefined) {
					pDataArray[currentIndex] = element;
				}
			}
			if (lastIndex > 0 && pCheckContinue !== null && typeof pCheckContinue === 'function' && pCheckContinue(pDataArray[lastIndex]) ) {
				getAccountHistoryRecursive(pAccount, lastIndex, pLimit > lastIndex ? lastIndex : pLimit, pCheckContinue, pDataArray, pSetProgess, pFnCallback)
			} else {
				// finished
				if (pSetProgess !== null && typeof pSetProgess === 'function') pSetProgess(100, "100%");
				if (pFnCallback !== null && typeof pFnCallback === 'function') pFnCallback(null, pDataArray);
			}
		}
	} );   
}
