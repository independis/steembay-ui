import { Component, OnInit } from '@angular/core';
import { SteemConnect2Service } from '../steem-connect2.service';

@Component({
  selector: 'app-steem-connect2',
  templateUrl: './steem-connect2.component.html',
  styleUrls: ['./steem-connect2.component.css']
})
export class SteemConnect2Component implements OnInit {
    constructor(public steemConnect2Service : SteemConnect2Service) { }
    
    ngOnInit() {
    }
}
