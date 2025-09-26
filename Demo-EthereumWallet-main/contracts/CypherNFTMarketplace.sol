// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CypherNFTMarketplace
 * @dev NFT marketplace for trading Cypher ecosystem NFTs
 * Features:
 * - Buy/sell NFTs with ETH and ECLP tokens
 * - Auction functionality
 * - Royalty distribution
 * - Collection verification
 * - Offer system
 */

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);
}

contract CypherNFTMarketplace {
    address public owner;
    address public eclpToken; // ECLP token address
    uint256 public marketplaceFee = 250; // 2.5% in basis points
    address public feeRecipient;
    bool public paused = false;
    
    // Listing structure
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address paymentToken; // address(0) for ETH
        bool active;
        uint256 listedAt;
        uint256 expiresAt;
    }
    
    // Auction structure
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startPrice;
        uint256 currentBid;
        address currentBidder;
        address paymentToken;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool settled;
    }
    
    // Offer structure
    struct Offer {
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        address paymentToken;
        uint256 expiresAt;
        bool active;
    }
    
    // Storage
    mapping(bytes32 => Listing) public listings;
    mapping(bytes32 => Auction) public auctions;
    mapping(bytes32 => Offer) public offers;
    mapping(address => bool) public verifiedCollections;
    mapping(address => uint256) public userEscrow; // For failed auction bids
    
    // Arrays for enumeration
    bytes32[] public activeListings;
    bytes32[] public activeAuctions;
    bytes32[] public activeOffers;
    
    // Events
    event ItemListed(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    );
    
    event ItemSold(
        bytes32 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        address paymentToken
    );
    
    event ListingCancelled(bytes32 indexed listingId, address indexed seller);
    
    event AuctionCreated(
        bytes32 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endTime
    );
    
    event BidPlaced(
        bytes32 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionSettled(
        bytes32 indexed auctionId,
        address indexed winner,
        uint256 finalPrice
    );
    
    event OfferMade(
        bytes32 indexed offerId,
        address indexed buyer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event OfferAccepted(
        bytes32 indexed offerId,
        address indexed seller,
        uint256 price
    );
    
    event CollectionVerified(address indexed collection, bool verified);
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Marketplace is paused");
        _;
    }
    
    modifier validNFT(address nftContract, uint256 tokenId) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(IERC721(nftContract).ownerOf(tokenId) != address(0), "NFT does not exist");
        _;
    }
    
    constructor(address _eclpToken, address _feeRecipient) {
        owner = msg.sender;
        eclpToken = _eclpToken;
        feeRecipient = _feeRecipient != address(0) ? _feeRecipient : msg.sender;
    }
    
    /**
     * @dev Create a fixed-price listing
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken,
        uint256 duration
    ) external whenNotPaused validNFT(nftContract, tokenId) returns (bytes32) {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(duration > 0 && duration <= 365 days, "Invalid duration");
        
        // Check approval
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "NFT not approved for marketplace"
        );
        
        bytes32 listingId = keccak256(abi.encodePacked(
            nftContract,
            tokenId,
            msg.sender,
            block.timestamp
        ));
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            paymentToken: paymentToken,
            active: true,
            listedAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });
        
        activeListings.push(listingId);
        
        emit ItemListed(listingId, msg.sender, nftContract, tokenId, price, paymentToken);
        return listingId;
    }
    
    /**
     * @dev Buy an NFT from a listing
     */
    function buyNFT(bytes32 listingId) external payable whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(block.timestamp <= listing.expiresAt, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        
        uint256 totalPrice = listing.price;
        
        // Handle payment
        if (listing.paymentToken == address(0)) {
            // ETH payment
            require(msg.value >= totalPrice, "Insufficient payment");
        } else {
            // ERC20 payment
            require(msg.value == 0, "ETH not accepted for this listing");
            require(
                IERC20(listing.paymentToken).transferFrom(msg.sender, address(this), totalPrice),
                "Payment transfer failed"
            );
        }
        
        // Transfer NFT
        IERC721(listing.nftContract).transferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        // Calculate and distribute fees
        _distributeSaleProceeds(
            listing.nftContract,
            listing.tokenId,
            totalPrice,
            listing.paymentToken,
            listing.seller
        );
        
        // Deactivate listing
        listing.active = false;
        _removeFromActiveListings(listingId);
        
        // Refund excess ETH
        if (listing.paymentToken == address(0) && msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit ItemSold(listingId, msg.sender, listing.seller, totalPrice, listing.paymentToken);
    }
    
    /**
     * @dev Cancel a listing
     */
    function cancelListing(bytes32 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender || msg.sender == owner, "Not authorized");
        
        listing.active = false;
        _removeFromActiveListings(listingId);
        
        emit ListingCancelled(listingId, listing.seller);
    }
    
    /**
     * @dev Create an auction
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        address paymentToken,
        uint256 duration
    ) external whenNotPaused validNFT(nftContract, tokenId) returns (bytes32) {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(startPrice > 0, "Start price must be greater than 0");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");
        
        // Check approval
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "NFT not approved for marketplace"
        );
        
        // Transfer NFT to marketplace for escrow
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        bytes32 auctionId = keccak256(abi.encodePacked(
            nftContract,
            tokenId,
            msg.sender,
            block.timestamp
        ));
        
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startPrice: startPrice,
            currentBid: 0,
            currentBidder: address(0),
            paymentToken: paymentToken,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true,
            settled: false
        });
        
        activeAuctions.push(auctionId);
        
        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startPrice, block.timestamp + duration);
        return auctionId;
    }
    
    /**
     * @dev Place a bid on an auction
     */
    function placeBid(bytes32 auctionId, uint256 bidAmount) external payable whenNotPaused {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Cannot bid on your own auction");
        
        uint256 requiredBid = auction.currentBid == 0 ? auction.startPrice : auction.currentBid + (auction.currentBid / 20); // 5% increment
        require(bidAmount >= requiredBid, "Bid too low");
        
        // Handle payment
        if (auction.paymentToken == address(0)) {
            // ETH payment
            require(msg.value >= bidAmount, "Insufficient payment");
        } else {
            // ERC20 payment
            require(msg.value == 0, "ETH not accepted for this auction");
            require(
                IERC20(auction.paymentToken).transferFrom(msg.sender, address(this), bidAmount),
                "Payment transfer failed"
            );
        }
        
        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            if (auction.paymentToken == address(0)) {
                userEscrow[auction.currentBidder] += auction.currentBid;
            } else {
                require(
                    IERC20(auction.paymentToken).transfer(auction.currentBidder, auction.currentBid),
                    "Refund failed"
                );
            }
        }
        
        auction.currentBid = bidAmount;
        auction.currentBidder = msg.sender;
        
        // Extend auction if bid placed in last 10 minutes
        if (auction.endTime - block.timestamp < 10 minutes) {
            auction.endTime = block.timestamp + 10 minutes;
        }
        
        // Refund excess ETH
        if (auction.paymentToken == address(0) && msg.value > bidAmount) {
            payable(msg.sender).transfer(msg.value - bidAmount);
        }
        
        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }
    
    /**
     * @dev Settle an auction
     */
    function settleAuction(bytes32 auctionId) external whenNotPaused {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Auction already settled");
        
        auction.active = false;
        auction.settled = true;
        _removeFromActiveAuctions(auctionId);
        
        if (auction.currentBidder != address(0)) {
            // Transfer NFT to winner
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.currentBidder,
                auction.tokenId
            );
            
            // Distribute proceeds
            _distributeSaleProceeds(
                auction.nftContract,
                auction.tokenId,
                auction.currentBid,
                auction.paymentToken,
                auction.seller
            );
            
            emit AuctionSettled(auctionId, auction.currentBidder, auction.currentBid);
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
            
            emit AuctionSettled(auctionId, address(0), 0);
        }
    }
    
    /**
     * @dev Make an offer on an NFT
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken,
        uint256 duration
    ) external payable whenNotPaused validNFT(nftContract, tokenId) returns (bytes32) {
        require(price > 0, "Price must be greater than 0");
        require(duration > 0 && duration <= 30 days, "Invalid duration");
        require(IERC721(nftContract).ownerOf(tokenId) != msg.sender, "Cannot offer on your own NFT");
        
        // Handle payment escrow
        if (paymentToken == address(0)) {
            require(msg.value >= price, "Insufficient payment");
        } else {
            require(msg.value == 0, "ETH not accepted for this offer");
            require(
                IERC20(paymentToken).transferFrom(msg.sender, address(this), price),
                "Payment transfer failed"
            );
        }
        
        bytes32 offerId = keccak256(abi.encodePacked(
            nftContract,
            tokenId,
            msg.sender,
            block.timestamp
        ));
        
        offers[offerId] = Offer({
            buyer: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            paymentToken: paymentToken,
            expiresAt: block.timestamp + duration,
            active: true
        });
        
        activeOffers.push(offerId);
        
        emit OfferMade(offerId, msg.sender, nftContract, tokenId, price);
        return offerId;
    }
    
    /**
     * @dev Accept an offer
     */
    function acceptOffer(bytes32 offerId) external whenNotPaused {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");
        require(block.timestamp <= offer.expiresAt, "Offer expired");
        require(
            IERC721(offer.nftContract).ownerOf(offer.tokenId) == msg.sender,
            "Not the owner"
        );
        
        // Check approval
        require(
            IERC721(offer.nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(offer.nftContract).getApproved(offer.tokenId) == address(this),
            "NFT not approved for marketplace"
        );
        
        // Transfer NFT
        IERC721(offer.nftContract).transferFrom(
            msg.sender,
            offer.buyer,
            offer.tokenId
        );
        
        // Distribute proceeds
        _distributeSaleProceeds(
            offer.nftContract,
            offer.tokenId,
            offer.price,
            offer.paymentToken,
            msg.sender
        );
        
        offer.active = false;
        _removeFromActiveOffers(offerId);
        
        emit OfferAccepted(offerId, msg.sender, offer.price);
    }
    
    /**
     * @dev Distribute sale proceeds including fees and royalties
     */
    function _distributeSaleProceeds(
        address nftContract,
        uint256 tokenId,
        uint256 totalPrice,
        address paymentToken,
        address seller
    ) internal {
        uint256 remaining = totalPrice;
        
        // Calculate marketplace fee
        uint256 marketplaceFeeAmount = (totalPrice * marketplaceFee) / 10000;
        remaining -= marketplaceFeeAmount;
        
        // Calculate royalty
        uint256 royaltyAmount = 0;
        address royaltyRecipient = address(0);
        
        try IERC2981(nftContract).royaltyInfo(tokenId, totalPrice) returns (
            address recipient,
            uint256 amount
        ) {
            if (recipient != address(0) && amount > 0 && amount <= totalPrice / 10) { // Max 10% royalty
                royaltyAmount = amount;
                royaltyRecipient = recipient;
                remaining -= royaltyAmount;
            }
        } catch {
            // No royalty support
        }
        
        // Transfer payments
        if (paymentToken == address(0)) {
            // ETH transfers
            if (marketplaceFeeAmount > 0) {
                payable(feeRecipient).transfer(marketplaceFeeAmount);
            }
            if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
                payable(royaltyRecipient).transfer(royaltyAmount);
            }
            if (remaining > 0) {
                payable(seller).transfer(remaining);
            }
        } else {
            // ERC20 transfers
            if (marketplaceFeeAmount > 0) {
                require(IERC20(paymentToken).transfer(feeRecipient, marketplaceFeeAmount), "Fee transfer failed");
            }
            if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
                require(IERC20(paymentToken).transfer(royaltyRecipient, royaltyAmount), "Royalty transfer failed");
            }
            if (remaining > 0) {
                require(IERC20(paymentToken).transfer(seller, remaining), "Seller payment failed");
            }
        }
    }
    
    /**
     * @dev Withdraw escrowed funds
     */
    function withdrawEscrow() external {
        uint256 amount = userEscrow[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        userEscrow[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
    // Array management functions
    function _removeFromActiveListings(bytes32 listingId) internal {
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == listingId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }
    
    function _removeFromActiveAuctions(bytes32 auctionId) internal {
        for (uint256 i = 0; i < activeAuctions.length; i++) {
            if (activeAuctions[i] == auctionId) {
                activeAuctions[i] = activeAuctions[activeAuctions.length - 1];
                activeAuctions.pop();
                break;
            }
        }
    }
    
    function _removeFromActiveOffers(bytes32 offerId) internal {
        for (uint256 i = 0; i < activeOffers.length; i++) {
            if (activeOffers[i] == offerId) {
                activeOffers[i] = activeOffers[activeOffers.length - 1];
                activeOffers.pop();
                break;
            }
        }
    }
    
    // Admin functions
    function verifyCollection(address collection, bool verified) external onlyOwner {
        verifiedCollections[collection] = verified;
        emit CollectionVerified(collection, verified);
    }
    
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = marketplaceFee;
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(oldFee, newFee);
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
    
    // View functions
    function getActiveListings() external view returns (bytes32[] memory) {
        return activeListings;
    }
    
    function getActiveAuctions() external view returns (bytes32[] memory) {
        return activeAuctions;
    }
    
    function getActiveOffers() external view returns (bytes32[] memory) {
        return activeOffers;
    }
    
    function isCollectionVerified(address collection) external view returns (bool) {
        return verifiedCollections[collection];
    }
    
    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else {
            IERC20(token).transfer(owner, amount);
        }
    }
}
