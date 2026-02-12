import { ethers } from "hardhat";

const CONTROLLER = "0xB5f3F983368e993b5f42D1dd659e4dC36fa5C494";
const RESERVED_OWNER = "0xd83defba240568040b39bb2c8b4db7db02d40593";

const NAMES = [
  "Jesse",
  "drew",
  "almond",
  "benjamin",
  "derrick",
  "clintan",
  "saumya",
  "wyneseo",
  "berkay",
  "sebas",
  "carlosjmelgar",
  "wilson",
  "connor",
  "munda",
  "sohey",
  "xen",
  "sarah",
  "sumedha",
  "kabir",
  "Jon",
  "John",
  "Base",
  "coinbase",
  "buildonbase",
  "baseposting",
  "robert",
  "shashank",
  "ahaan",
  "asal",
  "sfranks",
  "aneri",
  "nick",
  "reva",
  "antidote",
  "youssef",
  "eric",
  "dami",
  "gui",
  "clemens",
  "circle",
  "usdc",
  "afonso",
  "minseok",
  "blockboy",
  "david",
  "zach",
  "oxb",
  "nibel",
  "slatts",
  "hyuckjae",
  "avivian",
  "Pat",
  "simon",
  "ryan",
  "0xmoonlight",
  "domistro",
  "admiano",
  "cz",
  "toly",
  "solana",
  "usdt",
].map((n) => n.toLowerCase());

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  const abi = [
    "function reserveNamesBatch(string[] names, address[] owners) external",
  ];

  const controller = new ethers.Contract(CONTROLLER, abi, signer);
  const owners = NAMES.map(() => RESERVED_OWNER);

  const tx = await controller.reserveNamesBatch(NAMES, owners);
  console.log("Tx:", tx.hash);
  await tx.wait();
  console.log("Reserved", NAMES.length, "names");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
