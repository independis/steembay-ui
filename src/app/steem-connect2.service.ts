import { Injectable, OnInit  } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';

import { environment } from '../environments/environment';

import * as sc2 from 'sc2-sdk';

@Injectable({
	providedIn: 'root'
})
export class SteemConnect2Service implements OnInit {

	private _httpParams: HttpParams;

	private _url : string = "http://localhost";
	private _navigationFunction = null;

	private _sc2Api = null;
	private _sc2Metadata = null;
	private _sc2Me = null;

	private _sc2AccessToken: string = null;
	private _sc2ExpiresIn: string;
	private _sc2State: string;
	private _sc2LoginUrl: string;

	public Sc2Username: string = null;
	public Sc2IsLoggedIn : boolean = false;

	constructor(
		private location: Location
	) { 
			this._sc2AccessToken = this.getUrlParameter("access_token");
			this._sc2ExpiresIn = this.getUrlParameter("expires_in");
			this.Sc2Username = this.getUrlParameter("username");
			this._sc2State = this.getUrlParameter("state");
			if (this._sc2AccessToken !== null && this._sc2AccessToken !== '') {
				localStorage.setItem('sc2_access_token', this._sc2AccessToken);
			} else {
				this._sc2AccessToken = localStorage.getItem('sc2_access_token');
			}
	
			this._sc2Api = sc2.Initialize({
				app: 'steemtool.app',
				callbackURL: this.getCallbackUrl(),
				accessToken: 'access_token',
				scope: ['vote', 'comment', 'comment_options']
			});
			this._sc2LoginUrl = this._sc2Api.getLoginURL('test');
	
			this.updateSc2Me(this._sc2AccessToken, null);
	}
	
	ngOnInit() {
	}
	
	private getUrlParameter(sParam) {
		var sPageURL = decodeURIComponent(location.search.substring(1)),
				sURLVariables = sPageURL.split('&'),
				sParameterName,
				i;

		for (i = 0; i < sURLVariables.length; i++) {
				sParameterName = sURLVariables[i].split('=');
				if (sParameterName[0] === sParam) {
						return sParameterName[1] === undefined ? true : sParameterName[1];
				}
		}
		return null;
	}

	private getCallbackUrl() {
		var url = environment.appUrl + this.location.path();
		var indexOfValue = url.indexOf("?");
		if (indexOfValue > 0) {
			url = url.substring(0, indexOfValue);
		}
		return url;
	}

	private updateSc2Me(pAccessToken, pCallback) {
		if (pAccessToken) {
			var self = this;
			this._sc2Api.setAccessToken(pAccessToken);
			this._sc2Api.me(function (err, result) {
					console.log('/me', err, result);
					if (result) {
						self._sc2Me = result;
						self.Sc2Username = result.account.name;
						self.Sc2IsLoggedIn = true;
						self._sc2Metadata = JSON.stringify(result.user_metadata, null, 2);
					} else {
						self.Sc2IsLoggedIn = false;
					}
					if (pCallback !== null && typeof pCallback === 'function') pCallback();
				});
		}
	}

	public login() {
		location.href = this._sc2LoginUrl;
	}
	
	public logout() {
		var self = this;
		this.Sc2IsLoggedIn = false;
		this._sc2Api.revokeToken(function (err, result) {
					console.log('You successfully logged out', err, result);
					self._sc2AccessToken = null;
					self._sc2ExpiresIn = null;
					self.Sc2Username = null;
					self._sc2Me = result;
					self._sc2Metadata = null;
					localStorage.removeItem('sc2_access_token');
					location.href = environment.appUrl;
				});
	}

	public createComment(parent_author, parent_permlink, author, permlink, title, body, tags, callback) {
		if (this.Sc2IsLoggedIn) {
			this._sc2Api.comment(
				parent_author, parent_permlink,
				author, permlink,// '-start',
				title, body, //'START ' +  startPrice.toFixed(3) + ' ' + selCurrency,
				{ 
					app: environment.appName,
					tags: tags                
				}, // metadata
				callback);
		} else {
			var targetUrl = `https://v2.steemconnect.com/sign/comment?parent_author=${parent_author}&parent_permlink=${parent_permlink}&permlink=${permlink}&body=${body}&json_metadata={"tags":${JSON.stringify(tags)},"app":"${environment.appName}"}&approve=1`;
			location.href = targetUrl;
		}
	}

	public broadcast(operations, callback) {
		this._sc2Api.broadcast(operations, callback);
	}

	public comment(parent_author:string, parent_permlink, author:string, permlink:string, title:string, body:string, json_metadata:string, callback) {
		this._sc2Api.comment(
			parent_author, parent_permlink,
			author, permlink,
			title,
			body,
			json_metadata,
			callback);
	}

}
