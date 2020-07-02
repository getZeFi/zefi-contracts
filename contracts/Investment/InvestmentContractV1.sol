pragma solidity ^0.5.10;
pragma experimental ABIEncoderV2;

//import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
//import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

import './InvestmentContractBase.sol';
import './IInvestmentContract.sol';

interface CDai {
  function mint(uint amount) external returns(uint);
  function redeemUnderlying(uint amount) external;
  function balanceOf(address owner) external view returns(uint);
  function balanceOfUnderlying(address owner) external view returns(uint);
}

interface ICToken {
  function mint(uint amount) external returns(uint);
  function redeemUnderlying(uint amount) external;
  function balanceOf(address owner) external view returns(uint);
  function balanceOfUnderlying(address owner) external view returns(uint);
}

//contract InvestmentContractV1 {
contract InvestmentContractV1 is InvestmentContractBase, IInvestmentContract {

  struct Target {
    IERC20 token;
    ICToken cToken;
    uint totalTokenInvested;
  }
  Target[] public targets;

  event TokenTransactionExecuted(address indexed sender, bool indexed success);
  event TokenApprovalExecuted(address indexed sender, bool indexed success);

  constructor(
    address[] memory _tokens, 
    address[] memory _cTokens, 
    address _zefiWallet
  ) public {
    require(_tokens.length == _cTokens.length, 'tokens and cTokens must have same length');
    for(uint i = 0; i < _tokens.length; i++) {
      targets.push(Target(
        IERC20(_tokens[i]),
        ICToken(_cTokens[i]),
        0
      ));
    }
    zefiWallet = _zefiWallet;
  }

  function depositAll() external {
    for(uint i = 0; i < targets.length; i++) {
      _depositAll(targets[i]);
    }
  }

  function _depositAll(Target storage target) internal {
    //1. get token balance of caller
    uint amount = target.token.balanceOf(msg.sender);
    if(amount == 0) return;

    //2. update how much token was invested
    address tokenAddress = address(target.token);
    tokenInvested[tokenAddress][msg.sender] = tokenInvested[tokenAddress][msg.sender].add(amount);
    target.totalTokenInvested = target.totalTokenInvested.add(amount);

    //3. send token to this contract
    bool success = target.token.transferFrom(msg.sender, address(this), amount);
    emit TokenTransactionExecuted(msg.sender, success);
    //4. Approve token to be sent to compound
    success = target.token.approve(address(target.cToken), amount);
    emit TokenApprovalExecuted(msg.sender, success);
    //5. send token to cToken
    assert(target.cToken.mint(amount) == 0);
  }

  function withdrawAll() external {
    for(uint i = 0; i < targets.length; i++) {
      _withdrawAll(targets[i]);
    }
  }
  function _withdrawAll(Target storage target) internal {
    address tokenAddress = address(target.token);
    //1. withdraw token from cToken
    uint tokenBalance = target.cToken.balanceOfUnderlying(address(this));
    uint amount = tokenBalance
      .mul(tokenInvested[tokenAddress][msg.sender])
      .div(target.totalTokenInvested);
    target.cToken.redeemUnderlying(amount);

    //2. transfer fee
    uint fee = calculateFee(tokenAddress, amount);
    bool success = target.token.transfer(zefiWallet, fee); 
    emit TokenTransactionExecuted(msg.sender, success);

    //3. update internal token balance
    target.totalTokenInvested = target.totalTokenInvested
      .sub(tokenInvested[tokenAddress][msg.sender]);
    tokenInvested[tokenAddress][msg.sender] = 0;

    //4. transfer token to caller 
    success = target.token.transfer(msg.sender, amount.sub(fee));
    emit TokenTransactionExecuted(msg.sender, success);
  }

  function getTokenAddresses() external view returns(address[] memory) {
    address[] memory addresses = new address[](targets.length);
    for(uint i = 0; i < targets.length; i++) {
      addresses[i] = address(targets[i].token);
    }
    return addresses;
  }

  function calculateFee(address token, uint amount) public view returns(uint) {
    uint interest = amount.sub(tokenInvested[token][msg.sender]);
    return interest.mul(FEE).div(BASIS_POINT_DENOMINATOR);
  }

  function balanceOf(address owner) external view returns(uint[] memory) {
    uint[] memory balances = new uint[](targets.length);
    for(uint i = 0; i < targets.length; i++) {
      balances[i] = _balanceOf(targets[i], owner);
    }
    return balances;
  }

  function _balanceOf(Target storage target, address owner) internal view returns(uint) {
    uint tokenBalance = target.cToken.balanceOfUnderlying(address(this));
    address tokenAddress = address(target.token);
    uint amount = tokenBalance
      .mul(tokenInvested[tokenAddress][owner])
      .div(target.totalTokenInvested);
    uint fee = calculateFee(tokenAddress, amount);
    return amount.sub(fee);
  }
}
