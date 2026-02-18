import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Level3Course dual-mode completion', function () {
  it('stores free score=0 and incentivized score>0', async function () {
    const [owner, relayer, user] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory('Level3Course');
    const contract = await Contract.deploy(ethers.ZeroAddress, owner.address, ethers.ZeroAddress);
    await contract.waitForDeployment();

    await (await contract.connect(owner).setRelayer(relayer.address)).wait();

    await (await contract.connect(owner).createCourse(
      'Free Course',
      'desc',
      'long',
      'instructor',
      [],
      [],
      'General',
      'BEGINNER',
      '',
      '1 hour',
      1,
      false
    )).wait();

    await (await contract.connect(owner).createCourse(
      'Incentivized Course',
      'desc',
      'long',
      'instructor',
      [],
      [],
      'General',
      'BEGINNER',
      '',
      '1 hour',
      1,
      true
    )).wait();

    await (await contract.connect(relayer).updateUserPoints(user.address, 100)).wait();

    await (await contract.connect(relayer).enroll(0, user.address)).wait();
    await (await contract.connect(relayer).completeCourse(0, user.address, 0, 0)).wait();

    const freeRecord = await contract.getCompletionRecord(user.address, 0);
    expect(freeRecord[0]).to.equal(true);
    expect(freeRecord[1]).to.equal(0n);
    expect(freeRecord[2]).to.equal(0n);

    const pointsAfterFree = await contract.getUserPoints(user.address);
    expect(pointsAfterFree).to.equal(100n);

    await (await contract.connect(relayer).enroll(1, user.address)).wait();
    await (await contract.connect(relayer).completeCourse(1, user.address, 88, 7)).wait();

    const incentivizedRecord = await contract.getCompletionRecord(user.address, 1);
    expect(incentivizedRecord[0]).to.equal(true);
    expect(incentivizedRecord[1]).to.equal(88n);
    expect(incentivizedRecord[2]).to.equal(7n);

    const finalPoints = await contract.getUserPoints(user.address);
    expect(finalPoints).to.equal(188n);
  });
});
