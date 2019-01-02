export class BidViewModel {
    id: number;
    author: string;
    permlink: string;
    created: Date;
    bidAmount: number;
    isStart: boolean;
    isBid: boolean;
    isBidAccepted: boolean;
    isBidOverbid: boolean;
    isBidRejected: boolean;
    isBidRevoked: boolean;
    isBidReactivated: boolean;
}