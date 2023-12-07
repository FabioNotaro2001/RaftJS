/**
 * Enumerator for types of commands.
 */
export const CommandType = Object.freeze({
    NEW_USER: "new_user",
    NEW_BID: "new_bid",
    GET_AUCTION_INFO: "get_auction_info",
    NEW_AUCTION: "new_auction",
    LOGIN: "login",
    CLOSE_AUCTION: "close_auction",
    GET_ALL_OPEN_AUCTIONS: "get_all_open_auctions",
    GET_NEW_BIDS: "get_new_bids",
    GET_USER_AUCTIONS: "get_user_auctions",
    GET_USER_PARTICIPATIONS: "get_user_participations",
    GET_LAST_N_BIDS: "get_last_n_bids",
});