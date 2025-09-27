// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC20.sol";

contract CypherMultiSigWallet {
    // Events
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint256 required);
    event Pause();
    event Unpause();

    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;
    bool public paused;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 timestamp;
        string description;
    }

    // mapping from tx index => owner => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    Transaction[] public transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "Transaction already confirmed");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "Owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "Invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data,
        string memory _description
    ) public onlyOwner whenNotPaused {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0,
                timestamp: block.timestamp,
                description: _description
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
        whenNotPaused
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        whenNotPaused
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "Cannot execute transaction"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        whenNotPaused
    {
        Transaction storage transaction = transactions[_txIndex];

        require(isConfirmed[_txIndex][msg.sender], "Transaction not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations,
            uint256 timestamp,
            string memory description
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations,
            transaction.timestamp,
            transaction.description
        );
    }

    // Owner management functions
    function addOwner(address _owner, uint256 _newRequirement) 
        public 
        onlyOwner 
        whenNotPaused 
    {
        require(_owner != address(0), "Invalid owner");
        require(!isOwner[_owner], "Owner already exists");
        require(_newRequirement > 0 && _newRequirement <= owners.length + 1, "Invalid requirement");

        // Submit transaction to add owner
        bytes memory data = abi.encodeWithSignature("_addOwner(address,uint256)", _owner, _newRequirement);
        submitTransaction(address(this), 0, data, "Add new owner");
    }

    function removeOwner(address _owner, uint256 _newRequirement) 
        public 
        onlyOwner 
        whenNotPaused 
    {
        require(isOwner[_owner], "Not an owner");
        require(owners.length > 1, "Cannot remove last owner");
        require(_newRequirement > 0 && _newRequirement <= owners.length - 1, "Invalid requirement");

        // Submit transaction to remove owner
        bytes memory data = abi.encodeWithSignature("_removeOwner(address,uint256)", _owner, _newRequirement);
        submitTransaction(address(this), 0, data, "Remove owner");
    }

    function changeRequirement(uint256 _newRequirement) 
        public 
        onlyOwner 
        whenNotPaused 
    {
        require(_newRequirement > 0 && _newRequirement <= owners.length, "Invalid requirement");

        // Submit transaction to change requirement
        bytes memory data = abi.encodeWithSignature("_changeRequirement(uint256)", _newRequirement);
        submitTransaction(address(this), 0, data, "Change confirmation requirement");
    }

    // Internal functions for owner management (called through multi-sig)
    function _addOwner(address _owner, uint256 _newRequirement) external {
        require(msg.sender == address(this), "Only callable by wallet");
        
        isOwner[_owner] = true;
        owners.push(_owner);
        numConfirmationsRequired = _newRequirement;
        
        emit OwnerAddition(_owner);
        emit RequirementChange(_newRequirement);
    }

    function _removeOwner(address _owner, uint256 _newRequirement) external {
        require(msg.sender == address(this), "Only callable by wallet");
        
        isOwner[_owner] = false;
        
        for (uint256 i = 0; i < owners.length - 1; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        }
        owners.pop();
        
        numConfirmationsRequired = _newRequirement;
        
        emit OwnerRemoval(_owner);
        emit RequirementChange(_newRequirement);
    }

    function _changeRequirement(uint256 _newRequirement) external {
        require(msg.sender == address(this), "Only callable by wallet");
        
        numConfirmationsRequired = _newRequirement;
        emit RequirementChange(_newRequirement);
    }

    // Emergency functions
    function pause() public onlyOwner {
        paused = true;
        emit Pause();
    }

    function unpause() public onlyOwner {
        paused = false;
        emit Unpause();
    }

    // ERC-20 token support
    function transferERC20(
        address _tokenAddress,
        address _to,
        uint256 _amount,
        string memory _description
    ) public onlyOwner whenNotPaused {
        bytes memory data = abi.encodeWithSignature(
            "transfer(address,uint256)",
            _to,
            _amount
        );
        submitTransaction(_tokenAddress, 0, data, _description);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getERC20Balance(address _tokenAddress) public view returns (uint256) {
        IERC20 token = IERC20(_tokenAddress);
        return token.balanceOf(address(this));
    }
}

// Deployment script for CypherMultiSigWallet
/*
To deploy this contract:

1. Constructor parameters:
   - _owners: Array of owner addresses, e.g., ["0x123...", "0x456...", "0x789..."]
   - _numConfirmationsRequired: Number of confirmations needed, e.g., 2 (for 2-of-3 multisig)

2. Sample deployment code:
   const CypherMultiSigWallet = await ethers.getContractFactory("CypherMultiSigWallet");
   const wallet = await CypherMultiSigWallet.deploy(
     ["0x1234567890123456789012345678901234567890", 
      "0x2345678901234567890123456789012345678901", 
      "0x3456789012345678901234567890123456789012"],
     2  // Require 2 confirmations
   );
   await wallet.deployed();
   console.log("CypherMultiSigWallet deployed to:", wallet.address);

3. Usage:
   - Submit transactions using submitTransaction()
   - Owners confirm with confirmTransaction()
   - Execute when enough confirmations with executeTransaction()
*/
