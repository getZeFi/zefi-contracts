pragma solidity ^0.5.10;

import './InvestmentContractBase.sol';
import './IInvestmentContract.sol';

contract IYToken {
  function deposit(uint256 _amount) external;
  function withdraw(uint256 _shares) external;
  function getPricePerFullShare() public view returns (uint);
  function balanceOf(address account) public view returns (uint256);
}

contract InvestmentContractV2 is InvestmentContractBase, IInvestmentContract {

  struct Target {
    IERC20 token;
    IYToken yToken;
    uint totalTokenInvested;
  }
  Target[] public targets;

  constructor(
    address[] memory _tokens, 
    address[] memory _yTokens, 
    address _zefiWallet
  ) public {
    require(_tokens.length == _yTokens.length, 'tokens and yTokens must have same length');
    for(uint i = 0; i < _tokens.length; i++) {
      targets.push(Target(
        IERC20(_tokens[i]),
        IYToken(_yTokens[i]),
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

    //2. send token to this contract
    target.token.transferFrom(msg.sender, address(this), amount);

    //3. update how much token was invested
    address tokenAddress = address(target.token);
    tokenInvested[tokenAddress][msg.sender] = tokenInvested[tokenAddress][msg.sender].add(amount);
    target.totalTokenInvested = target.totalTokenInvested.add(amount);

    //4. Approve token to be sent to yToken
    target.token.approve(address(target.yToken), amount);

    //5. send token to yToken
    target.yToken.deposit(amount);
  }

  function withdrawAll() external {
    for(uint i = 0; i < targets.length; i++) {
      _withdrawAll(targets[i]);
    }
  }
  function _withdrawAll(Target storage target) internal {
    address tokenAddress = address(target.token);
    //1. withdraw token from yToken
    uint yTokenBalance = target.yToken.balanceOf(address(this));
    uint price = target.yToken.getPricePerFullShare();
    uint tokenEarnedBalance = yTokenBalance.mul(price).div(1 ether);
    uint amount = tokenEarnedBalance
      .mul(tokenInvested[tokenAddress][msg.sender])
      .div(target.totalTokenInvested);
    target.yToken.withdraw(amount.mul(1 ether).div(price));

    //2. transfer fee
    uint fee = calculateFee(tokenAddress, amount);
    target.token.transfer(zefiWallet, fee); 

    //3. transfer token to caller 
    target.token.transfer(msg.sender, amount.sub(fee));
    //target.token.transfer(msg.sender, amount.mul(1 ether).div(price).sub(fee));
   
    //4. update internal token balance
    target.totalTokenInvested = target.totalTokenInvested
      .sub(tokenInvested[tokenAddress][msg.sender]);
    tokenInvested[tokenAddress][msg.sender] = 0;
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
    uint tokenBalance = _balanceOfUnderlying(target.yToken);
    address tokenAddress = address(target.token);
    uint amount = tokenBalance
      .mul(tokenInvested[tokenAddress][owner])
      .div(target.totalTokenInvested);
    uint fee = calculateFee(tokenAddress, amount);
    return amount.sub(fee);
  }

  function _balanceOfUnderlying(IYToken yToken) internal view returns(uint) {
    uint pricePerShare = yToken.getPricePerFullShare();
    uint yTokenAmount = yToken.balanceOf(address(this));
    return yTokenAmount.mul(pricePerShare).div(1 ether); //getPricePerFullShare() is scaled up by 1 ether 
  }
}

