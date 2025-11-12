# Contributing to Safuverse

Thank you for your interest in contributing to Safuverse! We welcome contributions from the community.

## 🌟 Ways to Contribute

- **Report bugs** by opening an issue
- **Suggest features** through GitHub issues
- **Improve documentation** with clearer explanations or examples
- **Submit pull requests** to fix bugs or add features
- **Write tests** to improve code coverage
- **Review pull requests** from other contributors

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git
- BNB Chain wallet (MetaMask recommended)
- BSC testnet BNB (get from https://testnet.bnbchain.org/faucet-smart)

### Development Setup

1. **Fork the repository**

   Click the "Fork" button at the top right of this repository.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Safuverse.git
   cd Safuverse
   ```

3. **Install dependencies**

   Each project has its own dependencies:

   ```bash
   # For smart contract projects
   cd safupad-contracts
   npm install

   # For frontend projects
   cd SafuCourse/frontend
   npm install
   ```

4. **Set up environment variables**

   Copy `.env.example` to `.env` in relevant project directories and fill in required values:

   ```bash
   DEPLOYER_KEY=your_private_key_here
   BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
   BSCSCAN_API_KEY=your_bscscan_api_key
   ```

5. **Run tests**

   ```bash
   # For smart contracts
   npx hardhat test

   # For frontend projects
   npm test
   ```

## 📝 Pull Request Process

### Before Submitting

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Write clean, readable code
   - Follow existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Run all tests**

   ```bash
   # Smart contracts
   npx hardhat test

   # Frontend
   npm run build
   npm test
   ```

4. **Commit your changes**

   Use clear, descriptive commit messages:

   ```bash
   git commit -m "feat: add new bonding curve pricing model"
   git commit -m "fix: resolve domain registration bug"
   git commit -m "docs: update SafuPad README"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Adding or updating tests
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

### Submitting the PR

1. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request**

   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with:
     - Description of changes
     - Related issue numbers
     - Testing performed
     - Screenshots (if UI changes)

3. **Code Review**

   - Respond to review comments
   - Make requested changes
   - Update your PR by pushing new commits

4. **Merge**

   Once approved, a maintainer will merge your PR!

## 🧪 Testing Guidelines

### Smart Contracts

- Write tests for all public functions
- Test edge cases and error conditions
- Include gas usage tests for critical functions
- Aim for >80% code coverage

Example test structure:

```typescript
describe("BondingDEX", function () {
  it("should calculate correct buy price", async function () {
    // Test implementation
  });

  it("should revert on invalid parameters", async function () {
    // Test implementation
  });
});
```

### Frontend

- Test user interactions
- Test error states
- Test wallet connections
- Test contract interactions

## 🎨 Code Style

### Solidity

- Use Solidity 0.8.17+
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all public functions
- Run `npx hardhat compile` before committing

Example:

```solidity
/// @notice Calculates the buy price for a given amount of tokens
/// @param amount The amount of tokens to buy
/// @return price The total price in BNB
function calculateBuyPrice(uint256 amount) public view returns (uint256 price) {
    // Implementation
}
```

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow existing ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for complex functions

### React

- Use functional components with hooks
- Follow component structure in existing code
- Use TypeScript for props and state
- Keep components small and focused

## 🔒 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead, please email security concerns to: [Add security email]

### Security Best Practices

- Never commit private keys or secrets
- Use `.env` files for sensitive data
- Follow OpenZeppelin security patterns
- Add reentrancy guards where needed
- Validate all user inputs

## 📚 Documentation

Good documentation helps everyone:

- Update README files when adding features
- Add inline comments for complex logic
- Include examples in documentation
- Keep deployment addresses up to date

## 🏗️ Project Structure

```
Safuverse/
├── SafuAgents/          # AI agents interface
├── SafuCourse/          # Educational platform
├── SafuLanding/         # Marketing website
├── Safucard/            # NFT scorecard system
├── safudomains/         # Naming service
├── safupad-contracts/   # Token launchpad
└── safupadsdk/          # TypeScript SDK
```

Each project has its own:
- `contracts/` - Smart contracts (if applicable)
- `test/` - Test files
- `scripts/` - Deployment scripts
- `frontend/` - React frontend (if applicable)
- `README.md` - Project-specific documentation

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description** - Clear description of the bug
2. **Steps to Reproduce** - Step-by-step instructions
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - Browser, Node version, network, etc.
6. **Screenshots** - If applicable
7. **Error Messages** - Full error messages and stack traces

## 💡 Feature Requests

When requesting features:

1. **Use Case** - Describe the problem you're solving
2. **Proposed Solution** - Your suggested implementation
3. **Alternatives** - Other solutions you've considered
4. **Additional Context** - Any other relevant information

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Respecting differing viewpoints
- Accepting constructive criticism
- Focusing on what's best for the community

**Unacceptable behavior:**
- Harassment, trolling, or personal attacks
- Publishing others' private information
- Other conduct that's inappropriate in a professional setting

## 📄 License

By contributing to Safuverse, you agree that your contributions will be licensed under the MIT License.

## 🎯 Development Workflow

### Smart Contract Changes

1. Make changes in `contracts/`
2. Update or add tests in `test/`
3. Run `npx hardhat test`
4. Run `npx hardhat compile`
5. Update deployment scripts if needed
6. Update documentation

### Frontend Changes

1. Make changes in `frontend/src/`
2. Test locally with `npm run dev`
3. Build with `npm run build`
4. Test wallet connections on testnet
5. Update documentation

## 🔄 CI/CD Pipeline

All pull requests trigger automated checks:

- ✅ Smart contract compilation
- ✅ Test suite execution
- ✅ TypeScript type checking
- ✅ Frontend builds
- ✅ ESLint checks
- ✅ Security scans

PRs must pass all checks before merging.

## 📞 Getting Help

Need help? Here are some resources:

- **GitHub Issues** - Ask questions or report bugs
- **GitHub Discussions** - Community discussions
- **Documentation** - Check project READMEs
- **Code Comments** - Read inline documentation

## 🙏 Recognition

Contributors will be:

- Listed in release notes
- Mentioned in documentation
- Recognized in the community

Thank you for contributing to Safuverse! 🚀

---

**Built on BNB Chain** - Leveraging the power of BNB Smart Chain for scalable Web3 applications.
