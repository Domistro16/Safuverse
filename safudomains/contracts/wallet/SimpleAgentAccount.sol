// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SimpleAgentAccount
 * @notice Minimal ERC-4337 compatible smart wallet for AI agents
 * @dev Deployed behind ERC1967Proxy via AgentAccountFactory.
 *      Uses a manual initializer pattern for OZ 4.x compatibility.
 */
contract SimpleAgentAccount {
    using ECDSA for bytes32;

    address public owner;
    address public entryPoint;
    bool private _initialized;

    event SimpleAgentAccountInitialized(address indexed owner, address indexed entryPoint);
    event Executed(address indexed target, uint256 value, bytes data);

    modifier onlyOwnerOrEntryPoint() {
        require(
            msg.sender == owner || msg.sender == entryPoint,
            "Only owner or EntryPoint"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function initialize(address _owner, address _entryPoint) external {
        require(!_initialized, "Already initialized");
        _initialized = true;
        owner = _owner;
        entryPoint = _entryPoint;
        emit SimpleAgentAccountInitialized(_owner, _entryPoint);
    }

    /**
     * @notice Execute a call from this account
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external onlyOwnerOrEntryPoint {
        (bool success, bytes memory result) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit Executed(dest, value, func);
    }

    /**
     * @notice Execute a batch of calls
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata values,
        bytes[] calldata funcs
    ) external onlyOwnerOrEntryPoint {
        require(
            dest.length == funcs.length && dest.length == values.length,
            "Length mismatch"
        );
        for (uint256 i = 0; i < dest.length; i++) {
            (bool success, bytes memory result) = dest[i].call{value: values[i]}(funcs[i]);
            if (!success) {
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }
        }
    }

    /**
     * @notice ERC-4337 validateUserOp
     */
    function validateUserOp(
        bytes32 userOpHash,
        bytes calldata signature,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData) {
        require(msg.sender == entryPoint, "Only EntryPoint");

        bytes32 hash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
        );
        address recovered = hash.recover(signature);

        if (recovered != owner) {
            return 1; // SIG_VALIDATION_FAILED
        }

        if (missingAccountFunds > 0) {
            (bool success, ) = payable(entryPoint).call{value: missingAccountFunds}("");
            require(success, "Failed to prefund");
        }

        return 0; // SIG_VALIDATION_SUCCESS
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    receive() external payable {}
}
