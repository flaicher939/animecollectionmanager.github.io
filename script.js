document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('collectionGrid');
    const modal = document.getElementById('modal');
    const infoModal = document.getElementById('infoModal');
    const saveBtn = document.getElementById('saveBtn');
    const searchInput = document.getElementById('searchInput');
    const sortInput = document.getElementById('sortInput');
    const editIndexInput = document.getElementById('editIndex');
    const fileInput = document.getElementById('fileInput');
    const folderSelect = document.getElementById('folderSelect');
    const folderNav = document.getElementById('folderNav');
    const currentFolderNameTxt = document.getElementById('currentFolderName');
    
    // Кнопки Інфо
    const infoBtn = document.getElementById('infoBtn');
    const closeInfoBtn = document.getElementById('closeInfoBtn');
    const closeInfoOk = document.getElementById('closeInfoOk');

    let collection = JSON.parse(localStorage.getItem('myAnimeCollection')) || [];
    let folders = JSON.parse(localStorage.getItem('myAnimeFolders')) || [];
    let activeFolder = null; 

    function saveToStorage() {
        localStorage.setItem('myAnimeCollection', JSON.stringify(collection));
        localStorage.setItem('myAnimeFolders', JSON.stringify(folders));
    }

    function updateStats() {
        document.getElementById('totalCount').innerText = collection.length;
        document.getElementById('watchedCount').innerText = collection.filter(i => i.status === 'Переглянуто').length;
        document.getElementById('watchingCount').innerText = collection.filter(i => i.status === 'Дивлюсь').length;
        document.getElementById('planCount').innerText = collection.filter(i => i.status === 'У планах').length;
    }

    function updateFolderOptions() {
        folderSelect.innerHTML = '<option value="">Без папки (Головна)</option>';
        folders.forEach(f => {
            folderSelect.innerHTML += `<option value="${f}">${f}</option>`;
        });
    }

    function getStatusIcon(status) {
        switch(status) {
            case 'Переглянуто': return '<i class="fas fa-check-circle"></i>';
            case 'Дивлюсь': return '<i class="fas fa-play-circle"></i>';
            case 'У планах': return '<i class="fas fa-bookmark"></i>';
            case 'Кинуто': return '<i class="fas fa-times-circle"></i>';
            default: return '<i class="fas fa-question-circle"></i>';
        }
    }

    function displayCollection() {
        updateStats();
        updateFolderOptions();
        grid.innerHTML = '';
        const search = searchInput.value.toLowerCase();

        let filtered = collection.filter(item => item.title.toLowerCase().includes(search));

        if (sortInput.value === 'rating') filtered.sort((a, b) => b.rating - a.rating);
        if (sortInput.value === 'alphabet') filtered.sort((a, b) => a.title.localeCompare(b.title));
        let displayList = sortInput.value === 'newest' ? [...filtered].reverse() : filtered;

        if (activeFolder === null && !search) {
            folderNav.style.display = 'none';
            folders.forEach(folderName => {
                const count = collection.filter(i => i.folder === folderName).length;
                const folderCard = document.createElement('div');
                folderCard.className = 'folder-card';
                folderCard.onclick = () => { activeFolder = folderName; displayCollection(); };
                folderCard.innerHTML = `
                    <i class="fas fa-folder fa-3x"></i>
                    <h3>${folderName}</h3>
                    <span class="folder-count">${count} тайтлів</span>
                    <button class="btn-danger-outline" style="padding:2px 10px; font-size:10px; margin-top:10px" onclick="event.stopPropagation(); deleteFolder('${folderName}')">Видалити</button>
                `;
                grid.appendChild(folderCard);
            });
            renderItems(displayList.filter(i => !i.folder));
        } else {
            folderNav.style.display = search ? 'none' : 'block';
            if (activeFolder) currentFolderNameTxt.innerText = activeFolder;
            const listToShow = search ? displayList : displayList.filter(i => i.folder === activeFolder);
            renderItems(listToShow);
        }
    }

    function renderItems(items) {
        items.forEach((item) => {
            const realIndex = collection.findIndex(c => c === item);
            const card = document.createElement('div');
            card.className = 'card';
            const statusClass = `status-${item.status.replace(/\s+/g, '-')}`;

            card.innerHTML = `
                <div class="card-meta">
                    <span class="type-tag">${item.type} ${item.folder ? '| ' + item.folder : ''}</span>
                    <span class="status-badge ${statusClass}">${getStatusIcon(item.status)} ${item.status}</span>
                </div>
                <h3>${item.title}</h3>
                <div class="card-details"><span><i class="fas fa-star" style="color:#f1c40f"></i> ${item.rating} / 10</span></div>
                ${item.comment ? `<div class="comment">${item.comment}</div>` : ''}
                <div class="card-actions">
                    <button class="btn-secondary" style="padding:5px 10px" onclick="openEditModal(${realIndex})"><i class="fas fa-pen"></i></button>
                    <button class="btn-danger-outline" style="padding:5px 10px" onclick="deleteItem(${realIndex})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Керування папками
    document.getElementById('addFolderBtn').onclick = () => {
        const name = prompt("Введіть назву папки:");
        if (name && !folders.includes(name)) {
            folders.push(name);
            saveToStorage();
            displayCollection();
        }
    };

    window.deleteFolder = (name) => {
        if (confirm(`Видалити папку "${name}"? Аніме перемістяться в загальний список.`)) {
            folders = folders.filter(f => f !== name);
            collection.forEach(i => { if(i.folder === name) i.folder = ""; });
            saveToStorage();
            displayCollection();
        }
    };

    document.getElementById('backBtn').onclick = () => { activeFolder = null; displayCollection(); };

    // Вікно ІНФО
    infoBtn.onclick = () => infoModal.classList.add('open');
    const closeInfo = () => infoModal.classList.remove('open');
    closeInfoBtn.onclick = closeInfo;
    closeInfoOk.onclick = closeInfo;

    // Стандартні функції
    function openModal() { modal.classList.add('open'); }
    function closeModal() {
        modal.classList.remove('open');
        editIndexInput.value = "-1";
        document.getElementById('titleInput').value = '';
        document.getElementById('commentInput').value = '';
        document.getElementById('modalTitle').innerText = "Новий запис";
    }

    window.openEditModal = (index) => {
        const item = collection[index];
        document.getElementById('titleInput').value = item.title;
        document.getElementById('typeInput').value = item.type;
        document.getElementById('statusInput').value = item.status;
        document.getElementById('ratingInput').value = item.rating;
        document.getElementById('commentInput').value = item.comment || '';
        folderSelect.value = item.folder || "";
        editIndexInput.value = index;
        document.getElementById('modalTitle').innerText = `Редагувати "${item.title}"`;
        openModal();
    };

    saveBtn.onclick = () => {
        const index = parseInt(editIndexInput.value);
        const data = {
            title: document.getElementById('titleInput').value,
            type: document.getElementById('typeInput').value,
            status: document.getElementById('statusInput').value,
            rating: document.getElementById('ratingInput').value,
            comment: document.getElementById('commentInput').value,
            folder: folderSelect.value
        };

        if (data.title.trim()) {
            if (index === -1) collection.push(data);
            else collection[index] = data;
            saveToStorage();
            closeModal();
            displayCollection();
        }
    };

    window.deleteItem = (index) => {
        if(confirm(`Видалити "${collection[index].title}"?`)) {
            collection.splice(index, 1);
            saveToStorage();
            displayCollection();
        }
    };

    document.getElementById('clearAllBtn').onclick = () => {
        if (confirm("Видалити ВСЕ?")) {
            collection = []; folders = [];
            saveToStorage();
            displayCollection();
        }
    };

    // Експорт/Імпорт
    document.getElementById('exportBtn').onclick = () => {
        let text = collection.map(i => `[${i.status}] [${i.type}] ${i.title} | Оцінка: ${i.rating} | Коментар: ${i.comment || '-'} | Папка: ${i.folder || '-'}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'my_anime_collection.txt';
        a.click();
    };

    document.getElementById('importBtn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = event.target.result.split('\n');
            const newItems = [];
            lines.forEach(line => {
                if (!line.trim()) return;
                const match = line.match(/\[(.*?)\]\s\[(.*?)\]\s(.*?)\s\|\sОцінка:\s(\d+)(\s\|\sКоментар:\s(.*?))?(\s\|\sПапка:\s(.*?))?$/);
                if (match) {
                    const fName = match[8] === '-' ? '' : (match[8] || '');
                    if (fName && !folders.includes(fName)) folders.push(fName);
                    newItems.push({
                        status: match[1], type: match[2], title: match[3],
                        rating: match[4], comment: match[6] === '-' ? '' : (match[6] || ''),
                        folder: fName
                    });
                }
            });
            if (newItems.length > 0 && confirm(`Додати ${newItems.length} тайтлів?`)) {
                collection = [...collection, ...newItems];
                saveToStorage();
                displayCollection();
            }
        };
        reader.readAsText(file);
    };

    // Закриття модалок по кліку на фон
    window.onclick = (event) => {
        if (event.target == modal) closeModal();
        if (event.target == infoModal) closeInfo();
    }

    searchInput.oninput = displayCollection;
    sortInput.onchange = displayCollection;
    document.getElementById('openModalBtn').onclick = openModal;
    document.getElementById('closeModalBtn').onclick = closeModal;

    displayCollection();
});