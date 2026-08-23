Так. Оскільки ти просиш саме створити `README.md`, ось готовий документ для проєкту. Він описує запропоновану архітектуру, FSRS, Mastery, Wave Manager, формування черги та інтеграцію з React + Vite + IndexedDB.

# Adaptive Vocabulary Learning Engine

## Опис

Система адаптивного вивчення словникового запасу для React + Vite PWA.

Алгоритм поєднує:

* **FSRS** — планування інтервальних повторень;
* **Mastery Model** — оцінку фактичного рівня знання слова;
* **Priority Model** — визначення терміновості повторення;
* **Exercise Selector** — вибір типу вправи;
* **Wave Manager** — поступове відкриття нових слів;
* **Review Queue Builder** — формування наступних 10 навчальних завдань;
* **IndexedDB** — локальне збереження прогресу учня.

Основна ідея:

```text
Word
  ↓
Student Word Progress
  ↓
Mastery + FSRS + Errors + Skills
  ↓
Priority
  ↓
Learning Queue
  ↓
Exercise Selection
  ↓
Student Answer
  ↓
Update Progress
  ↓
FSRS + Mastery
```

---

# 1. Основні принципи

Система не повинна просто випадково показувати слова.

Для кожної вправи алгоритм повинен відповісти на два питання:

1. **Яке слово зараз потрібно показати?**
2. **Яку вправу потрібно дати для цього слова?**

Наприклад:

```text
Слово: boarding pass

Mastery: 0.32
Errors: 4
Weakest skill: Production
FSRS: overdue

↓

Priority: 0.94

↓

Exercise: Typing
```

Таким чином одне й те саме слово може отримувати різні вправи залежно від прогресу учня.

---

# 2. Архітектура

Рекомендована структура:

```text
src/
│
├── domain/
│   │
│   ├── models/
│   │   ├── Word.ts
│   │   ├── WordProgress.ts
│   │   ├── LearningQueueItem.ts
│   │   └── AnswerResult.ts
│   │
│   └── enums/
│       ├── WordState.ts
│       ├── ExerciseType.ts
│       └── SkillType.ts
│
├── services/
│   ├── MasteryService.ts
│   ├── FsrsService.ts
│   ├── PriorityService.ts
│   ├── ExerciseSelector.ts
│   ├── WaveManager.ts
│   ├── ReviewQueueBuilder.ts
│   └── LearningEngine.ts
│
├── repositories/
│   └── WordProgressRepository.ts
│
├── db/
│   └── database.ts
│
└── ui/
    └── GameScreen.tsx
```

---

# 3. Відповідальність класів

## MasteryService

Визначає:

> Наскільки добре учень знає слово?

Не відповідає за FSRS та вибір наступного слова.

```text
MasteryService
    ↓
Mastery
Weakest Skill
Word State
```

---

## FsrsService

Відповідає тільки за FSRS.

```text
FsrsService
    ↓
Grade
    ↓
FSRS Scheduler
    ↓
New Card State
    ↓
Next Due Date
```

FSRS відповідає на питання:

> Коли потрібно повторити слово?

Але FSRS не визначає:

> Яку вправу показувати?

---

## PriorityService

Визначає пріоритет слова.

Використовує:

* Mastery;
* кількість помилок;
* overdue;
* слабку навичку;
* стан слова.

```text
Priority =
    Mastery Risk × 0.35
    +
    Error Risk × 0.25
    +
    Overdue Risk × 0.20
    +
    Weak Skill Risk × 0.20
```

Результат:

```text
0.00 → майже немає необхідності повторення

1.00 → критично необхідно повторити
```

---

## ExerciseSelector

Визначає тип вправи.

Наприклад:

```text
NEW
    ↓
Multiple Choice

Low Recall
    ↓
Reverse Multiple Choice

Low Production
    ↓
Typing

Low Context
    ↓
Context Exercise

High Mastery
    ↓
Mixed Recall
```

---

## WaveManager

Керує новими словами.

Наприклад, тема має 40 слів:

```text
Wave 1 → words 1–10
Wave 2 → words 11–20
Wave 3 → words 21–30
Wave 4 → words 31–40
```

Наступна Wave відкривається не після однієї правильної відповіді, а після достатнього рівня засвоєння попередньої.

Рекомендований критерій:

```text
Mastery >= 0.65

для >= 80% слів Wave

AND

critical words <= 20%
```

---

## ReviewQueueBuilder

Формує наступні 10 слів.

Він об'єднує:

```text
MasteryService
FsrsService
PriorityService
WaveManager
ExerciseSelector
```

і створює:

```text
LearningQueueItem[]
```

---

## LearningEngine

Facade для UI.

React-компоненти не повинні знати про:

* FSRS;
* Mastery;
* Priority;
* Wave;
* IndexedDB.

UI працює тільки через:

```ts
learningEngine.getNextTasks()
learningEngine.submitAnswer()
```

---

# 4. Стани слова

Рекомендовані стани:

```ts
enum WordState {
  NEW = "NEW",
  LEARNING = "LEARNING",
  CONSOLIDATING = "CONSOLIDATING",
  MATURE = "MATURE",
  RELEARNING = "RELEARNING"
}
```

## NEW

Слово ще не вивчалося.

```text
attempts = 0
```

---

## LEARNING

Учень знайомиться зі словом.

```text
mastery < 0.30
```

---

## CONSOLIDATING

Учень вже знає слово, але знання ще нестабільне.

```text
0.30 <= mastery < 0.65
```

---

## MATURE

Слово стабільно засвоєне.

```text
mastery >= 0.65
```

FSRS при цьому продовжує планувати повторення.

---

## RELEARNING

Слово було засвоєне, але учень почав систематично помилятися.

Наприклад:

```text
consecutiveErrors >= 2
```

У цьому випадку слово повертається до активного навчання.

---

# 5. WordProgress

Для кожного:

```text
student + word
```

повинна існувати окрема статистика.

Приклад:

```ts
interface WordProgress {
  studentId: string
  wordId: string

  state: WordState

  recognition: SkillProgress
  recall: SkillProgress
  production: SkillProgress
  context: SkillProgress

  totalAttempts: number
  correctAttempts: number
  errorCount: number

  consecutiveCorrect: number
  consecutiveErrors: number

  averageResponseTimeMs: number

  lastReviewedAt?: Date

  fsrsCard: Card

  createdAt: Date
  updatedAt: Date
}
```

---

# 6. Skills

Система розділяє знання слова на декілька навичок.

```ts
enum SkillType {
  RECOGNITION = "RECOGNITION",
  RECALL = "RECALL",
  PRODUCTION = "PRODUCTION",
  CONTEXT = "CONTEXT"
}
```

## Recognition

Учень впізнає слово.

Приклад:

```text
airport

A. аеропорт
B. лікарня
C. вокзал
D. готель
```

---

## Recall

Учень повинен пригадати значення.

```text
аеропорт → ?
```

---

## Production

Учень самостійно вводить слово.

```text
аеропорт → airport
```

---

## Context

Учень використовує слово в контексті.

```text
We arrived at the ______ two hours early.
```

---

# 7. Mastery

Mastery — це не FSRS difficulty.

Це окрема метрика:

> Наскільки добре учень реально володіє словом?

Наприклад:

```text
Recognition  = 0.90
Recall       = 0.70
Production   = 0.40
Context      = 0.30
```

Загальний Mastery:

```text
Mastery =
    Recognition × 0.20
    +
    Recall × 0.30
    +
    Production × 0.30
    +
    Context × 0.20
```

У цьому прикладі:

```text
0.90 × 0.20
+
0.70 × 0.30
+
0.40 × 0.30
+
0.30 × 0.20

= 0.58
```

Отже:

```text
Mastery = 58%
```

---

# 8. Чому Mastery та FSRS повинні бути окремо

Не потрібно використовувати:

```text
FSRS difficulty = knowledge level
```

Це різні поняття.

### FSRS

Відповідає:

```text
Коли наступного разу показати слово?
```

### Mastery

Відповідає:

```text
Наскільки добре учень знає слово?
```

### Priority

Відповідає:

```text
Наскільки важливо показати слово зараз?
```

### ExerciseSelector

Відповідає:

```text
Яким способом перевірити слово?
```

---

# 9. FSRS

Для планування повторень використовується `ts-fsrs`.

Після відповіді учня система передає в FSRS:

```text
Card
+
Grade
+
Date
```

Результатом є новий Card:

```text
Card
├── due
├── stability
├── difficulty
├── state
└── reps
```

---

# 10. Grade

Для Multiple Choice не потрібно напряму вважати:

```text
correct = GOOD
wrong = AGAIN
```

Grade повинен враховувати якість відповіді.

Рекомендована базова схема:

```text
Incorrect
    ↓
Again

Correct, але з низькою впевненістю
    ↓
Hard

Correct
    ↓
Good

Correct + дуже стабільне знання
    ↓
Easy
```

Наприклад:

```text
function mapAnswerToGrade(result):

  if !result.correct:
    return Again

  if result.responseTimeMs > slowThreshold:
    return Hard

  if result.consecutiveCorrect >= 4:
    return Easy

  return Good
```

Для більш точної системи Grade може враховувати:

* response time;
* exercise type;
* hints;
* кількість варіантів;
* confidence;
* consecutive correct;
* попередній FSRS state.

---

# 11. Priority

Основна модель:

```text
Mastery Risk
    +
Error Risk
    +
Overdue Risk
    +
Weak Skill Risk
```

Формула:

```text
priority =
    masteryRisk * 0.35
    +
    errorRisk * 0.25
    +
    overdueRisk * 0.20
    +
    weakSkillRisk * 0.20
```

---

# 12. Overdue

Для FSRS:

```text
card.due <= now
```

означає, що слово можна повторювати.

Але слова можуть мати різний рівень overdue.

Наприклад:

```text
airport
Due 5 minutes ago

reservation
Due 2 days ago

boarding pass
Due 10 days ago
```

Тому overdue score:

```text
overdueScore =
    min(overdueDays / 7, 1)
```

---

# 13. Формування наступних 10 слів

Базова стратегія:

```text
10 tasks
```

з приблизним балансом:

```text
2 × Critical Weak
3 × FSRS Due
3 × New / Learning
2 × Mixed Review
```

Це не жорстке правило.

Алгоритм повинен адаптувати баланс.

Наприклад:

```text
10 Due words
```

тоді:

```text
6 Due
2 Weak
2 Mixed
```

А для нової теми:

```text
3 New
3 New
2 New
2 Learning
```

---

# 14. Псевдокод Queue Builder

```text
function buildNextLearningQueue():

    candidates = loadWordsAndProgress()


    dueWords =
        candidates.filter(isDue)


    weakWords =
        candidates.filter(isWeak)


    newWords =
        candidates.filter(isNew)


    learningWords =
        candidates.filter(isLearning)


    queue = []


    addUnique(
        queue,
        selectCriticalWords(
            weakWords,
            2
        )
    )


    addUnique(
        queue,
        selectDueWords(
            dueWords,
            3
        )
    )


    if canOpenNewWave():

        addUnique(
            queue,
            selectNewWords(
                newWords,
                3
            )
        )

    else:

        addUnique(
            queue,
            selectLearningWords(
                learningWords,
                3
            )
        )


    addUnique(
        queue,
        selectMixedReviews(
            candidates,
            2
        )
    )


    fillRemainingSlots(
        queue,
        candidates
    )


    for item in queue:

        item.exercise =
            exerciseSelector.select(
                item.progress
            )


    return queue.take(10)
```

---

# 15. Захист від дублювання

Одне слово не повинно потрапити у queue двічі.

Наприклад:

```text
Weak:
boarding pass

Due:
boarding pass
```

Результат:

```text
boarding pass
```

а не:

```text
boarding pass
boarding pass
```

Тому Queue Builder повинен використовувати:

```ts
Set<string>
```

для контролю вже доданих `wordId`.

---

# 16. Wave Manager

Тема з 40 слів:

```text
Travel
│
├── Wave 1
│   ├── airport
│   ├── luggage
│   ├── flight
│   ├── arrival
│   ├── departure
│   ├── passport
│   ├── ticket
│   ├── gate
│   ├── boarding pass
│   └── security
│
├── Wave 2
│   └── words 11–20
│
├── Wave 3
│   └── words 21–30
│
└── Wave 4
    └── words 31–40
```

Нова Wave відкривається приблизно при:

```text
80% words >= 0.65 mastery

AND

critical words <= 20%
```

---

# 17. Важливий принцип Wave

Не потрібно чекати:

```text
100% mastery
```

для кожного слова.

Інакше одне дуже складне слово може заблокувати всю тему.

Правильніше:

```text
80% sufficiently mastered
+
не більше 20% critical
```

---

# 18. Mixed Review

Після первинного вивчення слова не повинні постійно повторюватися в межах своєї теми.

Наприклад:

```text
Travel
    airport
    hotel
    restaurant

Work
    office
    meeting
    interview

Daily life
    breakfast
    shopping
    transport
```

Mixed Review:

```text
airport
interview
shopping
hotel
meeting
```

Це дозволяє перевірити реальне пригадування, а не запам'ятовування слова через контекст теми.

---

# 19. Exercise Selection

Приклад:

```text
Mastery < 0.30
    ↓
Recognition / Multiple Choice

0.30–0.50
    ↓
Recall

0.50–0.70
    ↓
Production

0.70–0.85
    ↓
Context

> 0.85
    ↓
Mixed Recall
```

Але остаточний вибір повинен враховувати **найслабшу навичку**.

Наприклад:

```text
Recognition = 90%
Recall      = 80%
Production  = 35%
Context     = 70%
```

Тоді:

```text
Exercise = Production
```

навіть якщо загальний Mastery вже високий.

---

# 20. Answer Processing

Після відповіді:

```text
Student Answer
      ↓
Correct / Incorrect
      ↓
Update Skill
      ↓
Update Statistics
      ↓
Calculate Mastery
      ↓
Determine Word State
      ↓
Map to FSRS Grade
      ↓
FSRS.next()
      ↓
Save to IndexedDB
```

---

# 21. Приклад

Учень бачить:

```text
airport
```

Вибирає:

```text
A. вокзал
B. аеропорт
C. готель
D. ресторан
```

Відповідь правильна.

Система:

```text
Recognition.correct++
Recognition.mastery recalculated

totalAttempts++
correctAttempts++
consecutiveCorrect++

Mastery recalculated

Grade = Good

FSRS.next()

nextDue = ...
```

Після декількох правильних відповідей:

```text
Mastery = 0.82
consecutiveCorrect = 4
```

слово може отримати:

```text
Grade = Easy
```

і FSRS збільшить інтервал.

---

# 22. Помилка

Якщо учень помилився:

```text
airport
```

відповів:

```text
hotel
```

система:

```text
errorCount++

consecutiveErrors++

consecutiveCorrect = 0

Recognition.mastery ↓

Mastery ↓

State →
    LEARNING
    або
    RELEARNING
```

Потім:

```text
Grade = Again
```

і:

```text
FSRS.next()
```

Слово отримує значно вищий priority.

---

# 23. IndexedDB

IndexedDB повинна зберігати не тільки слова, а й **student-specific progress**.

Рекомендовані таблиці:

```text
words
topics
subtopics
studentWordProgress
learningSessions
answerHistory
```

Особливо важлива:

```text
studentWordProgress
```

бо:

```text
Student A
    airport
    mastery = 0.85


Student B
    airport
    mastery = 0.30
```

Одне слово має різний прогрес для різних учнів.

---

# 24. Repository

UI та LearningEngine не повинні напряму працювати з IndexedDB.

Замість:

```ts
indexedDB.get(...)
```

використовується:

```ts
repository.getProgress(...)
repository.save(...)
repository.getTopicWords(...)
```

Наприклад:

```ts
interface WordProgressRepository {

  getProgress(
    studentId: string,
    wordId: string
  ): Promise<WordProgress | null>


  getStudentProgress(
    studentId: string,
    topicId: string
  ): Promise<WordProgress[]>


  getTopicWords(
    topicId: string
  ): Promise<WordModel[]>


  save(
    progress: WordProgress
  ): Promise<void>
}
```

Це дозволить у майбутньому замінити IndexedDB на API без зміни LearningEngine.

---

# 25. React Integration

`GameScreen` не повинен сам вирішувати:

```ts
shuffle(words)
slice(0, 10)
```

Замість цього:

```ts
const tasks =
  await learningEngine.getNextTasks(
    studentId,
    topicId
  )
```

Отримуємо:

```ts
interface LearningQueueItem {

  word: WordModel

  exercise: ExerciseType

  priority: number

  reason: SelectionReason
}
```

React просто показує завдання.

---

# 26. Submit Answer

Після відповіді:

```ts
await learningEngine.submitAnswer({
  studentId,
  wordId,
  exerciseType,
  correct,
  responseTimeMs,
  grade
})
```

`LearningEngine`:

```text
update statistics
       ↓
update skill
       ↓
calculate mastery
       ↓
update state
       ↓
FSRS.next()
       ↓
IndexedDB.save()
```

---

# 27. Рекомендований LearningEngine API

Основний public API:

```ts
class LearningEngine {

  getNextTasks(
    studentId: string,
    topicId?: string
  ): Promise<LearningQueueItem[]>


  submitAnswer(
    input: AnswerInput
  ): Promise<AnswerResult>


  getWordProgress(
    studentId: string,
    wordId: string
  ): Promise<WordProgress>


  getTopicProgress(
    studentId: string,
    topicId: string
  ): Promise<TopicProgress>


  resetWord(
    studentId: string,
    wordId: string
  ): Promise<void>
}
```

React працює переважно тільки з цим API.

---

# 28. Загальна архітектура

```text
                    React UI
                       │
                       ▼
               ┌───────────────┐
               │ LearningEngine│
               └───────┬───────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
     QueueBuilder   Repository   FSRS
          │            │
          │            ▼
          │         IndexedDB
          │
    ┌─────┼───────────────┐
    │     │       │       │
    ▼     ▼       ▼       ▼
 Mastery Priority Wave Exercise
 Service Service Manager Selector
```

---

# 29. Головне правило дизайну

Класи повинні мати одну відповідальність.

Не рекомендується:

```text
LearningEngine
    ├── calculateMastery()
    ├── calculatePriority()
    ├── selectExercise()
    ├── fsrs.next()
    ├── IndexedDB
    ├── wave management
    └── React state
```

Це швидко перетвориться на великий клас, який складно тестувати.

Краще:

```text
MasteryService
    → knowledge

FsrsService
    → scheduling

PriorityService
    → priority

ExerciseSelector
    → exercise

WaveManager
    → new words

ReviewQueueBuilder
    → queue

Repository
    → persistence

LearningEngine
    → orchestration
```

---

# 30. Unit Testing

Кожен компонент можна тестувати окремо.

Наприклад:

```text
MasteryService
    ✓ calculates mastery
    ✓ detects weakest skill
    ✓ determines word state

FsrsService
    ✓ maps grade
    ✓ calculates next review
    ✓ detects overdue

PriorityService
    ✓ prioritizes weak words
    ✓ prioritizes overdue words

WaveManager
    ✓ opens next wave
    ✓ blocks wave when mastery is low

ExerciseSelector
    ✓ selects recognition
    ✓ selects production
    ✓ selects context

ReviewQueueBuilder
    ✓ returns max 10
    ✓ does not duplicate words
    ✓ includes due words
    ✓ includes weak words
```

---

# 31. Рекомендований порядок реалізації

Реалізовувати систему краще в такому порядку:

```text
1. Domain models
       ↓
2. IndexedDB Repository
       ↓
3. MasteryService
       ↓
4. FsrsService
       ↓
5. PriorityService
       ↓
6. ExerciseSelector
       ↓
7. WaveManager
       ↓
8. ReviewQueueBuilder
       ↓
9. LearningEngine
       ↓
10. React GameScreen
```

---

# 32. Підсумок

Система повинна працювати не за принципом:

```text
10 random words
```

а:

```text
                 Student
                    │
                    ▼
              Word Progress
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       Mastery               FSRS
          │                   │
          ▼                   ▼
      Weak Skill          Next Due
          │                   │
          └─────────┬─────────┘
                    ▼
                 Priority
                    │
                    ▼
             Queue Builder
                    │
                    ▼
              10 words/tasks
                    │
                    ▼
            Exercise Selector
                    │
                    ▼
               Exercise
                    │
                    ▼
                Answer
                    │
                    ▼
             Update Progress
                    │
                    └──────────→ FSRS
```

Ця архітектура дозволяє поступово розширювати систему без переписування `GameScreen`.

Наприклад, у майбутньому можна додати:

```text
Speaking Exercise
Listening Exercise
Fill Gap
Translation
Sentence Building
AI Context Exercise
Pronunciation
```

і змінити тільки `ExerciseSelector` та відповідні exercise handlers, не змінюючи FSRS або Mastery.

Також можна замінити IndexedDB на backend API, не змінюючи алгоритм навчання.

**Ключовим класом системи є `LearningEngine`, але він має бути orchestration/facade layer, а не місцем, де зібрана вся бізнес-логіка.**
