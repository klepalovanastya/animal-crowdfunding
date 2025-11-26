window.addEventListener("DOMContentLoaded", async () => {
    const contractAddress = "0x1E7A8C7a7a68CdB2cd83EBb1161adAaf222DC385";
    const abi = [
        "function projectName() view returns (string)",
        "function description() view returns (string)",
        "function goal() view returns (uint256)",
        "function totalFunds() view returns (uint256)",
        "function owner() view returns (address)",
        "function fund() payable",
        "function withdraw()",
        "function donorCount() view returns (uint256)",
        "function donors(uint256) view returns (address, uint256)",
        "function getProgress() view returns (uint256)"
    ];

    const connectBtn = document.getElementById("connectBtn");
    const fundBtn = document.getElementById("fundBtn");
    const withdrawBtn = document.getElementById("withdrawBtn");
    const projectNameEl = document.getElementById("projectName");
    const descriptionEl = document.getElementById("description");
    const goalEl = document.getElementById("goal");
    const totalFundsEl = document.getElementById("totalFunds");
    const ownerEl = document.getElementById("owner");
    const amountInput = document.getElementById("amount");
    const progressFill = document.getElementById("progress");
    const donationsList = document.getElementById("donationsList");

    let provider, signer, contract;

    connectBtn.onclick = async () => {
        if (!window.ethereum) { 
            alert("Установите MetaMask!"); 
            return; 
        }
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            contract = new ethers.Contract(contractAddress, abi, signer);
            const account = await signer.getAddress();
            connectBtn.innerText = "Подключено: " + account.slice(0,6) + "...";
            loadContractData();
        } catch (err) { 
            console.error(err); 
            alert("Ошибка подключения: " + err.message); 
        }
    };

    async function loadContractData() {
        if (!contract) return;
        const name = await contract.projectName();
        const desc = await contract.description();
        const goal = await contract.goal();
        const total = await contract.totalFunds();
        const owner = await contract.owner();
        const progress = await contract.getProgress();

        projectNameEl.textContent = name;
        descriptionEl.textContent = desc;
        goalEl.textContent = ethers.formatEther(goal) + " ETH";
        totalFundsEl.textContent = ethers.formatEther(total) + " ETH";
        ownerEl.textContent = owner;

        const progressPercent = Math.min(100, progress);
        progressFill.style.width = progressPercent + "%";

        donationsList.innerHTML = "";
        const donorCount = await contract.donorCount();
        for (let i = 0; i < donorCount; i++) {
            const d = await contract.donors(i);
            if (Number(d.amount) > 0) {
                const li = document.createElement("li");
                li.textContent = `${d.donor}: ${ethers.formatEther(d.amount)} ETH`;
                donationsList.appendChild(li);
            }
        }
    }

    fundBtn.onclick = async () => {
        if (!contract) return alert("Сначала подключите MetaMask!");
        const ethAmount = amountInput.value;
        if (!ethAmount || Number(ethAmount) <= 0) return alert("Введите корректное количество ETH");
        try { 
            await (await contract.fund({ value: ethers.parseEther(ethAmount) })).wait();
            loadContractData(); 
        }
        catch (err) { 
            console.error(err); 
            alert("Ошибка пожертвования: " + err.message); 
        }
    };

    withdrawBtn.onclick = async () => { 
        if (!contract) return alert("Сначала подключите MetaMask!"); 
        try { 
            await (await contract.withdraw()).wait(); 
            loadContractData(); 
        } catch (err) {
            console.error(err); 
            alert("Ошибка вывода: " + err.message); 
        } 
    };
});