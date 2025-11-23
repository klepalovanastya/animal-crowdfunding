window.addEventListener("DOMContentLoaded", async () => {
    // ЗАМЕНИТЕ НА ВАШ АДРЕС КОНТРАКТА ПОСЛЕ ДЕПЛОЯ
    const contractAddress = "0xВашАдресКонтракта";
    
    // ABI контракта (получите после компиляции)
    const abi = [
        "function projectName() view returns (string)",
        "function description() view returns (string)",
        "function goal() view returns (uint256)",
        "function totalFunds() view returns (uint256)",
        "function owner() view returns (address)",
        "function fund() payable",
        "function withdraw()",
        "function refund()",
        "function donorCount() view returns (uint256)",
        "function donors(uint256) view returns (address, uint256, uint256)",
        "function getProgress() view returns (uint256)"
    ];

    // Элементы DOM
    const connectBtn = document.getElementById("connectBtn");
    const fundBtn = document.getElementById("fundBtn");
    const withdrawBtn = document.getElementById("withdrawBtn");
    const refundBtn = document.getElementById("refundBtn");
    const projectNameEl = document.getElementById("projectName");
    const descriptionEl = document.getElementById("description");
    const goalEl = document.getElementById("goal");
    const totalFundsEl = document.getElementById("totalFunds");
    const ownerEl = document.getElementById("owner");
    const amountInput = document.getElementById("amount");
    const progressFill = document.getElementById("progress");
    const progressPercent = document.getElementById("progressPercent");
    const donationsList = document.getElementById("donationsList");

    let provider, signer, contract;

    // Подключение MetaMask
    connectBtn.onclick = async () => {
        if (!window.ethereum) {
            alert("Пожалуйста, установите MetaMask!");
            return;
        }
        
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            contract = new ethers.Contract(contractAddress, abi, signer);
            
            const account = await signer.getAddress();
            connectBtn.innerText = "✅ Подключено: " + account.slice(0, 6) + "..." + account.slice(-4);
            connectBtn.classList.add("connected");
            
            await loadContractData();
        } catch (err) {
            console.error(err);
            alert("Ошибка подключения: " + err.message);
        }
    };

    // Загрузка данных контракта
    async function loadContractData() {
        if (!contract) return;
        
        try {
            const [name, desc, goal, total, owner, progress] = await Promise.all([
                contract.projectName(),
                contract.description(),
                contract.goal(),
                contract.totalFunds(),
                contract.owner(),
                contract.getProgress()
            ]);

            projectNameEl.textContent = name;
            descriptionEl.textContent = desc;
            goalEl.textContent = ethers.formatEther(goal) + " ETH";
            totalFundsEl.textContent = ethers.formatEther(total) + " ETH";
            ownerEl.textContent = owner;

            // Обновление прогресса
            const progressValue = Math.min(100, progress);
            progressFill.style.width = progressValue + "%";
            progressPercent.textContent = progressValue + "%";

            // Загрузка донатов
            await loadDonations();
        } catch (err) {
            console.error("Ошибка загрузки данных:", err);
        }
    }

    // Загрузка истории донатов
    async function loadDonations() {
        donationsList.innerHTML = "";
        
        try {
            const donorCount = await contract.donorCount();
            
            for (let i = 0; i < donorCount; i++) {
                const donation = await contract.donors(i);
                if (Number(donation.amount) > 0) {
                    const li = document.createElement("li");
                    const date = new Date(Number(donation.timestamp) * 1000).toLocaleDateString();
                    li.textContent = `${donation.donor.slice(0, 6)}...${donation.donor.slice(-4)}: ${ethers.formatEther(donation.amount)} ETH (${date})`;
                    donationsList.appendChild(li);
                }
            }
        } catch (err) {
            console.error("Ошибка загрузки донатов:", err);
        }
    }

    // Пожертвование
    fundBtn.onclick = async () => {
        if (!contract) return alert("Сначала подключите MetaMask!");
        
        const ethAmount = amountInput.value;
        if (!ethAmount || Number(ethAmount) <= 0) {
            return alert("Введите корректное количество ETH");
        }
        
        try {
            const tx = await contract.fund({ value: ethers.parseEther(ethAmount) });
            fundBtn.textContent = "⏳ Отправка...";
            await tx.wait();
            fundBtn.textContent = "Пожертвовать";
            amountInput.value = "";
            await loadContractData();
            alert("✅ Спасибо за ваше пожертвование!");
        } catch (err) {
            console.error(err);
            alert("Ошибка пожертвования: " + err.message);
            fundBtn.textContent = "Пожертвовать";
        }
    };

    // Вывод средств
    withdrawBtn.onclick = async () => {
        if (!contract) return alert("Сначала подключите MetaMask!");
        
        try {
            const tx = await contract.withdraw();
            withdrawBtn.textContent = "⏳ Вывод...";
            await tx.wait();
            withdrawBtn.textContent = "Вывести средства";
            await loadContractData();
            alert("✅ Средства успешно выведены!");
        } catch (err) {
            console.error(err);
            alert("Ошибка вывода: " + err.message);
            withdrawBtn.textContent = "Вывести средства";
        }
    };

    // Возврат средств
    refundBtn.onclick = async () => {
        if (!contract) return alert("Сначала подключите MetaMask!");
        
        try {
            const tx = await contract.refund();
            refundBtn.textContent = "⏳ Возврат...";
            await tx.wait();
            refundBtn.textContent = "Вернуть средства";
            await loadContractData();
            alert("✅ Средства успешно возвращены!");
        } catch (err) {
            console.error(err);
            alert("Ошибка возврата: " + err.message);
            refundBtn.textContent = "Вернуть средства";
        }
    };

    // Автоподключение если уже подключены к MetaMask
    if (window.ethereum) {
        connectBtn.click();
    }
});