import os
import re

def sanitize_filename(name):
    """
    Очищает строку для использования в качестве имени файла,
    заменяя недопустимые символы на подчеркивания и убирая повторяющиеся подчеркивания.
    """
    # Заменяем недопустимые символы (кроме букв, цифр, пробелов, точек, подчеркиваний, дефисов) на подчеркивания
    sanitized = re.sub(r'[^\w\s\.-]', '_', name)
    # Заменяем пробелы на подчеркивания
    sanitized = sanitized.replace(' ', '_')
    # Убираем повторяющиеся подчеркивания
    sanitized = re.sub(r'_{2,}', '_', sanitized)
    # Убираем подчеркивания в начале или конце
    sanitized = sanitized.strip('_')
    return sanitized

def main():
    """
    Основная функция скрипта.
    Запрашивает список папок, обходит их и сохраняет содержимое файлов.
    """
    print("Этот скрипт обойдет указанные папки, прочитает содержимое каждого файла")
    print("и сохранит его в папку 'code' с новым именем.")
    print("Новое имя будет в формате 'имя_исходной_папки_относительный_путь_к_файлу.txt'")
    print("Например: 'MyProject_src_main_py.txt'")
    print("-" * 50)

    # Запрашиваем у пользователя список папок
    input_folders_str = input("Введите пути к папкам, разделенные запятыми или точками с запятой: ")
    
    # Разделяем строку на отдельные пути и очищаем их
    input_folders = [
        folder.strip() 
        for folder in input_folders_str.replace(';', ',').split(',') 
        if folder.strip()
    ]

    if not input_folders:
        print("Папки не были указаны. Выход.")
        return

    output_dir = "code"

    # Создаем выходную папку, если ее нет
    try:
        os.makedirs(output_dir, exist_ok=True)
        print(f"Папка для сохранения файлов '{output_dir}' создана или уже существует.")
    except OSError as e:
        print(f"Ошибка при создании папки '{output_dir}': {e}")
        return

    processed_files_count = 0
    skipped_files_count = 0

    for original_folder_path in input_folders:
        if not os.path.isdir(original_folder_path):
            print(f"\n[Внимание] Путь '{original_folder_path}' не является существующей папкой. Пропускаем.")
            continue

        print(f"\nОбработка папки: '{original_folder_path}'")
        
        # Получаем базовое имя исходной папки для формирования имени выходного файла
        # Очищаем его, чтобы оно было пригодно для использования в имени файла
        original_folder_base_name = sanitize_filename(os.path.basename(os.path.abspath(original_folder_path)))
        if not original_folder_base_name:
            # Fallback для корневых директорий (например, "C:\")
            original_folder_base_name = sanitize_filename(os.path.abspath(original_folder_path)).replace(os.sep, '_')
            
        if not original_folder_base_name:
             # Если даже abspath не дал нормального имени, используем хэш
            import hashlib
            original_folder_base_name = hashlib.md5(original_folder_path.encode()).hexdigest()[:10]
            print(f"[Внимание] Не удалось получить чистое имя для папки '{original_folder_path}'. Используем хэш: {original_folder_base_name}")

        # Обходим все файлы и подпапки в текущей исходной папке
        for root, _, files in os.walk(original_folder_path):
            for file_name in files:
                full_file_path = os.path.join(root, file_name)
                
                # Создаем относительный путь от исходной папки
                relative_path = os.path.relpath(full_file_path, original_folder_path)
                
                # Очищаем относительный путь для использования в имени файла
                # Заменяем разделители пути на подчеркивания
                sanitized_relative_path = sanitize_filename(relative_path).replace(os.sep, '_')
                
                # Формируем имя выходного файла: "имя_исходной_папки_относительный_путь.txt"
                # Например: "MyProject_src_main_py.txt"
                output_file_name = f"{original_folder_base_name}_{sanitized_relative_path}.txt"
                output_file_path = os.path.join(output_dir, output_file_name)

                try:
                    # Читаем содержимое файла с кодировкой UTF-8, чтобы избежать ошибок
                    # Если файл не текстовый (например, бинарный), это вызовет UnicodeDecodeError
                    with open(full_file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()

                    # Записываем содержимое в новый файл
                    with open(output_file_path, 'w', encoding='utf-8') as outfile:
                        outfile.write(content)
                    
                    print(f"  Сохранено: '{full_file_path}' -> '{output_file_path}'")
                    processed_files_count += 1

                except UnicodeDecodeError:
                    print(f"  [Пропущено] Файл '{full_file_path}' не является текстовым (или имеет неподдерживаемую кодировку).")
                    skipped_files_count += 1
                except IOError as e:
                    print(f"  [Ошибка I/O] Не удалось прочитать/записать файл '{full_file_path}': {e}")
                    skipped_files_count += 1
                except Exception as e:
                    print(f"  [Неизвестная ошибка] При обработке '{full_file_path}': {e}")
                    skipped_files_count += 1
    
    print("-" * 50)
    print(f"Обработка завершена.")
    print(f"Всего файлов сохранено: {processed_files_count}")
    print(f"Всего файлов пропущено (ошибки/не текстовые): {skipped_files_count}")
    print(f"Все выходные файлы находятся в папке '{output_dir}'.")

if __name__ == "__main__":
    main()