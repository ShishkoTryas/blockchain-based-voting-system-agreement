const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem", function() {
  let VotingSystem, votingSystem, admin, addr1, addr2;

  beforeEach(async() => {
    VotingSystem = await ethers.getContractFactory("VotingSystem");
    votingSystem = await VotingSystem.deploy();
    [admin, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Deployment", function() {
    it("Should set the right admin", async function() {
      expect(await votingSystem.admin()).to.equal(admin.address);
    });
  });

  describe("Elections", function() {
    it("Should allow admin to create a new election", async function() {
      await votingSystem.connect(admin).addCandidate(1, "C1")
      await votingSystem.connect(admin).addCandidate(1, "B1")
      await votingSystem.connect(admin).addCandidate(1, "D1")
      await votingSystem.connect(admin).createElection("E1", 10);
      expect(await votingSystem.electionsCount()).to.equal(1);
    });

    it("Should not allow non-admin to create a new election", async function() {
      await expect(votingSystem.connect(addr1).createElection("E1", 10)).to.be.revertedWith("Only admin can create a new election");
    });
  });
  describe("Candidates", function() {
    it("Should allow admin to add a new candidate", async function() {
      await votingSystem.connect(admin).addCandidate(1, "C1");
      await votingSystem.connect(admin).addCandidate(1, "C2");
      await votingSystem.connect(admin).createElection("E1", 10);
      const [,candidateName,] = await votingSystem.getAllCandidates(1);
      expect(candidateName[1]).to.equal("C1");
    });

    it("Should not allow non-admin to add a new candidate", async function() {
      await expect(votingSystem.connect(addr1).addCandidate(1, "C1")).to.be.revertedWith("Only admin can add a candidate");
    });
  });

  describe("Voting", function() {
    it("Should process vote", async function() {
      await votingSystem.connect(admin).addCandidate(1, "C1");
      await votingSystem.connect(admin).addCandidate(1, "C2");
      await votingSystem.connect(admin).createElection("E1", 10);
      await votingSystem.connect(addr1).vote(1, 1);
      const [, , voteCounts] = await votingSystem.getAllCandidates(1);
      expect(voteCounts[1]).to.equal(1);
    });

    it("Should not allow to vote twice", async function() {
      await votingSystem.connect(admin).addCandidate(1, "C2");
      await votingSystem.connect(admin).createElection("E1", 10);
      await votingSystem.connect(addr1).vote(1, 1);
      await expect(votingSystem.connect(addr1).vote(1, 1)).to.be.revertedWith("You already voted in this election");
    });

    it("Should not allow to vote after election ends", async function() {
      await expect(votingSystem.connect(addr1).vote(1, 1)).to.be.revertedWith("This election has been ended");
    });
  });

  describe("Winning", function() {
    beforeEach(async() => {
      await votingSystem.connect(admin).addCandidate(1, "C1");
      await votingSystem.connect(admin).addCandidate(1, "C2");
      await votingSystem.connect(admin).addCandidate(1, "C3");
      await votingSystem.connect(admin).createElection("E1", 10);
    });

    it("Should process find the winning candidate correctly", async function() {
      await votingSystem.connect(addr1).vote(1, 1);
      await ethers.provider.send('evm_increaseTime', [3600]);
      await ethers.provider.send('evm_mine');
      const [winningName] = await votingSystem.winningElection(1);
      expect(winningName).to.equal("C1");
    });

    it("Should not find winner if election not ended", async function() {
      await expect(votingSystem.winningElection(1)).to.be.revertedWith("This election has not ended");
    });
  });
});
