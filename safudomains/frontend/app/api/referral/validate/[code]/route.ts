import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const NAME_WRAPPER_ABI = ['function ownerOf(uint256 id) view returns (address)'];
const BASE_REGISTRAR_ABI = ['function nameExpires(uint256 id) view returns (uint256)'];

const nameWrapper = new ethers.Contract(
    process.env.NAME_WRAPPER_ADDRESS!,
    NAME_WRAPPER_ABI,
    provider
);
const baseRegistrar = new ethers.Contract(
    process.env.BASE_REGISTRAR_ADDRESS!,
    BASE_REGISTRAR_ABI,
    provider
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const labelhash = ethers.keccak256(ethers.toUtf8Bytes(code));
        const tokenId = BigInt(labelhash);

        let owner = ethers.ZeroAddress;
        let expiry = 0;

        try {
            owner = await nameWrapper.ownerOf(tokenId);
            expiry = Number(await baseRegistrar.nameExpires(tokenId));
        } catch {
            // Domain doesn't exist
        }

        const now = Math.floor(Date.now() / 1000);
        const isValid = owner !== ethers.ZeroAddress && expiry > now;

        return NextResponse.json({
            code,
            valid: isValid,
            owner: isValid ? owner : null,
            expiry: isValid ? expiry : null
        });
    } catch (error) {
        console.error('Validation error:', error);
        const { code } = await params;
        return NextResponse.json(
            { code: code, valid: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

