import { Injectable } from '@angular/core';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
	_timeout = 1000;
	timer = interval(this._timeout);
	
	constructor() { }
}
