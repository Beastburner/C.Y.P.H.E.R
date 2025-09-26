// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CypherNFT
 * @dev NFT contract for Cypher ecosystem
 * Features:
 * - ERC-721 compliant NFTs
 * - Mintable with metadata
 * - Royalties support (EIP-2981)
 * - Batch operations
 * - Marketplace integration
 */

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);
}

contract CypherNFT is IERC721, IERC721Metadata, IERC2981, IERC165 {
    // Token name
    string private _name;
    
    // Token symbol
    string private _symbol;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Owner of the contract
    address public owner;
    
    // Current token ID counter
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;
    
    // Mapping owner address to token count
    mapping(address => uint256) private _balances;
    
    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;
    
    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // Mapping from token ID to metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Royalty info
    struct RoyaltyInfo {
        address recipient;
        uint256 amount; // Basis points (100 = 1%)
    }
    
    mapping(uint256 => RoyaltyInfo) private _royalties;
    RoyaltyInfo private _defaultRoyalty;
    
    // Minting fee
    uint256 public mintingFee = 0.01 ether;
    bool public mintingEnabled = true;
    uint256 public maxSupply = 10000;
    
    // Events
    event Mint(address indexed to, uint256 indexed tokenId, string tokenURI);
    event RoyaltySet(uint256 indexed tokenId, address recipient, uint256 amount);
    event DefaultRoyaltySet(address recipient, uint256 amount);
    event MintingFeeUpdated(uint256 oldFee, uint256 newFee);
    event MintingToggled(bool enabled);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier mintingAllowed() {
        require(mintingEnabled, "Minting is disabled");
        require(_tokenIdCounter < maxSupply, "Max supply reached");
        _;
    }
    
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address owner_
    ) {
        _name = name_;
        _symbol = symbol_;
        _baseTokenURI = baseTokenURI_;
        owner = owner_ != address(0) ? owner_ : msg.sender;
        _tokenIdCounter = 1; // Start from 1
    }
    
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC2981).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
    
    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner_) public view virtual override returns (uint256) {
        require(owner_ != address(0), "ERC721: address zero is not a valid owner");
        return _balances[owner_];
    }
    
    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner_ = _ownerOf(tokenId);
        require(owner_ != address(0), "ERC721: invalid token ID");
        return owner_;
    }
    
    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }
    
    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }
    
    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, _toString(tokenId))) : "";
    }
    
    /**
     * @dev Base URI for computing {tokenURI}.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) public virtual override {
        address owner_ = ownerOf(tokenId);
        require(to != owner_, "ERC721: approval to current owner");
        require(
            msg.sender == owner_ || isApprovedForAll(owner_, msg.sender),
            "ERC721: approve caller is not token owner or approved for all"
        );
        
        _approve(to, tokenId);
    }
    
    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        _requireMinted(tokenId);
        return _tokenApprovals[tokenId];
    }
    
    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        _setApprovalForAll(msg.sender, operator, approved);
    }
    
    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner_, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner_][operator];
    }
    
    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }
    
    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }
    
    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }
    
    /**
     * @dev Mint a new NFT
     */
    function mint(address to, string memory tokenURI_) public payable mintingAllowed returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient minting fee");
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        
        emit Mint(to, tokenId, tokenURI_);
        return tokenId;
    }
    
    /**
     * @dev Batch mint NFTs
     */
    function batchMint(address to, string[] memory tokenURIs) public payable mintingAllowed returns (uint256[] memory) {
        require(msg.value >= mintingFee * tokenURIs.length, "Insufficient minting fee");
        require(to != address(0), "Cannot mint to zero address");
        require(_tokenIdCounter + tokenURIs.length <= maxSupply, "Would exceed max supply");
        
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            tokenIds[i] = tokenId;
            emit Mint(to, tokenId, tokenURIs[i]);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Owner mint (free)
     */
    function ownerMint(address to, string memory tokenURI_) public onlyOwner mintingAllowed returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        
        emit Mint(to, tokenId, tokenURI_);
        return tokenId;
    }
    
    /**
     * @dev Set royalty for specific token
     */
    function setTokenRoyalty(uint256 tokenId, address recipient, uint256 amount) public {
        require(_isApprovedOrOwner(msg.sender, tokenId) || msg.sender == owner, "Not authorized");
        require(amount <= 1000, "Royalty too high"); // Max 10%
        
        _royalties[tokenId] = RoyaltyInfo(recipient, amount);
        emit RoyaltySet(tokenId, recipient, amount);
    }
    
    /**
     * @dev Set default royalty for all tokens
     */
    function setDefaultRoyalty(address recipient, uint256 amount) public onlyOwner {
        require(amount <= 1000, "Royalty too high"); // Max 10%
        
        _defaultRoyalty = RoyaltyInfo(recipient, amount);
        emit DefaultRoyaltySet(recipient, amount);
    }
    
    /**
     * @dev See {IERC2981-royaltyInfo}.
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        public
        view
        virtual
        override
        returns (address, uint256)
    {
        RoyaltyInfo memory royalty = _royalties[tokenId];
        
        if (royalty.recipient == address(0)) {
            royalty = _defaultRoyalty;
        }
        
        uint256 royaltyAmount = (salePrice * royalty.amount) / 10000;
        return (royalty.recipient, royaltyAmount);
    }
    
    /**
     * @dev Get total supply (minted tokens)
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Check if token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Get all tokens owned by an address
     */
    function tokensOfOwner(address owner_) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner_);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 index = 0;
        
        for (uint256 tokenId = 1; tokenId < _tokenIdCounter && index < tokenCount; tokenId++) {
            if (_ownerOf(tokenId) == owner_) {
                tokenIds[index] = tokenId;
                index++;
            }
        }
        
        return tokenIds;
    }
    
    // Admin functions
    function setBaseURI(string memory baseTokenURI_) public onlyOwner {
        _baseTokenURI = baseTokenURI_;
    }
    
    function setMintingFee(uint256 newFee) public onlyOwner {
        uint256 oldFee = mintingFee;
        mintingFee = newFee;
        emit MintingFeeUpdated(oldFee, newFee);
    }
    
    function toggleMinting() public onlyOwner {
        mintingEnabled = !mintingEnabled;
        emit MintingToggled(mintingEnabled);
    }
    
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= totalSupply(), "Cannot reduce below current supply");
        maxSupply = newMaxSupply;
    }
    
    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
    
    // Internal functions
    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }
    
    function _requireMinted(uint256 tokenId) internal view virtual {
        require(_ownerOf(tokenId) != address(0), "ERC721: invalid token ID");
    }
    
    function _setTokenURI(uint256 tokenId, string memory tokenURI_) internal virtual {
        require(_ownerOf(tokenId) != address(0), "ERC721: URI set of nonexistent token");
        _tokenURIs[tokenId] = tokenURI_;
    }
    
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        address owner_ = ownerOf(tokenId);
        return (spender == owner_ || isApprovedForAll(owner_, spender) || getApproved(tokenId) == spender);
    }
    
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }
    
    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
        require(
            _checkOnERC721Received(address(0), to, tokenId, data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }
    
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!exists(tokenId), "ERC721: token already minted");
        
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(address(0), to, tokenId);
    }
    
    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        
        // Clear approvals from the previous owner
        delete _tokenApprovals[tokenId];
        
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    
    function _setApprovalForAll(address owner_, address operator, bool approved) internal virtual {
        require(owner_ != operator, "ERC721: approve to caller");
        _operatorApprovals[owner_][operator] = approved;
        emit ApprovalForAll(owner_, operator, approved);
    }
    
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }
    
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}
