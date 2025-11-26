// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CrowdfundingAnimals {
    string public projectName;
    string public description;
    uint public goal;
    uint public totalFunds;
    address public owner;
    
    struct Donation {
        address donor;
        uint amount;
    }
    
    Donation[] public donations;
    
    event Funded(address indexed donor, uint amount);
    event Withdrawn(address indexed owner, uint amount);

    constructor(string memory _name, string memory _description, uint _goal) {
        projectName = _name;
        description = _description;
        goal = _goal;
        owner = msg.sender;
        totalFunds = 0;
    }

    function fund() public payable {
        require(msg.value > 0, "Donate more than 0");
        totalFunds += msg.value;
        donations.push(Donation(msg.sender, msg.value));
        emit Funded(msg.sender, msg.value);
    }

    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(totalFunds > 0, "No funds to withdraw");
        
        uint amount = totalFunds;
        totalFunds = 0;
        payable(owner).transfer(amount);
        emit Withdrawn(owner, amount);
    }

    function donorCount() public view returns (uint) {
        return donations.length;
    }

    function donors(uint index) public view returns (address donor, uint amount) {
        Donation storage d = donations[index];
        return (d.donor, d.amount);
    }

    function getProgress() public view returns (uint) {
        return (totalFunds * 100) / goal;
    }
}