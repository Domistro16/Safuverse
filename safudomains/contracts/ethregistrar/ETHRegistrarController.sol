// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {BaseRegistrarImplementation} from "./BaseRegistrarImplementation.sol";
import {StringUtils} from "../utils/StringUtils.sol";
import {Resolver} from "../resolvers/Resolver.sol";
import {ENS} from "../registry/ENS.sol";
import {ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";
import {ReverseClaimer} from "../reverseRegistrar/ReverseClaimer.sol";
import {IETHRegistrarController, IPriceOracle} from "./IETHRegistrarController.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {INameWrapper} from "../wrapper/INameWrapper.sol";
import {ERC20Recoverable} from "../utils/ERC20Recoverable.sol";
import {TokenPriceOracle} from "./TokenPriceOracle.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReferralVerifier} from "./ReferralVerifier.sol";
import {Airdrop} from "./Airdrop.sol";

error CommitmentTooNew(bytes32 commitment);
error CommitmentTooOld(bytes32 commitment);
error NameNotAvailable(string name);
error DurationTooShort(uint256 duration);
error ResolverRequiredWhenDataSupplied();
error UnexpiredCommitmentExists(bytes32 commitment);
error InsufficientValue();
error MaxCommitmentAgeTooLow();
error MaxCommitmentAgeTooHigh();

contract ETHRegistrarController is
    Ownable,
    IETHRegistrarController,
    IERC165,
    ERC20Recoverable,
    ReverseClaimer
{
    using StringUtils for *;
    using Address for address;
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;
    uint256 private constant LIFETIME_DURATION = 31536000000;
    uint256 private constant MAX_REFERRAL_PCT = 30; // Max we might send to referral contract
    bytes32 private constant ETH_NODE =
        0xf92e9539a836c60f519caef3f817b823139813f56a7a19c9621f7b47f35b340d;

    // ============ Immutables ============
    BaseRegistrarImplementation public immutable base;
    uint256 public immutable minCommitmentAge;
    uint256 public immutable maxCommitmentAge;
    ReverseRegistrar public immutable reverseRegistrar;
    INameWrapper public immutable nameWrapper;

    // ============ State ============
    TokenPriceOracle public prices;
    ReferralVerifier public referralVerifier;
    address public backendWallet;
    address public infoFi;
    Airdrop public airdrop;
    bool public useAirdrop;
    uint256 public mints;
    uint256 public untrackedInfoFi;

    mapping(bytes32 => uint256) public commitments;
    mapping(address => Token) public verifiedTokens;

    struct Token {
        string token;
        address tokenAddress;
    }

    // ============ Events ============
    event NameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 baseCost,
        uint256 premium,
        uint256 expires
    );
    event NameRenewed(
        string name,
        bytes32 indexed label,
        uint256 cost,
        uint256 expires
    );

    // ============ Modifiers ============
    modifier onlyBackend() {
        require(msg.sender == backendWallet, "Not Backend");
        _;
    }

    constructor(
        BaseRegistrarImplementation _base,
        TokenPriceOracle _prices,
        uint256 _minCommitmentAge,
        uint256 _maxCommitmentAge,
        ReverseRegistrar _reverseRegistrar,
        INameWrapper _nameWrapper,
        ENS _ens,
        ReferralVerifier _referralVerifier
    ) ReverseClaimer(_ens, msg.sender) {
        if (_maxCommitmentAge <= _minCommitmentAge) {
            revert MaxCommitmentAgeTooLow();
        }
        if (_maxCommitmentAge > block.timestamp) {
            revert MaxCommitmentAgeTooHigh();
        }

        base = _base;
        prices = _prices;
        minCommitmentAge = _minCommitmentAge;
        maxCommitmentAge = _maxCommitmentAge;
        reverseRegistrar = _reverseRegistrar;
        nameWrapper = _nameWrapper;
        referralVerifier = _referralVerifier;
    }

    // ============ Admin ============

    function setAirdrop(Airdrop _airdrop) external onlyOwner {
        airdrop = _airdrop;
    }

    function controlAirdrop(bool enabled) external onlyOwner {
        useAirdrop = enabled;
    }

    function setBackend(address wallet) external onlyOwner {
        backendWallet = wallet;
    }

    function setOracle(address oracle) external onlyOwner {
        prices = TokenPriceOracle(oracle);
    }

    function setReferralVerifier(address _verifier) external onlyOwner {
        referralVerifier = ReferralVerifier(payable(_verifier));
    }

    function setToken(Token memory token, address tokenAddress) external onlyOwner {
        verifiedTokens[tokenAddress] = token;
    }

    function removeToken(address tokenAddress) external onlyOwner {
        delete verifiedTokens[tokenAddress];
    }

    function setInfoFi(address _infoFi) external onlyOwner {
        infoFi = _infoFi;
    }

    // ============ View Functions ============

    function rentPrice(
        string memory name,
        uint256 duration,
        bool lifetime
    ) public view returns (IPriceOracle.Price memory price) {
        require(
            duration == 0 || duration >= MIN_REGISTRATION_DURATION,
            "Invalid duration"
        );
        bytes32 label = keccak256(bytes(name));
        price = prices.price(
            name,
            base.nameExpires(uint256(label)),
            duration,
            lifetime
        );
    }

    function rentPriceToken(
        string memory name,
        uint256 duration,
        string memory token,
        bool lifetime
    ) public view returns (IPriceOracle.Price memory price) {
        require(
            duration == 0 || duration >= MIN_REGISTRATION_DURATION,
            "Invalid duration"
        );
        bytes32 label = keccak256(bytes(name));
        price = prices.priceToken(
            name,
            base.nameExpires(uint256(label)),
            duration,
            token,
            lifetime
        );
    }

    function valid(string memory name) public pure returns (bool) {
        return name.strlen() >= 2;
    }

    function available(string memory name) public view returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }

    function makeCommitment(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool lifetime
    ) public pure returns (bytes32) {
        bytes32 label = keccak256(bytes(name));
        if (data.length > 0 && resolver == address(0)) {
            revert ResolverRequiredWhenDataSupplied();
        }
        return keccak256(
            abi.encode(
                label,
                owner,
                duration,
                secret,
                resolver,
                data,
                reverseRecord,
                ownerControlledFuses,
                lifetime
            )
        );
    }

    function commit(bytes32 commitment) public {
        if (commitments[commitment] + maxCommitmentAge >= block.timestamp) {
            revert UnexpiredCommitmentExists(commitment);
        }
        commitments[commitment] = block.timestamp;
    }

    // ============ Registration Functions ============

    function register(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool lifetime,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external payable {
        if (lifetime) {
            duration = LIFETIME_DURATION;
        }

        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        uint256 totalPrice = price.base + price.premium;
        
        if (msg.value < totalPrice) {
            revert InsufficientValue();
        }

        _consumeCommitment(
            name,
            duration,
            makeCommitment(
                name,
                owner,
                duration,
                secret,
                resolver,
                data,
                reverseRecord,
                ownerControlledFuses,
                lifetime
            )
        );

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
        }

        _updatePoints(name, duration, owner, lifetime);

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price.base,
            price.premium,
            expires
        );

        // Handle referral
        _processReferral(referralData, referralSignature, totalPrice, address(0), false);

        // Refund excess
        if (msg.value > totalPrice) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(success, "Refund failed");
        }

        mints++;
    }

    function registerWithCard(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool lifetime,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external onlyBackend {
        if (lifetime) {
            duration = LIFETIME_DURATION;
        }

        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        uint256 totalPrice = price.base + price.premium;

        _consumeCommitment(
            name,
            duration,
            makeCommitment(
                name,
                owner,
                duration,
                secret,
                resolver,
                data,
                reverseRecord,
                ownerControlledFuses,
                lifetime
            )
        );

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, owner);
        }

        _updatePoints(name, duration, owner, lifetime);

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price.base,
            price.premium,
            expires
        );

        // Handle referral (fiat = tracked separately)
        if (mints > 1000) {
            _processReferral(referralData, referralSignature, totalPrice, address(0), true);
        }

        untrackedInfoFi += (totalPrice * 35) / 100;
        mints++;
    }

    function registerWithToken(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] memory data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool lifetime,
        address tokenAddress,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external {
        require(
            verifiedTokens[tokenAddress].tokenAddress != address(0),
            "Unaccepted Token"
        );

        Token memory t = verifiedTokens[tokenAddress];
        
        if (lifetime) {
            duration = LIFETIME_DURATION;
        }

        IPriceOracle.Price memory price = rentPriceToken(name, duration, t.token, lifetime);
        uint256 totalPrice = price.base + price.premium;

        if (IERC20(tokenAddress).balanceOf(msg.sender) < totalPrice) {
            revert InsufficientValue();
        }

        _consumeCommitment(
            name,
            duration,
            makeCommitment(
                name,
                owner,
                duration,
                secret,
                resolver,
                data,
                reverseRecord,
                ownerControlledFuses,
                lifetime
            )
        );

        // Transfer tokens first
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), totalPrice);

        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
        }

        _updatePoints(name, duration, owner, lifetime);

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price.base,
            price.premium,
            expires
        );

        // Handle token referral
        _processTokenReferral(referralData, referralSignature, totalPrice, tokenAddress);

        mints++;
    }

    // ============ Renewal Functions ============

    function renew(
        string calldata name,
        uint256 duration,
        bool lifetime,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external payable {
        if (lifetime) {
            duration = LIFETIME_DURATION;
        }

        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        uint256 totalPrice = price.base + price.premium;

        if (msg.value < totalPrice) {
            revert InsufficientValue();
        }

        uint256 expires = nameWrapper.renew(tokenId, duration);

        emit NameRenewed(name, labelhash, totalPrice, expires);

        // Handle referral
        _processReferral(referralData, referralSignature, totalPrice, address(0), false);

        // Refund excess
        if (msg.value > totalPrice) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(success, "Refund Failed");
        }
    }

    function renewCard(
        string calldata name,
        uint256 duration,
        bool lifetime,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external onlyBackend {
        if (lifetime) {
            duration = LIFETIME_DURATION;
        }

        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        IPriceOracle.Price memory price = rentPrice(name, duration, lifetime);
        uint256 totalPrice = price.base + price.premium;

        uint256 expires = nameWrapper.renew(tokenId, duration);

        emit NameRenewed(name, labelhash, totalPrice, expires);

        // Handle referral (fiat)
        _processReferral(referralData, referralSignature, totalPrice, address(0), true);

        untrackedInfoFi += (totalPrice * 35) / 100;
    }

    function renewTokens(
        string calldata name,
        uint256 duration,
        address tokenAddress,
        bool lifetime,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external {
        require(
            verifiedTokens[tokenAddress].tokenAddress != address(0),
            "Unaccepted Token"
        );

        Token memory t = verifiedTokens[tokenAddress];

        if (lifetime) {
            duration = LIFETIME_DURATION;
        }

        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        IPriceOracle.Price memory price = rentPriceToken(name, duration, t.token, lifetime);
        uint256 totalPrice = price.base + price.premium;

        if (IERC20(tokenAddress).balanceOf(msg.sender) < totalPrice) {
            revert InsufficientValue();
        }

        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), totalPrice);

        uint256 expires = nameWrapper.renew(tokenId, duration);

        emit NameRenewed(name, labelhash, totalPrice, expires);

        // Handle token referral
        _processTokenReferral(referralData, referralSignature, totalPrice, tokenAddress);
    }

    // ============ Internal Functions ============

    function _processReferral(
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature,
        uint256 totalPrice,
        address token,
        bool isFiat
    ) internal {
        // Skip if no referrer
        if (referralData.referrer == address(0)) return;
        if (referralSignature.length == 0) return;

        // Calculate max possible referral amount
        uint256 maxReferralAmount = (totalPrice * MAX_REFERRAL_PCT) / 100;

        if (token == address(0) && !isFiat) {
            // Send ETH to verifier for processing
            referralVerifier.processReferral{value: maxReferralAmount}(
                referralData,
                referralSignature,
                totalPrice,
                address(0),
                false
            );
        } else {
            // Fiat - no ETH sent, just track
            referralVerifier.processReferral(
                referralData,
                referralSignature,
                totalPrice,
                address(0),
                true
            );
        }
    }

    function _processTokenReferral(
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature,
        uint256 totalPrice,
        address tokenAddress
    ) internal {
        if (referralData.referrer == address(0)) return;
        if (referralSignature.length == 0) return;

        uint256 maxReferralAmount = (totalPrice * MAX_REFERRAL_PCT) / 100;

        // Transfer tokens to verifier first
        IERC20(tokenAddress).safeTransfer(address(referralVerifier), maxReferralAmount);

        referralVerifier.processReferral(
            referralData,
            referralSignature,
            totalPrice,
            tokenAddress,
            false
        );
    }

    function _updatePoints(
        string memory name,
        uint256 duration,
        address owner,
        bool lifetime
    ) internal {
        if (!useAirdrop) return;

        uint256 point;
        uint256 len = name.strlen();
        
        if (len == 2) point = 100;
        else if (len == 3) point = 50;
        else if (len == 4) point = 20;
        else point = 10;

        uint256 points = point * (lifetime ? 3 : duration / 31536000);
        airdrop.updatePoints(owner, points);
    }

    function _consumeCommitment(
        string memory name,
        uint256 duration,
        bytes32 commitment
    ) internal {
        if (commitments[commitment] + minCommitmentAge > block.timestamp) {
            revert CommitmentTooNew(commitment);
        }
        if (commitments[commitment] + maxCommitmentAge <= block.timestamp) {
            revert CommitmentTooOld(commitment);
        }
        if (!available(name)) {
            revert NameNotAvailable(name);
        }

        delete commitments[commitment];

        if (duration != 0 && duration < MIN_REGISTRATION_DURATION) {
            revert DurationTooShort(duration);
        }
    }

    function _setRecords(
        address resolverAddress,
        bytes32 label,
        bytes[] memory data
    ) internal {
        bytes32 nodehash = keccak256(abi.encodePacked(ETH_NODE, label));
        Resolver resolver = Resolver(resolverAddress);
        resolver.multicallWithNodeCheck(nodehash, data);
    }

    function _setReverseRecord(
        string memory name,
        address resolver,
        address owner
    ) internal {
        reverseRegistrar.setNameForAddr(
            msg.sender,
            owner,
            resolver,
            string.concat(name, ".safu")
        );
    }

    // ============ Withdraw Functions ============

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    function withdrawTokens(address tokenAddress) external onlyOwner {
        IERC20(tokenAddress).safeTransfer(
            owner(),
            IERC20(tokenAddress).balanceOf(address(this))
        );
    }

    function resetInfoFi() external payable onlyOwner {
        require(msg.value > 0, "Must send value");
        (bool ok, ) = payable(infoFi).call{value: msg.value}("");
        require(ok, "Payment failed");
        untrackedInfoFi = 0;
    }

    // ============ View Functions ============

    function getMints() external view returns (uint256) {
        return mints;
    }

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return
            interfaceID == type(IERC165).interfaceId ||
            interfaceID == type(IETHRegistrarController).interfaceId;
    }
}