// Инициализация базы данных
localforage.config({
    name: 'RetromaReader',
    storeName: 'books_library'
});

// Функция для сохранения книги
export async function saveBook(bookData) {
    try {
        await localforage.setItem(bookData.id, bookData);
        console.log('Книга сохранена в базу:', bookData.title);
        return true;
    } catch (err) {
        console.error('Ошибка сохранения в базу:', err);
        return false;
    }
}

// Функция для получения всех книг (понадобится на следующем шаге)
export async function getAllBooks() {
    const books =[];
    try {
        await localforage.iterate((value) => {
            books.push(value);
        });
        // Сортируем: новые сверху
        return books.sort((a, b) => b.dateAdded - a.dateAdded);
    } catch (err) {
        console.error('Ошибка получения книг:', err);
        return[];
    }
}

export async function deleteBookById(id) {
    try {
        await localforage.removeItem(id);
        console.log(`Книга с ID ${id} удалена.`);
        return true;
    } catch (err) {
        console.error('Ошибка удаления:', err);
        return false;
    }
}