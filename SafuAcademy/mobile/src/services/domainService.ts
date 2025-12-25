import { ethers } from 'ethers';
import { DOMAIN_CONTRACTS, DOMAIN_CONFIG, TEXT_RECORD_KEYS } from '@config/domains';
import { Domain, DomainPrice, TextRecord, ReferralStats, RegistrationData } from '@types/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RPC_URL } from '@config/constants';

// Simplified ABIs - add more functions as needed
const CONTROLLER_ABI = [
  'function available(string memory name) public view returns (bool)',
  'function rentPrice(string memory label, uint256 duration, bool lifetime) public view returns (tuple(uint256 base, uint256 premium))',
  'function commit(bytes32 commitment) public',
  'function register(string memory label, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] calldata data, bool reverseRecord, uint16 ownerControlledFuses, address referrer) public payable',
  'function renew(string memory label, uint256 duration) public payable',
];

const NAME_WRAPPER_ABI = [
  'function getData(uint256 tokenId) public view returns (address owner, uint32 fuses, uint64 expiry)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function isWrapped(bytes32 node) public view returns (bool)',
  'function wrapETH2LD(string calldata label, address wrappedOwner, uint16 ownerControlledFuses, address resolver) external returns (uint64)',
  'function unwrapETH2LD(bytes32 labelhash, address newRegistrant, address newController) external',
];

const PUBLIC_RESOLVER_ABI = [
  'function text(bytes32 node, string calldata key) external view returns (string memory)',
  'function setText(bytes32 node, string calldata key, string calldata value) external',
  'function addr(bytes32 node) public view returns (address)',
  'function setAddr(bytes32 node, address a) public',
  'function multicall(bytes[] calldata data) external returns (bytes[] memory results)',
];

const REFERRAL_ABI = [
  'function referralCount(address user) public view returns (uint256)',
  'function totalEarnings(address user) public view returns (uint256)',
  'function getReferralPct(address user) public view returns (uint256)',
  'function getReferralCode(address user) public view returns (string memory)',
];

const REGISTRY_ABI = [
  'function owner(bytes32 node) external view returns (address)',
  'function resolver(bytes32 node) external view returns (address)',
];

const BASE_REGISTRAR_ABI = [
  'function nameExpires(uint256 id) external view returns (uint)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
];

export class DomainService {
  private provider: ethers.Provider;
  private controller: ethers.Contract;
  private nameWrapper: ethers.Contract;
  private resolver: ethers.Contract;
  private referral: ethers.Contract;
  private registry: ethers.Contract;
  private baseRegistrar: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.controller = new ethers.Contract(
      DOMAIN_CONTRACTS.CONTROLLER,
      CONTROLLER_ABI,
      this.provider
    );
    this.nameWrapper = new ethers.Contract(
      DOMAIN_CONTRACTS.NAME_WRAPPER,
      NAME_WRAPPER_ABI,
      this.provider
    );
    this.resolver = new ethers.Contract(
      DOMAIN_CONTRACTS.PUBLIC_RESOLVER,
      PUBLIC_RESOLVER_ABI,
      this.provider
    );
    this.referral = new ethers.Contract(
      DOMAIN_CONTRACTS.REFERRAL,
      REFERRAL_ABI,
      this.provider
    );
    this.registry = new ethers.Contract(
      DOMAIN_CONTRACTS.REGISTRY,
      REGISTRY_ABI,
      this.provider
    );
    this.baseRegistrar = new ethers.Contract(
      DOMAIN_CONTRACTS.BASE_REGISTRAR,
      BASE_REGISTRAR_ABI,
      this.provider
    );
  }

  /**
   * Check if domain is available
   */
  async checkAvailability(label: string): Promise<boolean> {
    try {
      return await this.controller.available(label);
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Get domain price
   */
  async getDomainPrice(label: string, duration: number, lifetime: boolean = false): Promise<DomainPrice> {
    try {
      const price = await this.controller.rentPrice(label, duration, lifetime);
      const totalBnb = price.base + price.premium;

      // Convert to BNB
      const bnbAmount = ethers.formatEther(totalBnb);

      // You would typically call a price oracle for USD conversion
      // For now, using a placeholder
      const usdAmount = (parseFloat(bnbAmount) * 600).toFixed(2); // Assuming BNB = $600

      return {
        bnb: bnbAmount,
        usd: usdAmount,
      };
    } catch (error) {
      console.error('Error getting price:', error);
      throw error;
    }
  }

  /**
   * Generate commitment for registration
   */
  generateCommitment(
    label: string,
    owner: string,
    duration: number,
    secret: string,
    resolver: string,
    data: string[],
    reverseRecord: boolean,
    fuses: number,
    referrer: string
  ): string {
    const commitment = ethers.solidityPackedKeccak256(
      ['string', 'address', 'uint256', 'bytes32', 'address', 'bytes[]', 'bool', 'uint16', 'address'],
      [label, owner, duration, secret, resolver, data, reverseRecord, fuses, referrer]
    );
    return commitment;
  }

  /**
   * Commit to registration (Step 1)
   */
  async commitRegistration(commitment: string, signer: ethers.Signer): Promise<ethers.TransactionReceipt | null> {
    try {
      const contractWithSigner = this.controller.connect(signer);
      const tx = await contractWithSigner.commit(commitment);
      return await tx.wait();
    } catch (error) {
      console.error('Error committing:', error);
      throw error;
    }
  }

  /**
   * Complete registration (Step 3)
   */
  async registerDomain(
    data: RegistrationData,
    value: string,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const contractWithSigner = this.controller.connect(signer);
      const tx = await contractWithSigner.register(
        data.label,
        data.owner,
        data.duration,
        data.secret,
        data.resolver,
        data.data,
        data.reverseRecord,
        data.ownerControlledFuses,
        data.referrer || ethers.ZeroAddress,
        { value: ethers.parseEther(value) }
      );
      return await tx.wait();
    } catch (error) {
      console.error('Error registering domain:', error);
      throw error;
    }
  }

  /**
   * Get domain details
   */
  async getDomainDetails(label: string): Promise<Domain | null> {
    try {
      const tokenId = ethers.id(label);
      const node = this.getNamehash(`${label}.${DOMAIN_CONFIG.TLD}`);

      // Check if wrapped
      const isWrapped = await this.nameWrapper.isWrapped(node);

      let owner: string;
      let expiryDate: number;

      if (isWrapped) {
        const wrapperData = await this.nameWrapper.getData(tokenId);
        owner = wrapperData.owner;
        expiryDate = Number(wrapperData.expiry);
      } else {
        owner = await this.baseRegistrar.ownerOf(tokenId);
        expiryDate = Number(await this.baseRegistrar.nameExpires(tokenId));
      }

      const resolver = await this.registry.resolver(node);

      return {
        label,
        name: `${label}.${DOMAIN_CONFIG.TLD}`,
        owner,
        resolver,
        expiryDate,
        isWrapped,
        gracePeriodEnds: expiryDate + DOMAIN_CONFIG.GRACE_PERIOD,
      };
    } catch (error) {
      console.error('Error getting domain details:', error);
      return null;
    }
  }

  /**
   * Get text records for a domain
   */
  async getTextRecords(label: string, keys: string[]): Promise<TextRecord[]> {
    try {
      const node = this.getNamehash(`${label}.${DOMAIN_CONFIG.TLD}`);
      const records: TextRecord[] = [];

      for (const key of keys) {
        try {
          const value = await this.resolver.text(node, key);
          if (value) {
            records.push({ key, value });
          }
        } catch (error) {
          // Skip if record doesn't exist
          continue;
        }
      }

      return records;
    } catch (error) {
      console.error('Error getting text records:', error);
      return [];
    }
  }

  /**
   * Set text record
   */
  async setTextRecord(
    label: string,
    key: string,
    value: string,
    signer: ethers.Signer
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const node = this.getNamehash(`${label}.${DOMAIN_CONFIG.TLD}`);
      const contractWithSigner = this.resolver.connect(signer);
      const tx = await contractWithSigner.setText(node, key, value);
      return await tx.wait();
    } catch (error) {
      console.error('Error setting text record:', error);
      throw error;
    }
  }

  /**
   * Get referral stats
   */
  async getReferralStats(userAddress: string): Promise<ReferralStats> {
    try {
      // Run calls individually to handle partial failures (reverts)
      const fetchCall = async <T>(call: Promise<T>, defaultValue: T): Promise<T> => {
        try {
          return await call;
        } catch (error) {
          console.warn('Individual referral call failed:', error);
          return defaultValue;
        }
      };

      const [count, earnings, percentage, code] = await Promise.all([
        fetchCall(this.referral.referralCount(userAddress), BigInt(0)),
        fetchCall(this.referral.totalEarnings(userAddress), BigInt(0)),
        fetchCall(this.referral.getReferralPct(userAddress), BigInt(25)),
        fetchCall(this.referral.getReferralCode(userAddress), ''),
      ]);

      let tier: 'default' | 'silver' | 'gold' = 'default';
      if (Number(count) >= 15) tier = 'gold';
      else if (Number(count) >= 5) tier = 'silver';

      return {
        referralCount: Number(count),
        totalEarnings: ethers.formatEther(earnings),
        tier,
        percentage: Number(percentage),
        referralCode: code || undefined,
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      // Return default empty stats if everything fails
      return {
        referralCount: 0,
        totalEarnings: '0',
        tier: 'default',
        percentage: 25,
      };
    }
  }

  /**
   * Calculate namehash
   */
  private getNamehash(name: string): string {
    return ethers.namehash(name);
  }

  /**
   * Save recent search
   */
  async saveRecentSearch(label: string): Promise<void> {
    try {
      const key = '@safudomains:recent_searches';
      const stored = await AsyncStorage.getItem(key);
      const searches: string[] = stored ? JSON.parse(stored) : [];

      // Remove duplicate if exists
      const filtered = searches.filter(s => s !== label);

      // Add to beginning
      filtered.unshift(label);

      // Keep only last 10
      const trimmed = filtered.slice(0, 10);

      await AsyncStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  /**
   * Get recent searches
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      const key = '@safudomains:recent_searches';
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }
}

export const domainService = new DomainService();
