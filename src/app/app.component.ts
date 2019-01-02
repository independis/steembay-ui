import { Component, OnInit } from '@angular/core';
import { BusyIndicatorService } from './busy-indicator.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(public busyIndicatorService : BusyIndicatorService) { }

	title = 'steembay UI';
}
