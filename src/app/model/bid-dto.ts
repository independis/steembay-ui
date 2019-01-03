export class BidDto {
    id: number;
    author: string;
    permlink: string;
    created: Date;
    bid_Amount: number;
    isStart: boolean;
    isBid: boolean;
    isBidAccepted: boolean;
    isBidOverbid: boolean;
    isBidRejected: boolean;
    isBidRevoked: boolean;
    isBidReactivated: boolean;
}
