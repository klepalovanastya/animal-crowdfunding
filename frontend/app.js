window.addEventListener("DOMContentLoaded", async () => {
    const contractAddress = "0x12503c00800C9011Af0e90D05438FeEA4F129748";
    
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
            console.log("Всего донатов в контракте:", donorCount.toString());
            
            let hasDonations = false;
            
            for (let i = 0; i < donorCount; i++) {
                const donation = await contract.donors(i);
                console.log(`Донат ${i}:`, donation);
                
                const donor = donation[0]; 
                const amount = donation[1];       
                const timestamp = donation[2];  
                
                const amountNumber = Number(amount);
                
                // Показываем только донаты с amount > 0
                if (amountNumber > 0) {
                    hasDonations = true;
                    const li = document.createElement("li");
                    const date = new Date(Number(timestamp) * 1000).toLocaleDateString('ru-RU');
                    const formattedAmount = ethers.formatEther(amount);
                    
                    li.textContent = `${donor.slice(0, 6)}...${donor.slice(-4)}: ${formattedAmount} ETH (${date})`;
                    donationsList.appendChild(li);
                }
            }
            
            // Если донатов нет, показываем сообщение
            if (!hasDonations) {
                const li = document.createElement("li");
                li.textContent = "Пока нет пожертвований";
                li.style.color = "#666";
                li.style.fontStyle = "italic";
                donationsList.appendChild(li);
            }
            
        } catch (err) {
            console.error("Ошибка загрузки донатов:", err);
            const li = document.createElement("li");
            li.textContent = "Ошибка загрузки истории: " + err.message;
            li.style.color = "red";
            donationsList.appendChild(li);
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
            fundBtn.disabled = true;
            
            await tx.wait();
            
            // ПОКАЗЫВАЕМ ГИФКУ КОТИКА 🐱
            showCatAnimation();
            
            fundBtn.textContent = "Пожертвовать";
            fundBtn.disabled = false;
            amountInput.value = "";
            await loadContractData();
            
        } catch (err) {
            console.error(err);
            alert("Ошибка пожертвования: " + err.message);
            fundBtn.textContent = "Пожертвовать";
            fundBtn.disabled = false;
        }
    };

    // Функция показа анимации котика
    function showCatAnimation() {
        const catAnimation = document.getElementById('catAnimation');
        
        // Показываем блок с гифкой
        catAnimation.classList.remove("hidden");
        catAnimation.classList.add("show");
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            catAnimation.classList.remove("show");
            catAnimation.classList.add("hidden");
        }, 5000);
    }

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
