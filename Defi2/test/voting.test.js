const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const constants = require('@openzeppelin/test-helpers/src/constants');
const { expect } = require('chai');

const vi = artifacts.require('Voting');

contract("Voting", function (accounts) {
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];

  let Voting;

  /*==================    Voters Registration Phase    ================*/

  context("Voters Registration Phase", function() {

    beforeEach(async function () {
      Voting = await vi.new({from: owner});
    })

      it('Fails when called by a non-owner account', async function () {
        await expectRevert(Voting.addVoter(voter1, {from: voter1}),
        "Ownable: caller is not the owner")
      });

      it("emit event when voter successfully registered", async function () {
        let receipt = await Voting.addVoter(voter1, {from: owner})
        expectEvent(receipt, "VoterRegistered", {voterAddress: voter1});
      });
    
      it("Return object Voter IsRegistered=true if registered", async function () {
        await Voting.addVoter(voter1, {from: owner})
        let VoterRegisteredBool = await Voting.getVoter(voter1, {from: voter1})
        expect(VoterRegisteredBool.isRegistered).to.equal(true);
      });

    })     

              /*======================   Proposal Registration Phase    ====================================*/

  
  context("Proposal Registration Phase", function() {
    beforeEach(async function () {
        Voting = await vi.new({from: owner});
        await Voting.addVoter(voter1, {from: owner})
        await Voting.addVoter(voter2, {from: owner})
    })

      it('Non Owner cannot start Resgistration Phase', async function () {
        await expectRevert(
        Voting.startProposalsRegistering({from: voter2}),
        "Ownable: caller is not the owner")
      })
    
      it('Submitting Proposal Fails when Registration Phase is not yet started', async function () {
        await expectRevert(Voting.addProposal("voter1Proposal", {from: voter1}),
        "Proposals are not allowed yet")
      })

      it('Non-registered Voter cannot register proposals', async function () {
        let votingProposal = "BadOwner"
        await expectRevert(Voting.addProposal(votingProposal, {from: owner}),
        "You're not a voter")
      })

      it('cannot registered empty proposal', async function () {
        await Voting.startProposalsRegistering({from: owner})
        await expectRevert(
        Voting.addProposal("", {from: voter2}),
        "Vous ne pouvez pas ne rien proposer")
      })

      it("emit event when proposal successfully registered", async function () {
        await Voting.startProposalsRegistering({from: owner})
        let receipt  = await Voting.addProposal("proposalVoter1", {from: voter1})
        const ID = 0;
        let voter1ProposalID = await Voting.getOneProposal(ID);
        expect(voter1ProposalID.description).to.be.equal("proposalVoter1");
        expectEvent(receipt, "ProposalRegistered", {proposalId: new BN(ID)});
      })
  })
  
     /*======================   Voting Phase    ====================================*/

  context("Voting Phase", function() {

    beforeEach(async function () {
      Voting = await vi.new({from: owner});
      await Voting.addVoter(voter1, {from: owner})
      await Voting.addVoter(voter2, {from: owner})
      await Voting.addVoter(voter3, {from: owner})
      await Voting.startProposalsRegistering({from: owner})
      await Voting.addProposal("voter1Proposal", {from: voter1})
      await Voting.addProposal("voter2Proposal", {from: voter2})
      await Voting.addProposal("voter3Proposal", {from: voter3})
      await Voting.endProposalsRegistering({from: owner})
    })

    it('submiting vote fails since voteSession has not yet startet', async function () {
      await expectRevert(
      Voting.setVote(1,{from: voter1}),
      "Voting session havent started yet")
    })

    it("Voter 2 vote for voter1Proposal", async function () {
      await Voting.startVotingSession({from: owner})
      let VoteID = 0;
      
      let receipt = await Voting.setVote(0, {from: voter2});
      let voter1Object = await Voting.getVoter(voter2, {from: voter2});
      let votedProposalObject = await Voting.getOneProposal(VoteID);

      expect(votedProposalObject.description).to.be.equal("voter1Proposal");
      expectEvent(receipt,'Voted', {voter: voter2, proposalId: new BN(VoteID)})
          expect(voter1Object.hasVoted).to.be.equal(true);
          expect(voter1Object.votedProposalId).to.be.equal(VoteID.toString());
          expect(votedProposalObject.voteCount).to.be.equal('1');
    })
  })
       /*======================   Vote Tailling    ====================================*/

  context("Vote Tailling Phase", function() {

    beforeEach(async function () {
      Voting = await vi.new({from: owner});
      await Voting.addVoter(voter1, {from: owner})
      await Voting.addVoter(voter2, {from: owner})
      await Voting.addVoter(voter3, {from: owner})
      await Voting.startProposalsRegistering({from: owner})
      await Voting.addProposal("voter1Proposal", {from: voter1})
      await Voting.addProposal("voter2Proposal", {from: voter2})
      await Voting.addProposal("voter3Proposal", {from: voter3})
      await Voting.endProposalsRegistering({from: owner})
      await Voting.startVotingSession({from: owner})
      await Voting.setVote(1, {from: voter1})
      await Voting.setVote(2, {from: voter2})
      await Voting.setVote(2, {from: voter3})
      await Voting.endVotingSession({from: owner})
      })

      it('tally votes and return winning proposal', async function () {
        await Voting.tallyVotes({from: owner});
        let winningProposal = await Voting.getWinner();
        expect(winningProposal.voteCount).to.equal('2');
        expect(winningProposal.description).to.equal('voter3Proposal');
      })
  })
})
