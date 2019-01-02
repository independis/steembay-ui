import { BidDto } from "./bid-dto";
import { HighestBidDto } from "./highest-bid-dto";

export class AuctionDto {
    id: number;
    author: string;
    permlink: string;
    title: string;
    tags: string[];
    created: Date;
    finished: Date;
    cashout_time: Date;
    state: string;
    start_amount: number;
    currency: string;
    main_image_url: string;
    highest_bid: HighestBidDto;
    bids: BidDto[];
}
