// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

contract VotingSystem {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        mapping(uint => bool) votedIn;
    }

    struct Election {
        string name;
        mapping(uint => Candidate) candidates;
        uint candidatesCount;
        uint endTime;
    }

    mapping(address => Voter) private voters;
    mapping(uint => Election) public elections;

    uint96 public electionsCount;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function createElection(string calldata _name, uint _durationInMinutes) public {
        require(msg.sender == admin, "Only admin can create a new election");
        uint _endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        electionsCount++;
        require(elections[electionsCount].candidatesCount > 0, "First you have to register candidates");
        Election storage e = elections[electionsCount];
        e.name = _name;
        e.endTime = _endTime;
    }

    function addCandidate(uint _electionId, string calldata _candidateName) public {
        require(msg.sender == admin, "Only admin can add a candidate");

        elections[_electionId].candidatesCount ++;
        elections[_electionId].candidates[elections[_electionId].candidatesCount] = Candidate(elections[_electionId].candidatesCount, _candidateName, 0);
    }

    function vote(uint _electionId, uint _candidateId) public {
        require(block.timestamp <= elections[_electionId].endTime, "This election has been ended");

        require(!voters[msg.sender].votedIn[_electionId], "You already voted in this election");

        voters[msg.sender].votedIn[_electionId] = true;
        elections[_electionId].candidates[_candidateId].voteCount ++;
    }

    function winningElection(uint _electionId) public view returns(string memory, uint) {
        require(block.timestamp >= elections[_electionId].endTime, "This election has not ended");
        string memory nameWinning;
        uint idWining;
        uint prevHight;
        for (uint i = 0; i < elections[_electionId].candidatesCount; i++) {
            if (elections[_electionId].candidates[i].voteCount > prevHight) {
                prevHight = elections[_electionId].candidates[i].voteCount;
                nameWinning = elections[_electionId].candidates[i].name;
                idWining = elections[_electionId].candidates[i].id;
            }
        }

        return (nameWinning, idWining);
    }

    function getAllCandidates(uint _electionId) public view returns (uint[] memory, string[] memory, uint[] memory) {
        uint candidateCount = elections[_electionId].candidatesCount;
        uint[] memory ids = new uint[](candidateCount);
        string[] memory names = new string[](candidateCount);
        uint[] memory voteCounts = new uint[](candidateCount);

        for (uint i = 0; i < candidateCount; i++) {
            ids[i] = elections[_electionId].candidates[i].id;
            names[i] = elections[_electionId].candidates[i].name;
            voteCounts[i] = elections[_electionId].candidates[i].voteCount;
        }

        return (ids, names, voteCounts);
    }
}