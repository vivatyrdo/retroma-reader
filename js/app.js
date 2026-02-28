import { saveBook } from './db.js';
import { renderLibrary } from './library.js';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('Service Worker зарегистрирован!', reg.scope))
            .catch((err) => console.error('Ошибка Service Worker:', err));
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const btnAdd = document.getElementById('nav-add');
    const fileInput = document.getElementById('book-upload');

    // Отрисовываем галерею сразу при загрузке страницы
    await renderLibrary();

    btnAdd.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const originalIcon = btnAdd.innerHTML;
        btnAdd.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';

        try {
            const book = ePub(file);
            await book.ready;
            const meta = await book.loaded.metadata;
            
            const coverUrl = await book.coverUrl();
            let coverBlob = null;
            if (coverUrl) {
                const response = await fetch(coverUrl);
                coverBlob = await response.blob();
            }

            const bookData = {
                id: Date.now().toString(),
                title: meta.title || 'Неизвестная книга',
                author: meta.creator || 'Неизвестный автор',
                file: file,
                cover: coverBlob,
                progress: 0,
                lastPosition: null,
                dateAdded: Date.now()
            };

            await saveBook(bookData);
            
            // КНИГА СОХРАНЕНА -> ОБНОВЛЯЕМ ГАЛЕРЕЮ
            await renderLibrary();
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить книгу.');
        } finally {
            btnAdd.innerHTML = originalIcon;
            fileInput.value = ''; 
        }
    });
});