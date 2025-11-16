import { BigInt } from "@graphprotocol/graph-ts";
import { TokenCreated } from "../generated/TokenFactory/TokenFactory";
import { Token } from "../generated/schema";

export function handleTokenCreated(event: TokenCreated): void {
  let tokenAddress = event.params.tokenAddress.toHexString();
  let token = new Token(tokenAddress);

  token.name = event.params.name;
  token.symbol = event.params.symbol;
  token.decimals = 18; // Standard decimals
  token.totalSupply = event.params.totalSupply;
  token.creator = event.params.creator;
  token.createdAt = event.block.timestamp;
  token.createdAtBlock = event.block.number;
  token.totalVolume = BigInt.fromI32(0);
  token.totalTrades = BigInt.fromI32(0);

  token.save();
}
