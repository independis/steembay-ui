import { Component, OnInit, Renderer2 } from '@angular/core';
import { BusyIndicatorService } from '../busy-indicator.service';

@Component({
  selector: 'app-busy-indicator',
  templateUrl: './busy-indicator.component.html',
  styleUrls: ['./busy-indicator.component.css']
})
export class BusyIndicatorComponent implements OnInit {

	constructor(
		public busyIndicatorService: BusyIndicatorService,
		public renderer2: Renderer2) { }

	ngOnInit() {
		this.busyIndicatorService.isBusyChanged.subscribe((isBusy) => {
			if (isBusy) {
				this.renderer2.addClass(document.body, "modal-open");
			} else {
				this.renderer2.removeClass(document.body, "modal-open");
			}
		});
	}

}
