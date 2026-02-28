import { saveBook } from './db.js';

let currentBook = null;
let rendition = null;

export async function openReader(bookData) {
    // 1. Показываем экран читалки
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-reader').classList.add('active');
    
    // 2. Ставим заголовок
    document.getElementById('reader-title').textContent = bookData.title;
    
    // 3. Очищаем контейнер
    const viewer = document.getElementById('viewer');
    viewer.innerHTML = '';

    // 4. Инициализируем книгу
    currentBook = ePub(bookData.file);
    
    // 5. Настраиваем рендер
    rendition = currentBook.renderTo("viewer", {
        width: "100%",
        height: "100%",
        spread: "none", 
        manager: "continuous",
        flow: "paginated",
        allowScriptedContent: true // <--- ЭТО РЕШАЕТ ОШИБКУ "Blocked script execution"
    });

    // 6. Стилизация под Retroma
    rendition.hooks.content.register((contents) => {
        contents.addStylesheetRules({
            "body": {
                "background": "transparent !important",
                "color": "#b3b9c5 !important",
                "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important",
                "line-height": "1.6 !important",
                "padding": "0 10px !important"
            },
            "a": { "color": "#70a5eb !important", "text-decoration": "none" },
            "h1, h2, h3, h4, h5, h6": { 
                "color": "#ff8b52 !important",
                "font-weight": "800 !important"
            },
            "img": { "max-width": "100% !important", "border-radius": "8px" }
        });
    });

    // 7. Открываем книгу на последнем сохраненном месте (если оно есть)
    const startCfi = bookData.lastPosition || undefined;
    await rendition.display(startCfi);

    // 8. СЛУШАЕМ ПЕРЕЛИСТЫВАНИЕ (Сохраняем прогресс)
    rendition.on('relocated', location => {
        // Вычисляем процент
        // (location.start.percentage может быть 0.15 — это 15%)
        const percent = location.start.percentage ? Math.floor(location.start.percentage * 100) : 0;
        
        // Обновляем текст в футере читалки
        document.getElementById('reader-progress').textContent = `${percent}%`;

        // Сохраняем новую позицию в объект книги и в базу данных
        bookData.lastPosition = location.start.cfi;
        bookData.progress = percent;
        
        // Сохраняем в IndexedDB (без перезагрузки страницы)
        saveBook(bookData);
    });

    // 9. Кнопки навигации
    document.getElementById('btn-prev').onclick = () => rendition.prev();
    document.getElementById('btn-next').onclick = () => rendition.next();
    
    // 10. Кнопка "Закрыть"
    document.getElementById('btn-close-reader').onclick = () => {
        if (currentBook) {
            currentBook.destroy();
        }
        // Возвращаемся в инфо
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-book-info').classList.add('active');
        
        // ВАЖНО: Обновляем полоску прогресса на странице описания (визуально)
        const fill = document.querySelector('.book-progress-fill'); // Находим полоску в DOM (упрощенно)
        // Но лучше просто обновить весь интерфейс при следующем входе в библиотеку
    };

    // 11. Клавиатура
    document.addEventListener('keyup', (e) => {
        if (!rendition) return;
        // Проверяем, что читалка активна
        if(!document.getElementById('view-reader').classList.contains('active')) return;

        if (e.key === 'ArrowLeft') rendition.prev();
        if (e.key === 'ArrowRight') rendition.next();
    });
}