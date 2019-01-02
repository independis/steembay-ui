import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BusyIndicatorService {
	public Messages: BusyIndicatorMessage[] = [];
	public isBusy: boolean = false;
	public isIdle: boolean = true;
	public isBusyChanged:EventEmitter<boolean> = new EventEmitter<boolean>();

	private current_token: number = 0;

	constructor() {
		this.setIsBusy();
	}
	
	public add(message: string): number {
		this.current_token++;
		var busyIndicatorMessage = new BusyIndicatorMessage();
		busyIndicatorMessage.Token = this.current_token;
		busyIndicatorMessage.Message = message;
		this.Messages.push(busyIndicatorMessage);

		this.setIsBusy();

		return busyIndicatorMessage.Token;
	}
   
	public remove(token: number) {
		for (let messageIndex = 0; messageIndex < this.Messages.length; messageIndex++) {
			const message = this.Messages[messageIndex];
			if (this.Messages[messageIndex].Token === token) {
				this.Messages.splice(messageIndex,1);
				this.setIsBusy();
				return;
			}
		}
	}

	public clear() {
		this.Messages = [];
	}
	  
	private setIsBusy() {
		this.isBusy = this.Messages.length > 0;
		this.isIdle = !this.isBusy;
		this.isBusyChanged.emit(this.isBusy);  
	}
}

class BusyIndicatorMessage {
	public Token: number;
	public Message: string;
}
