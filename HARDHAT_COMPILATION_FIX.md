# 🔧 Hardhat Compilation Error - Troubleshooting Guide

**Error:** `spawn UNKNOWN` when running `npx hardhat compile`
**Platform:** Windows
**Impact:** Blocking ABI regeneration (CRITICAL fix)

---

## 🚨 Quick Solutions (Try in Order)

### **Solution 1: Clear Hardhat Cache** (Most Common Fix)

```bash
# Delete cache and artifacts
cd SafuPad
rmdir /s /q cache
rmdir /s /q artifacts
rmdir /s /q node_modules\.cache

# Reinstall Hardhat
npm install --force hardhat

# Try compile again
npx hardhat compile
```

---

### **Solution 2: Update Hardhat & Dependencies**

```bash
cd SafuPad
npm update hardhat @nomicfoundation/hardhat-toolbox
npm install --force
npx hardhat compile
```

---

### **Solution 3: Clean Install**

```bash
cd SafuPad
# Backup node_modules if needed
rmdir /s /q node_modules
del package-lock.json

# Fresh install
npm install
npx hardhat compile
```

---

### **Solution 4: Run as Administrator**

1. Open PowerShell or CMD as Administrator
2. Navigate to SafuPad directory
3. Run: `npx hardhat compile`

---

### **Solution 5: Check Antivirus**

Windows Defender or antivirus may be blocking the Solidity compiler:

1. Temporarily disable antivirus
2. Add exception for: `SafuPad\node_modules\.bin\`
3. Try compilation again

---

### **Solution 6: Use WSL (Windows Subsystem for Linux)**

If Windows compilation continues to fail:

```bash
# In WSL terminal
cd /mnt/c/Users/PC/Safuverse/SafuPad
npm install
npx hardhat compile
```

---

## 🔄 Alternative: Manual ABI Extraction

If compilation fails completely, you can extract the ABI from the contract source:

### **Option A: Use Online Compiler**

1. Go to https://remix.ethereum.org
2. Create new file: `LaunchpadManagerV2.sol`
3. Copy contract source from `SafuPad/contracts/LaunchpadManagerV2.sol`
4. Include all imports/dependencies
5. Compile (Ctrl+S)
6. Copy ABI from "Compilation Details"
7. Save as `SafuPad/subgraph/abis/LaunchpadManager.json`

### **Option B: Use solc Directly**

```bash
npm install -g solc
cd SafuPad
solc --abi contracts/LaunchpadManagerV2.sol -o build
# Copy generated ABI to subgraph/abis/
```

---

## 🛠️ Hardhat Config Check

Verify `hardhat.config.js` has correct Solidity version:

```javascript
module.exports = {
  solidity: {
    version: "0.8.20", // or whatever version your contract uses
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
```

---

## 🐛 Debug Mode

Try with verbose logging:

```bash
npx hardhat compile --verbose
# or
npx hardhat compile --show-stack-traces
```

---

## ✅ Verification After Fix

Once compilation succeeds, verify the ABI:

```bash
# Check event count (should be 25, not 23)
node -e "console.log(require('./artifacts/contracts/LaunchpadManagerV2.sol/LaunchpadManagerV2.json').abi.filter(x => x.type === 'event').length)"

# Check for community control functions
node -e "console.log(require('./artifacts/contracts/LaunchpadManagerV2.sol/LaunchpadManagerV2.json').abi.filter(x => x.name && x.name.includes('claimVested')).length)"
```

Expected output:
- Event count: `25`
- Community control functions: Should find `claimVestedTokens`

---

## 📋 Next Steps After Compilation

1. ✅ Verify ABI has 25 events
2. ✅ Copy to subgraph:
   ```bash
   copy artifacts\contracts\LaunchpadManagerV2.sol\LaunchpadManagerV2.json subgraph\abis\LaunchpadManager.json
   ```
3. ✅ Rebuild subgraph:
   ```bash
   cd subgraph
   npm run codegen
   npm run build
   ```

---

## 🆘 If Nothing Works

**Escalation Options:**

1. **Use deployed contract ABI:**
   - If contract is already deployed, fetch ABI from block explorer
   - Go to contract on monad explorer
   - Copy ABI from "Contract" tab

2. **Ask contract team:**
   - Request latest compiled ABI file
   - Verify it matches LaunchpadManagerV2.sol source

3. **Use different machine:**
   - Try compilation on Linux/Mac
   - Use CI/CD pipeline
   - Use GitHub Actions

---

## 📞 Support

If error persists, provide:
- Hardhat version: `npx hardhat --version`
- Node version: `node --version`
- Full error log: `npx hardhat compile --show-stack-traces > error.log`

**Priority:** CRITICAL - This blocks deployment
**Time Estimate:** 15-30 minutes troubleshooting

---

**Created:** December 2, 2025
**Status:** Troubleshooting in progress
