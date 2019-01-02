
steem.api.setOptions({ url: 'https://api.steemit.com' });
//steem.api.setOptions({ url: 'https://gtg.steem.house:8090' });
//steem.api.setOptions({ url: 'https://rpc.steemviz.com' });

function setProgressbar(pValue, pText) {
	if (pValue == undefined || pValue == null || pValue > 100) pValue = 100;
	$('#divProgressbar').css('width', pValue+'%').attr('aria-valuenow', pValue);    
	$('#divProgressbar').text(pText);
}


function doIt() {
	try	{
		var tbSteemitUsername = document.getElementById("tbSteemitUsername");
		var pAccount = tbSteemitUsername.value;
		var divResults = document.getElementById("divResults");
		divResults.innerText = new Date();

		// update steembay auctions
		setProgressbar(50, 'loading auctions');
		var startDateTime = new Date();
		var startTime = startDateTime.getTime() + (startDateTime.getTimezoneOffset() * 60 * 1000) - (10 * 24 * 60 * 60 * 1000);
		getAuctionsAsync(tbSteemitUsername.value, 'steembay')
		.then(auctions => {
			setProgressbar(100, 'loading auctions');
			var htmlOutput = "<table>";
			if (auctions != null) {
				auctions.sort(function(pAuction1, pAuction2) {
					return (new Date(pAuction1.created) - new Date(pAuction2.created));
				});
				for (let auctionIndex = 0; auctionIndex < auctions.length; auctionIndex++) {
					const auction = auctions[auctionIndex];
					htmlOutput += "<tr>";
					htmlOutput += `<td rowspan="2"><div class="auction-image-container"><img src="${auction.main_image}" class="auction-image-container" /></div></td>`;
					htmlOutput += '<td colspan="2">';
					htmlOutput += `<a href="https://www.steemit.com/@${auction.author}/${auction.permlink}">@${auction.author}/${auction.permlink}</a>`;
					htmlOutput += "</td>";
					htmlOutput += "</tr>\n";
					htmlOutput += "<tr>";
					htmlOutput += `<td><strong>${auction.price}</strong></td>`;
					htmlOutput += `<td>${getAuctionInfoText(auction)}</td>`
					htmlOutput += "<tr>\n";
				}
			}
			htmlOutput += "</tbody></table>"
			divResults.innerHTML = htmlOutput;
		})
		.catch(err => {
			alert(err);
		});
	} catch (error) {
		alert(error);
	}
}

