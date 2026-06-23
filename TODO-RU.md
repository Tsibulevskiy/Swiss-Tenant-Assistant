# TODO - Дальнейшая разработка Swiss Tenant Assistant

## 1. Закрыть текущий технический долг

Цель: довести уже начатые модули до рабочего состояния, прежде чем расширять продукт.

- [ ] Реализовать OCR fallback для textless PDF
  - [x] Rasterization PDF -> image
  - [x] Прогон страниц через OCR
  - [x] Объединение результата в единый extraction
- [ ] Привести `TODO-30-DAYS.md` в соответствие с фактическим кодом
- [x] Убрать временные тестовые артефакты и определить набор fixture-документов
- [x] Добавить минимальный `lint`
- [x] Зафиксировать `typecheck` в CI

## 2. Нормализация и структурированное извлечение данных

Цель: перейти от сырого текста к пригодным для правил данным.

- [ ] Ввести слой normalizer
  - [x] Очистка текста
  - [x] Унификация дат, валют и чисел
  - [x] Устранение OCR-шумов
- [x] Определить JSON-форму structured extraction для `Mietvertrag`
- [x] Определить JSON-форму structured extraction для `Nebenkostenabrechnung`
- [x] Реализовать извлечение базовых сущностей
  - [x] Даты
  - [x] Суммы
  - [x] Арендная плата
  - [x] Депозит
  - [x] Позиции расходов
  - [x] Сроки уведомления
- [x] Сохранять structured output в `document_extractions` / `checks`

## 3. Довести rule engine до системного уровня

Цель: заменить текущие эвристики на расширяемый механизм правил.

- [x] Вынести общий контракт правила
  - [x] Входные данные
  - [x] Finding
  - [x] Severity
  - [x] Explanation
- [x] Разделить правила по типам документов
- [x] Реализовать полноценный набор правил для `Nebenkosten Check`
- [x] Реализовать полноценный набор правил для `Mietvertrag Check`
- [x] Добавить риск-скоринг
  - [x] Вес правила
  - [x] Агрегирование
  - [x] Итоговый `riskScore`
- [x] Сохранять findings и rule metadata в консистентном виде

## 4. Завершить backend flow для checks

Цель: получить полноценный end-to-end процесс анализа документа.

- [x] Финализировать pipeline
  - [x] Upload
  - [x] Extraction
  - [x] Normalization
  - [x] Structured extraction
  - [x] Rules
  - [x] Summary
- [x] Добавить повторный запуск анализа
- [x] Обработать частичные ошибки и retry-сценарии
- [x] Ввести понятные статусы обработки для UI и API

## 5. Довести frontend разделов Documents и Checks

Цель: сделать продукт пригодным для реального использования.

- [x] Для `Documents`
  - [x] Фильтры
  - [x] Ошибки загрузки
  - [x] Прогресс и статусы
  - [x] Предпросмотр метаданных
- [x] Для `Checks`
  - [x] Список проверок
  - [x] Карточка результата
  - [x] Findings
  - [x] Risk score
  - [x] Summary
  - [x] Связь с исходным документом
- [x] Для `Dashboard`
  - [x] Заменить заглушки на реальные данные
  - [x] Показать последние документы
  - [x] Показать последние проверки
  - [x] Показать статусы обработки

## 6. Интеграция AI

Цель: добавить объяснение результатов и генерацию пользовательского вывода.

- [x] Подключить OpenAI API
- [x] Сделать AI service wrapper
- [x] Ввести промпты для summary
- [x] Ввести промпты для recommendations
- [x] Валидировать structured AI output через Zod
- [x] Логировать вызовы в `ai_runs`
- [x] Добавить fallback, если AI недоступен

## 7. Генерация писем

Цель: запустить третий продуктовый контур после checks.

- [x] Определить MVP-набор типов писем
- [x] Реализовать backend генерации
  - [x] Subject
  - [x] Body
  - [x] Variables
- [x] Привязать письма к `case` / `check`
- [x] Сделать frontend
  - [x] Форма
  - [x] Preview
  - [x] Сохранение
- [x] Подготовить экспорт в PDF как следующий шаг

## 8. Платежи

Цель: монетизация и ограничение доступа к платным результатам.

- [x] Интегрировать Stripe Checkout
- [x] Создать payment records
- [x] Ввести payment gating
  - [x] Preview до оплаты
  - [x] Полный результат после оплаты
- [x] Реализовать webhook
  - [x] Success
  - [x] Failed
  - [x] Expired
- [ ] Протестировать сценарии оплаты end-to-end

## 9. Email и сервисные коммуникации

Цель: обеспечить продуктовые уведомления.

- [x] Интегрировать email-провайдера
- [x] Подготовить шаблоны писем
  - [x] Upload confirmation
  - [x] Analysis ready
  - [x] Receipt
  - [x] Access link
- [x] Логировать письма в `email_messages`
- [x] Обработать ошибки доставки

## 10. Admin и операционная поддержка

Цель: дать возможность сопровождать продукт.

- [x] Сделать admin-страницы
  - [x] Users
  - [x] Payments
  - [x] Checks
  - [x] Documents
  - [x] AI logs
  - [x] System errors
- [x] Добавить базовые фильтры и просмотр деталей
- [x] Добавить retry / reprocess для неудачных extraction и check runs

## 11. Безопасность и эксплуатация

Цель: подготовить систему к реальному запуску.

- [x] Добавить rate limiting
- [x] Пересмотреть TTL signed links
- [x] Реализовать auto-delete / retention policy для документов
- [x] Расширить audit logs
- [ ] Проверить доступ к файлам и check results
- [x] Усилить env/configuration hardening

## 12. Тестирование и стабилизация

Цель: убрать регрессионный риск.

- [ ] Добавить unit tests
  - [ ] Normalizers
  - [ ] Parsers
  - [ ] Rules
- [ ] Добавить integration tests
  - [ ] Upload
  - [ ] Extraction
  - [ ] Checks flow
  - [ ] Auth
- [ ] Подготовить fixture-набор реальных документов
- [ ] Провести smoke test основных user flows

## Ближайшие 2 спринта

### Спринт 1

- [x] OCR fallback для textless PDF
- [ ] Structured extraction
- [ ] Нормализация данных
- [ ] Доведение rule engine
- [ ] Стабилизация checks backend

### Спринт 2

- [ ] Полноценный UI для checks/documents
- [ ] AI summary / recommendations
- [ ] Preview результата до оплаты
- [ ] Базовая тестовая обвязка

## Практический порядок работ

- [x] Закрыть OCR fallback и extraction debt
- [ ] Ввести structured extraction
- [ ] Довести rules и scoring
- [ ] Завершить end-to-end checks flow
- [ ] Подключить AI summary
- [ ] После этого перейти к payments и letters
