import { getAllBooks, deleteBookById } from './db.js'; 
import { openReader } from './reader.js';

// Функция для переключения экранов (скрывает все, показывает нужный)
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// Глобальный слушатель кнопки "Назад" (назначаем один раз)
document.getElementById('btn-back-to-lib').addEventListener('click', () => {
    switchView('view-library');
});

// Открытие страницы с информацией о книге
async function openBookInfo(book) {
    // 1. Переключаем экран
    switchView('view-book-info');

    // 2. Подставляем текст (название, автор)
    document.getElementById('info-title').textContent = book.title;
    document.getElementById('info-author').textContent = book.author;

    // 3. Подставляем обложку
    const coverContainer = document.getElementById('info-cover-img');
    if (book.cover) {
        const coverUrl = URL.createObjectURL(book.cover);
        coverContainer.innerHTML = `<img src="${coverUrl}" alt="Обложка">`;
    } else {
        coverContainer.innerHTML = '<i class="ph ph-book-open"></i>';
    }

    // 4. Пытаемся достать описание напрямую из файла книги
    const descText = document.getElementById('info-desc-text');
    descText.textContent = "Загрузка описания..."; // Пока грузится
    try {
        const epubInfo = ePub(book.file);
        await epubInfo.ready;
        const meta = await epubInfo.loaded.metadata;
        
        // Если описание есть в файле - показываем, иначе дефолтный текст
        if (meta.description) {
            descText.innerHTML = meta.description; // Иногда там HTML теги
        } else {
            descText.textContent = "Описание отсутствует. Вы можете добавить его через кнопку 'Изменить'.";
        }
    } catch (e) {
        descText.textContent = "Не удалось загрузить описание.";
    }

    // Привязываем кнопку "Читать" (пока выводит сообщение)
    // Привязываем кнопку "Читать"
    const btnRead = document.getElementById('btn-read-book');
    btnRead.onclick = () => {
        openReader(book); // Запускаем читалку!
    };

     const btnDelete = document.getElementById('btn-delete-book');
    // Сбрасываем старые обработчики (чтобы не удаляло по 2 раза)
    const newBtnDelete = btnDelete.cloneNode(true);
    btnDelete.parentNode.replaceChild(newBtnDelete, btnDelete);
    
    newBtnDelete.addEventListener('click', async () => {
        const confirmDelete = confirm(`Ты точно хочешь удалить книгу "${book.title}"? Это действие нельзя отменить.`);
        
        if (confirmDelete) {
            // Удаляем из базы
            await deleteBookById(book.id);
            
            // Обновляем галерею
            await renderLibrary();
            
            // Возвращаемся на главную
            switchView('view-library');
        }
    });
}

export async function renderLibrary() {
    const grid = document.getElementById('books-grid');
    const countSpan = document.getElementById('books-count');
    
    grid.innerHTML = ''; 
    const books = await getAllBooks();
    countSpan.textContent = books.length;
    
    if (books.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px 0;">
                <i class="ph ph-books" style="font-size: 48px; margin-bottom: 10px; opacity: 0.5;"></i><br>
                Библиотека пуста.<br>Нажми <b style="color: var(--text-main)">+</b> слева, чтобы добавить EPUB.
            </div>`;
        return;
    }

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.id = book.id;

        let coverHtml = '<i class="ph ph-book-open"></i>';
        if (book.cover) {
            const coverUrl = URL.createObjectURL(book.cover);
            coverHtml = `<img src="${coverUrl}" alt="Обложка">`;
        }

        card.innerHTML = `
            <div class="book-cover">${coverHtml}</div>
            <div class="book-progress-bg">
                <div class="book-progress-fill" style="width: ${book.progress}%"></div>
            </div>
            <div class="book-info">
                <div class="book-title" title="${book.title}">${book.title}</div>
                <div class="book-author" title="${book.author}">${book.author}</div>
            </div>
        `;

        // Теперь при клике вызываем нашу новую функцию!
        card.addEventListener('click', () => openBookInfo(book));

        grid.appendChild(card);
    });
}