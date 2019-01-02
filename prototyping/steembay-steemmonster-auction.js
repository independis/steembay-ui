
steem.api.setOptions({ url: 'https://api.steemit.com' });
//steem.api.setOptions({ url: 'https://gtg.steem.house:8090' });
//steem.api.setOptions({ url: 'https://rpc.steemviz.com' });

var steembayAuctionTemplateTitle = "steembay SteemMonsters Auction: {{SteemMonsterTitle}}";
var steembayAuctionTemplateBody = 
"# steembay SteemMonsters Auction: {{SteemMonsterTitle}}\n\n" +
"![{{SteemMonsterTitle}}]({{SteemMonsterImageUrl}})\n\n" +
"Start Price: {{StartPrice}} {{Currency}}\n\n" +
"**Happy bidding!**";

function replacePlaceholder(text, replacementPlaceholder, replacementValue) {
	var replacedText = text;
	while (replacedText.indexOf(replacementPlaceholder) >= 0) {
		replacedText = replacedText.replace(replacementPlaceholder, replacementValue);
	}
	return replacedText;
}

function sc2_comment_dummy(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, callbackFunction) {
	confirm(`New comment has to be created: \n\nparent: @${parentAuthor}/${parentPermlink}\n\nauthor: @${author}/${permlink}\n\n${title}\n\n${body}`);
	if (callbackFunction !== null && typeof callbackFunction === "function") {
		callbackFunction(null,{});
	}
}

function doIt() {
	try	{
		var tbStartPrice = document.getElementById("tbStartPrice");
		var startPrice = parseFloat(tbStartPrice.value);

		var selSteemMonsterCard = document.getElementById("selSteemMonsterCard");
		var steemMonsterValue = selSteemMonsterCard.selectedOptions[0].value;
		var steemMonsterTitle = selSteemMonsterCard.selectedOptions[0].label;
		var steemMonsterImageUrl = selSteemMonsterCard.selectedOptions[0].attributes['image'].value;

		var selCurrency = document.getElementById("selCurrency");
		var currencyValue = selCurrency.selectedOptions[0].value;

		var divResults = document.getElementById("divResults");
		divResults.innerHTML = new Date();

		// update steembay auctions
		var auctionTitle = replacePlaceholder(steembayAuctionTemplateTitle, "{{SteemMonsterTitle}}", steemMonsterTitle);

		var auctionContent = replacePlaceholder(steembayAuctionTemplateBody, "{{SteemMonsterTitle}}", steemMonsterTitle);
		auctionContent = replacePlaceholder(auctionContent, "{{SteemMonsterImageUrl}}", steemMonsterImageUrl);
		auctionContent = replacePlaceholder(auctionContent, "{{StartPrice}}", startPrice.toFixed(3));
		auctionContent = replacePlaceholder(auctionContent, "{{Currency}}", currencyValue);

		divResults.innerHTML = auctionTitle + "<br><br>" + replacePlaceholder(auctionContent, "\n", "<br>");

		sc2_comment_dummy('', '', 'seller_account', 'auction_permlink', auctionTitle, auctionContent, null, function(err, result) {
			if (result) {
				sc2_comment_dummy('seller_account', 'auction_permlink','seller_account', 'auction_permlink_start', '', `start ${startPrice.toFixed(3)} ${currencyValue}`, null, function(err, result) {
				});
			}
		});

	} catch (error) {
		alert(error);
	}
}

