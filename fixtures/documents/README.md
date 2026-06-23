# Fixture documents

Этот каталог хранит эталонные документы для ручной проверки extraction, OCR и rule engine.

## Набор fixture-документов

- `pdf/text-based/mietvertrag-basic.pdf`
  - Текстовый PDF с базовыми полями договора аренды
  - Нужен для проверки `pdf_text` extraction
- `pdf/text-based/nebenkosten-basic.pdf`
  - Текстовый PDF со стандартными позициями Nebenkosten
  - Нужен для проверки rule parsing по расходам
- `pdf/scanned/mietvertrag-scan.pdf`
  - Сканированный PDF без встроенного текста
  - Нужен для проверки OCR fallback
- `pdf/scanned/nebenkosten-scan.pdf`
  - Сканированный PDF без встроенного текста
  - Нужен для проверки OCR fallback и сумм
- `images/nebenkosten-photo.png`
  - Фото/скан одной страницы
  - Нужен для прямого OCR по изображениям
- `mixed/rent-increase-letter.pdf`
  - Письмо о повышении аренды
  - Нужен для будущего `rent_increase_check`
- `mixed/deduction-list.pdf`
  - Список удержаний по депозиту
  - Нужен для будущего `deposit_return_check`

## Требования к fixture-документам

- Без персональных данных
- Небольшой размер файла
- Понятные ожидаемые поля для ручной верификации
- Отдельно хранить text-based и scanned варианты

## Текущее состояние

Пока в репозитории зафиксирован только состав набора. Когда появятся обезличенные документы, их нужно разместить в структурах:

- `fixtures/documents/pdf/text-based/`
- `fixtures/documents/pdf/scanned/`
- `fixtures/documents/images/`
- `fixtures/documents/mixed/`
