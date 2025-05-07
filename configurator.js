document.addEventListener('DOMContentLoaded', function() {
    // Load components data from XML
    fetch('data/components.xml')
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            const components = parseComponents(data);
            initConfigurator(components);
        })
        .catch(error => {
            console.error('Error loading components data:', error);
            document.getElementById('compatibility-status').innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#e74c3c"/>
                </svg>
                <span>Не удалось загрузить данные о комплектующих. Пожалуйста, попробуйте позже.</span>
            `;
            document.getElementById('compatibility-status').className = 'compatibility error';
        });
});

function parseComponents(xml) {
    const components = {
        cpu: [],
        motherboard: [],
        ram: [],
        gpu: [],
        storage: [],
        psu: [],
        case: []
    };
    
    const categories = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case'];
    
    categories.forEach(category => {
        const items = xml.querySelectorAll(category);
        
        items.forEach(item => {
            components[category].push({
                id: item.getAttribute('id'),
                name: item.querySelector('name').textContent,
                brand: item.querySelector('brand').textContent,
                price: parseFloat(item.querySelector('price').textContent),
                specs: {
                    socket: item.querySelector('socket')?.textContent,
                    formFactor: item.querySelector('formFactor')?.textContent,
                    memoryType: item.querySelector('memoryType')?.textContent,
                    wattage: item.querySelector('wattage')?.textContent ? parseInt(item.querySelector('wattage').textContent) : null,
                    capacity: item.querySelector('capacity')?.textContent,
                    size: item.querySelector('size')?.textContent
                },
                description: item.querySelector('description').textContent,
                image: item.querySelector('image')?.textContent || 'default-component.jpg'
            });
        });
    });
    
    return components;
}

function initConfigurator(components) {
    const cpuSelect = document.getElementById('cpu-select');
    const motherboardSelect = document.getElementById('motherboard-select');
    const ramSelect = document.getElementById('ram-select');
    const gpuSelect = document.getElementById('gpu-select');
    const storageSelect = document.getElementById('storage-select');
    const psuSelect = document.getElementById('psu-select');
    const caseSelect = document.getElementById('case-select');
    
    const summaryList = document.getElementById('summary-list');
    const totalPriceElement = document.getElementById('total-price');
    const compatibilityStatus = document.getElementById('compatibility-status');
    const addToCartBtn = document.getElementById('add-to-cart');
    const resetBtn = document.getElementById('reset-config');
    
    let selectedComponents = {
        cpu: null,
        motherboard: null,
        ram: null,
        gpu: null,
        storage: null,
        psu: null,
        case: null
    };
    
    let totalPrice = 0;
    
    // Populate CPU dropdown
    components.cpu.forEach(cpu => {
        const option = document.createElement('option');
        option.value = cpu.id;
        option.textContent = `${cpu.brand} ${cpu.name} (${cpu.price} руб.)`;
        cpuSelect.appendChild(option);
    });
    
    // Populate GPU dropdown
    components.gpu.forEach(gpu => {
        const option = document.createElement('option');
        option.value = gpu.id;
        option.textContent = `${gpu.brand} ${gpu.name} (${gpu.price} руб.)`;
        gpuSelect.appendChild(option);
    });
    
    // Populate Storage dropdown
    components.storage.forEach(storage => {
        const option = document.createElement('option');
        option.value = storage.id;
        option.textContent = `${storage.brand} ${storage.name} (${storage.specs.capacity}, ${storage.price} руб.)`;
        storageSelect.appendChild(option);
    });
    
    // Populate Case dropdown
    components.case.forEach(caseItem => {
        const option = document.createElement('option');
        option.value = caseItem.id;
        option.textContent = `${caseItem.brand} ${caseItem.name} (${caseItem.specs.formFactor}, ${caseItem.price} руб.)`;
        caseSelect.appendChild(option);
    });
    
    // CPU selection handler
    cpuSelect.addEventListener('change', function() {
        const cpuId = this.value;
        
        if (!cpuId) {
            selectedComponents.cpu = null;
            motherboardSelect.innerHTML = '<option value="">Сначала выберите процессор</option>';
            motherboardSelect.disabled = true;
            updateSummary();
            return;
        }
        
        const selectedCPU = components.cpu.find(cpu => cpu.id === cpuId);
        selectedComponents.cpu = selectedCPU;
        
        // Update CPU info
        document.getElementById('cpu-info').innerHTML = `
            <p><strong>${selectedCPU.brand} ${selectedCPU.name}</strong></p>
            <p>${selectedCPU.description}</p>
            <p class="price">Цена: ${selectedCPU.price} руб.</p>
        `;
        
        // Filter motherboards by CPU socket
        const compatibleMotherboards = components.motherboard.filter(
            mb => mb.specs.socket === selectedCPU.specs.socket
        );
        
        motherboardSelect.innerHTML = '<option value="">Выберите материнскую плату</option>';
        
        if (compatibleMotherboards.length === 0) {
            motherboardSelect.innerHTML += '<option value="" disabled>Нет совместимых материнских плат</option>';
        } else {
            compatibleMotherboards.forEach(mb => {
                const option = document.createElement('option');
                option.value = mb.id;
                option.textContent = `${mb.brand} ${mb.name} (${mb.price} руб.)`;
                motherboardSelect.appendChild(option);
            });
        }
        
        motherboardSelect.disabled = false;
        updateSummary();
    });
    
    // Motherboard selection handler
    motherboardSelect.addEventListener('change', function() {
        const mbId = this.value;
        
        if (!mbId) {
            selectedComponents.motherboard = null;
            ramSelect.innerHTML = '<option value="">Сначала выберите материнскую плату</option>';
            ramSelect.disabled = true;
            updateSummary();
            return;
        }
        
        const selectedMB = components.motherboard.find(mb => mb.id === mbId);
        selectedComponents.motherboard = selectedMB;
        
        // Update MB info
        document.getElementById('motherboard-info').innerHTML = `
            <p><strong>${selectedMB.brand} ${selectedMB.name}</strong></p>
            <p>Форм-фактор: ${selectedMB.specs.formFactor}</p>
            <p>Тип памяти: ${selectedMB.specs.memoryType}</p>
            <p>${selectedMB.description}</p>
            <p class="price">Цена: ${selectedMB.price} руб.</p>
        `;
        
        // Filter RAM by memory type
        const compatibleRAM = components.ram.filter(
            ram => ram.specs.memoryType === selectedMB.specs.memoryType
        );
        
        ramSelect.innerHTML = '<option value="">Выберите оперативную память</option>';
        
        if (compatibleRAM.length === 0) {
            ramSelect.innerHTML += '<option value="" disabled>Нет совместимой памяти</option>';
        } else {
            compatibleRAM.forEach(ram => {
                const option = document.createElement('option');
                option.value = ram.id;
                option.textContent = `${ram.brand} ${ram.name} (${ram.specs.capacity}, ${ram.price} руб.)`;
                ramSelect.appendChild(option);
            });
        }
        
        ramSelect.disabled = false;
        updateSummary();
    });
    
    // RAM selection handler
    ramSelect.addEventListener('change', function() {
        const ramId = this.value;
        
        if (!ramId) {
            selectedComponents.ram = null;
            updateSummary();
            return;
        }
        
        const selectedRAM = components.ram.find(ram => ram.id === ramId);
        selectedComponents.ram = selectedRAM;
        
        // Update RAM info
        document.getElementById('ram-info').innerHTML = `
            <p><strong>${selectedRAM.brand} ${selectedRAM.name}</strong></p>
            <p>Тип: ${selectedRAM.specs.memoryType}</p>
            <p>Объем: ${selectedRAM.specs.capacity}</p>
            <p>${selectedRAM.description}</p>
            <p class="price">Цена: ${selectedRAM.price} руб.</p>
        `;
        
        updateSummary();
    });
    
    // GPU selection handler
    gpuSelect.addEventListener('change', function() {
        const gpuId = this.value;
        
        if (!gpuId) {
            selectedComponents.gpu = null;
            document.getElementById('gpu-info').innerHTML = '';
            updateSummary();
            return;
        }
        
        const selectedGPU = components.gpu.find(gpu => gpu.id === gpuId);
        selectedComponents.gpu = selectedGPU;
        
        // Update GPU info
        document.getElementById('gpu-info').innerHTML = `
            <p><strong>${selectedGPU.brand} ${selectedGPU.name}</strong></p>
            <p>${selectedGPU.description}</p>
            <p class="price">Цена: ${selectedGPU.price} руб.</p>
        `;
        
        updateSummary();
    });
    
    // Storage selection handler
    storageSelect.addEventListener('change', function() {
        const storageId = this.value;
        
        if (!storageId) {
            selectedComponents.storage = null;
            updateSummary();
            return;
        }
        
        const selectedStorage = components.storage.find(storage => storage.id === storageId);
        selectedComponents.storage = selectedStorage;
        
        // Update Storage info
        document.getElementById('storage-info').innerHTML = `
            <p><strong>${selectedStorage.brand} ${selectedStorage.name}</strong></p>
            <p>Объем: ${selectedStorage.specs.capacity}</p>
            <p>${selectedStorage.description}</p>
            <p class="price">Цена: ${selectedStorage.price} руб.</p>
        `;
        
        updateSummary();
    });
    
    // Case selection handler
    caseSelect.addEventListener('change', function() {
        const caseId = this.value;
        
        if (!caseId) {
            selectedComponents.case = null;
            updateSummary();
            return;
        }
        
        const selectedCase = components.case.find(caseItem => caseItem.id === caseId);
        selectedComponents.case = selectedCase;
        
        // Update Case info
        document.getElementById('case-info').innerHTML = `
            <p><strong>${selectedCase.brand} ${selectedCase.name}</strong></p>
            <p>Форм-фактор: ${selectedCase.specs.formFactor}</p>
            <p>${selectedCase.description}</p>
            <p class="price">Цена: ${selectedCase.price} руб.</p>
        `;
        
        updateSummary();
    });
    
    // PSU selection handler
    psuSelect.addEventListener('change', function() {
        const psuId = this.value;
        
        if (!psuId) {
            selectedComponents.psu = null;
            updateSummary();
            return;
        }
        
        const selectedPSU = components.psu.find(psu => psu.id === psuId);
        selectedComponents.psu = selectedPSU;
        
        // Update PSU info
        document.getElementById('psu-info').innerHTML = `
            <p><strong>${selectedPSU.brand} ${selectedPSU.name}</strong></p>
            <p>Мощность: ${selectedPSU.specs.wattage} Вт</p>
            <p>${selectedPSU.description}</p>
            <p class="price">Цена: ${selectedPSU.price} руб.</p>
        `;
        
        updateSummary();
    });
    
    // Update summary and calculate total price
    function updateSummary() {
        summaryList.innerHTML = '';
        totalPrice = 0;
        
        let hasComponents = false;
        
        for (const [category, component] of Object.entries(selectedComponents)) {
            if (component) {
                hasComponents = true;
                
                const itemElement = document.createElement('div');
                itemElement.className = 'summary-item';
                itemElement.innerHTML = `
                    <span class="item-name">${component.brand} ${component.name}</span>
                    <span class="item-price">${component.price} руб.</span>
                `;
                summaryList.appendChild(itemElement);
                
                totalPrice += component.price;
            }
        }
        
        if (!hasComponents) {
            summaryList.innerHTML = '<p class="empty-message">Выберите компоненты для сборки</p>';
        }
        
        totalPriceElement.textContent = `${totalPrice} руб.`;
        
        // Update PSU options based on power requirements
        updatePSUOptions();
        
        // Check compatibility
        checkCompatibility();
        
        // Enable/disable add to cart button
        addToCartBtn.disabled = !isConfigurationComplete();
    }
    
    // Update PSU options based on power requirements
    function updatePSUOptions() {
        if (!selectedComponents.cpu || !selectedComponents.motherboard) {
            psuSelect.innerHTML = '<option value="">Сначала выберите другие компоненты</option>';
            psuSelect.disabled = true;
            selectedComponents.psu = null;
            return;
        }
        
        // Calculate estimated power consumption
        let estimatedWattage = 0;
        
        if (selectedComponents.cpu) {
            // CPU power estimation (simplified)
            estimatedWattage += 65; // Base for most CPUs
            if (selectedComponents.cpu.brand.toLowerCase().includes('i7') || selectedComponents.cpu.brand.toLowerCase().includes('ryzen 7')) {
                estimatedWattage += 50;
            } else if (selectedComponents.cpu.brand.toLowerCase().includes('i9') || selectedComponents.cpu.brand.toLowerCase().includes('ryzen 9')) {
                estimatedWattage += 100;
            }
        }
        
        if (selectedComponents.gpu) {
            // GPU power estimation (simplified)
            estimatedWattage += 150; // Base for most GPUs
            if (selectedComponents.gpu.name.toLowerCase().includes('rtx 30') || selectedComponents.gpu.name.toLowerCase().includes('rx 6')) {
                estimatedWattage += 100;
            }
        }
        
        // Add base for other components
        estimatedWattage += 50; // Motherboard
        estimatedWattage += 20; // RAM
        estimatedWattage += 20; // Storage
        
        // Recommended PSU wattage (add 20% headroom)
        const recommendedWattage = Math.ceil(estimatedWattage * 1.2);
        
        // Filter PSUs that meet the requirement
        const suitablePSUs = components.psu.filter(
            psu => psu.specs.wattage >= recommendedWattage
        );
        
        psuSelect.innerHTML = '<option value="">Выберите блок питания</option>';
        
        if (suitablePSUs.length === 0) {
            psuSelect.innerHTML += `<option value="" disabled>Требуется БП от ${recommendedWattage} Вт</option>`;
        } else {
            suitablePSUs.forEach(psu => {
                const option = document.createElement('option');
                option.value = psu.id;
                option.textContent = `${psu.brand} ${psu.name} (${psu.specs.wattage} Вт, ${psu.price} руб.)`;
                
                // Select this PSU if it was previously selected
                if (selectedComponents.psu && selectedComponents.psu.id === psu.id) {
                    option.selected = true;
                }
                
                psuSelect.appendChild(option);
            });
        }
        
        psuSelect.disabled = false;
    }
    
    // Check components compatibility
    function checkCompatibility() {
        const status = compatibilityStatus;
        
        // Reset status
        status.className = 'compatibility';
        status.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" fill="#ccc"/>
            </svg>
            <span>Выберите компоненты для проверки совместимости</span>
        `;
        
        if (!selectedComponents.cpu && !selectedComponents.motherboard && !selectedComponents.ram) {
            return;
        }
        
        let isCompatible = true;
        let warnings = [];
        
        // Check CPU and motherboard socket compatibility
        if (selectedComponents.cpu && selectedComponents.motherboard) {
            if (selectedComponents.cpu.specs.socket !== selectedComponents.motherboard.specs.socket) {
                isCompatible = false;
                warnings.push('Процессор и материнская плата не совместимы (разные сокеты)');
            }
        }
        
        // Check RAM and motherboard compatibility
        if (selectedComponents.ram && selectedComponents.motherboard) {
            if (selectedComponents.ram.specs.memoryType !== selectedComponents.motherboard.specs.memoryType) {
                isCompatible = false;
                warnings.push('Оперативная память и материнская плата не совместимы (разные типы памяти)');
            }
        }
        
        // Check case and motherboard form factor
        if (selectedComponents.case && selectedComponents.motherboard) {
            const caseFormFactor = selectedComponents.case.specs.formFactor.toLowerCase();
            const mbFormFactor = selectedComponents.motherboard.specs.formFactor.toLowerCase();
            
            // Simplified form factor compatibility check
            if (caseFormFactor.includes('atx') && mbFormFactor.includes('mini')) {
                warnings.push('Материнская плата формата Mini-ITX может не оптимально размещаться в корпусе ATX');
            } else if (caseFormFactor.includes('mini') && mbFormFactor.includes('atx')) {
                isCompatible = false;
                warnings.push('Материнская плата ATX не поместится в корпус Mini-ITX');
            }
        }
        
        // Check PSU wattage
        if (selectedComponents.psu) {
            let estimatedWattage = 0;
            
            if (selectedComponents.cpu) estimatedWattage += 65;
            if (selectedComponents.gpu) estimatedWattage += 150;
            estimatedWattage += 50; // MB
            estimatedWattage += 20; // RAM
            estimatedWattage += 20; // Storage
            
            if (selectedComponents.psu.specs.wattage < estimatedWattage) {
                warnings.push(`Блок питания (${selectedComponents.psu.specs.wattage} Вт) может быть недостаточно мощным для этой конфигурации (рекомендуется от ${Math.ceil(estimatedWattage * 1.2)} Вт)`);
            }
        }
        
        // Update compatibility status
        if (!isCompatible) {
            status.className = 'compatibility error';
            status.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#e74c3c"/>
                </svg>
                <span>Несовместимые компоненты: ${warnings.join('; ')}</span>
            `;
        } else if (warnings.length > 0) {
            status.className = 'compatibility warning';
            status.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" fill="#f39c12"/>
                </svg>
                <span>Возможные проблемы: ${warnings.join('; ')}</span>
            `;
        } else if (isConfigurationComplete()) {
            status.className = 'compatibility success';
            status.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" fill="#2ecc71"/>
                </svg>
                <span>Все компоненты совместимы!</span>
            `;
        }
    }
    
    // Check if configuration is complete
    function isConfigurationComplete() {
        return selectedComponents.cpu && 
               selectedComponents.motherboard && 
               selectedComponents.ram && 
               selectedComponents.storage && 
               selectedComponents.psu && 
               selectedComponents.case;
    }
    
    // Reset configuration
    resetBtn.addEventListener('click', function() {
        // Reset selects
        cpuSelect.value = '';
        motherboardSelect.innerHTML = '<option value="">Сначала выберите процессор</option>';
        motherboardSelect.disabled = true;
        ramSelect.innerHTML = '<option value="">Сначала выберите материнскую плату</option>';
        ramSelect.disabled = true;
        gpuSelect.value = '';
        storageSelect.value = '';
        psuSelect.innerHTML = '<option value="">Сначала выберите другие компоненты</option>';
        psuSelect.disabled = true;
        caseSelect.value = '';
        
        // Reset info displays
        document.getElementById('cpu-info').innerHTML = '';
        document.getElementById('motherboard-info').innerHTML = '';
        document.getElementById('ram-info').innerHTML = '';
        document.getElementById('gpu-info').innerHTML = '';
        document.getElementById('storage-info').innerHTML = '';
        document.getElementById('psu-info').innerHTML = '';
        document.getElementById('case-info').innerHTML = '';
        
        // Reset selected components
        selectedComponents = {
            cpu: null,
            motherboard: null,
            ram: null,
            gpu: null,
            storage: null,
            psu: null,
            case: null
        };
        
        // Reset summary
        summaryList.innerHTML = '<p class="empty-message">Выберите компоненты для сборки</p>';
        totalPriceElement.textContent = '0 руб.';
        
        // Reset compatibility status
        compatibilityStatus.className = 'compatibility';
        compatibilityStatus.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" fill="#ccc"/>
            </svg>
            <span>Выберите компоненты для проверки совместимости</span>
        `;
        
        // Disable add to cart button
        addToCartBtn.disabled = true;
    });
    
    // Add to cart handler
    addToCartBtn.addEventListener('click', function() {
        if (!isConfigurationComplete()) return;
        
        const configName = `ПК: ${selectedComponents.cpu.brand} ${selectedComponents.cpu.name}, ${selectedComponents.gpu ? selectedComponents.gpu.brand + ' ' + selectedComponents.gpu.name : 'без видеокарты'}`;
        
        const configItem = {
            id: `config-${Date.now()}`,
            name: configName,
            price: totalPrice,
            components: selectedComponents,
            quantity: 1,
            isConfiguration: true
        };
        
        // Add to cart
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(configItem);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Show notification
        showNotification('Конфигурация добавлена в корзину');
        
        // Redirect to cart page
        window.location.href = 'cart.html';
    });
    
    // Check for preset in URL
    const urlParams = new URLSearchParams(window.location.search);
    const preset = urlParams.get('preset');
    
    if (preset) {
        applyPreset(preset);
    }
    
    // Apply preset configuration
    function applyPreset(presetName) {
        let presetCPU, presetMB, presetRAM, presetGPU, presetStorage, presetPSU, presetCase;
        
        switch (presetName) {
            case 'office':
                // Office PC preset
                presetCPU = components.cpu.find(cpu => cpu.name.includes('Core i3-12100F'));
                presetMB = components.motherboard.find(mb => mb.name.includes('PRIME B660M-K'));
                presetRAM = components.ram.find(ram => ram.name.includes('FURY Beast 16GB') && ram.memoryType.includes('DDR4'));
                presetStorage = components.storage.find(storage => storage.name.includes('Samsung 870 EVO 1TB') && storage.type.includes('SATA SSD'));
                presetPSU = components.psu.find(psu => psu.name.includes('RM850x'));
                presetCase = components.case.find(caseItem => caseItem.name.includes('4000D Airflow'));
                break;
                
            case 'gaming':
                // Gaming PC preset
                presetCPU = components.cpu.find(cpu => cpu.name.includes('Ryzen 5 5600X'));
                presetMB = components.motherboard.find(mb => mb.name.includes('B550'));
                presetRAM = components.ram.find(ram => ram.specs.capacity.includes('16GB'));
                presetGPU = components.gpu.find(gpu => gpu.name.includes('RTX 3060'));
                presetStorage = components.storage.find(storage => storage.specs.capacity.includes('1TB'));
                presetCase = components.case.find(caseItem => caseItem.name.includes('Gaming'));
                break;
                
            case 'workstation':
                // Workstation preset
                presetCPU = components.cpu.find(cpu => cpu.name.includes('i7-12700K'));
                presetMB = components.motherboard.find(mb => mb.name.includes('Z690'));
                presetRAM = components.ram.find(ram => ram.specs.capacity.includes('32GB'));
                presetGPU = components.gpu.find(gpu => gpu.name.includes('RTX A4000'));
                presetStorage = components.storage.find(storage => storage.specs.capacity.includes('2TB'));
                presetCase = components.case.find(caseItem => caseItem.name.includes('ATX'));
                break;
        }
        
        // Apply CPU first
        if (presetCPU) {
            cpuSelect.value = presetCPU.id;
            cpuSelect.dispatchEvent(new Event('change'));
            
            // Wait a bit for MB options to load
            setTimeout(() => {
                if (presetMB) {
                    motherboardSelect.value = presetMB.id;
                    motherboardSelect.dispatchEvent(new Event('change'));
                    
                    setTimeout(() => {
                        if (presetRAM) {
                            ramSelect.value = presetRAM.id;
                            ramSelect.dispatchEvent(new Event('change'));
                        }
                        
                        if (presetGPU) {
                            gpuSelect.value = presetGPU.id;
                            gpuSelect.dispatchEvent(new Event('change'));
                        }
                        
                        if (presetStorage) {
                            storageSelect.value = presetStorage.id;
                            storageSelect.dispatchEvent(new Event('change'));
                        }
                        
                        if (presetCase) {
                            caseSelect.value = presetCase.id;
                            caseSelect.dispatchEvent(new Event('change'));
                        }
                        
                        // PSU will be auto-selected based on power requirements
                    }, 300);
                }
            }, 300);
        }
    }
};