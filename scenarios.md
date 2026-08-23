# Scenarios: Adaptive Vocabulary Learning Engine

Acceptance spec + TDD oracle для логіки з [newEngine.md](newEngine.md).

Документ має два шари:

1. **Narrative** — ітерації сесій по темах A → B → C з таблицями черги, вправ і відповідей.
2. **Appendix** — детерміновані oracle-значення (fixed `now`, mastery до/після, JSON snapshots) для автоматичних тестів.

---

## §0 Conventions

### Константи (scenario contract)

| Константа | Значення | Джерело |
|-----------|----------|---------|
| `WAVE_SIZE` | 10 | newEngine §16 |
| Wave unlock | ≥ 80% слів mastery ≥ 0.65 AND critical ≤ 20% | newEngine §16–17 |
| Queue slots | 2 Critical + 3 Due + 3 New/Learning + 2 Mixed | newEngine §13 |
| Mastery weights | Recognition 0.20, Recall 0.30, Production 0.30, Context 0.20 | newEngine §7 |
| Priority weights | mastery 0.35, errors 0.25, overdue 0.20, weakSkill 0.20 | newEngine §11 |
| Overdue score | `min(overdueDays / 7, 1)` | newEngine §12 |
| `errorRisk` | `min(errorCount / 5, 1)` | scenario contract |
| `weakSkillRisk` | `1 - min(skillMasteries)` | scenario contract |
| `masteryRisk` | `1 - mastery` | scenario contract |
| `slowThresholdMs` | 5000 | scenario contract (newEngine §10) |
| Fixed test clock | `now = 2026-08-23T12:00:00.000Z` | TDD oracle |
| Priority display | `priorityDisplay = round(priorityScore × 100)` | scenario contract |
| Critical word | `priorityDisplay ≥ 80` OR `mastery < 0.30` | scenario contract |
| Student | `studentId = "student-1"` | fixture |

### Мовна пара (PL ↔ UA)

Усі слова, промпти і варіанти відповідей — **польська ↔ українська**.

| Поле | Мова | Приклад |
|------|------|---------|
| `foreignText` | PL (вивчаємо) | `lotnisko` |
| `nativeText` | UA (рідна) | `аеропорт` |

| Exercise | Prompt | Expected answer |
|----------|--------|-----------------|
| Recognition | PL слово | вибір UA (4 варіанти) |
| Recall | UA → «?» | вибір PL |
| Production | UA переклад | введення PL |
| Context | речення PL з пропуском | PL слово |
| MixedRecall | PL або UA (залежить від skill) | PL або UA |

### Enums

**SelectionReason:** `CriticalWeak`, `HighErrors`, `Overdue`, `FsrsDue`, `WeakContext`, `WeakProduction`, `WeakRecall`, `NewWord`, `Learning`, `MixedReview`

**ExerciseType:** `Recognition`, `Recall`, `Production`, `Context`, `MixedRecall`

**WordState:** `NEW`, `LEARNING`, `CONSOLIDATING`, `MATURE`, `RELEARNING`

**Grade:** `Again`, `Hard`, `Good`, `Easy`

| Grade rule | Умова |
|------------|-------|
| Again | `correct = false` |
| Hard | `correct = true` AND `responseTimeMs > slowThresholdMs` |
| Easy | `correct = true` AND `consecutiveCorrect ≥ 4` |
| Good | `correct = true` (інше) |

**FSRS column format:** `New`, `Due`, `Due +Nd`, `3d`, `7d`, `14d` (відносно `now`)

### Формат queue table

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |

---

## Словники

### Topic A — `travel` / «Подорожі» (Wave 1)

| # | wordId | PL | UA |
|---|--------|----|----|
| 1 | airport | lotnisko | аеропорт |
| 2 | boarding-pass | karta pokładowa | посадковий талон |
| 3 | departure | odlot | відправлення |
| 4 | arrival | przylot | приліт |
| 5 | luggage | bagaż | багаж |
| 6 | flight | lot | рейс |
| 7 | reservation | rezerwacja | бронювання |
| 8 | gate | bramka | вихід на посадку |
| 9 | passport | paszport | паспорт |
| 10 | train-station | dworzec | вокзал |

### Topic B — `food` / «Їжа» (Wave 1)

| # | wordId | PL | UA |
|---|--------|----|----|
| 1 | menu | menu | меню |
| 2 | waiter | kelner | офіціант |
| 3 | bill | rachunek | рахунок |
| 4 | tip | napiwek | чайові |
| 5 | reservation-food | rezerwacja stolika | бронювання столика |
| 6 | dessert | deser | десерт |
| 7 | appetizer | przystawka | закуска |
| 8 | order | zamówić | замовити |
| 9 | spicy | pikantny | гострий |
| 10 | delicious | pyszny | смачний |

### Topic C — `daily-life` / «Побут» (Wave 1)

| wordId | PL | UA |
|--------|----|----|
| breakfast | śniadanie | сніданок |
| shopping | zakupy | покупки |
| transport | transport | транспорт |
| appointment | wizyta | зустріч |
| neighbor | sąsiad | сусід |
| schedule | rozkład | розклад |
| exercise | ćwiczenie | вправа |

---

## §1 Topic A — Подорожі

### Ітерація 0 — cold start (перша сесія)

**Контекст:** учень відкриває тему «Подорожі». Усі 10 слів `NEW`, mastery = 0, FSRS = `New`. Wave 1 відкрита.

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | airport | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 2 | boarding-pass | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 3 | departure | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 4 | arrival | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 5 | luggage | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 6 | flight | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 7 | reservation | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 8 | gate | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 9 | passport | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 10 | train-station | NewWord | 0.00 | New | 0.80 | 80 | Recognition |

**Exercise variants (iter 0):**

| Word | Exercise | Prompt (PL) | Expected (UA) | Distractors (UA) |
| ---- | -------- | ----------- | --------------- | ---------------- |
| airport | Recognition | lotnisko | аеропорт | вокзал, багаж, рейс |
| boarding-pass | Recognition | karta pokładowa | посадковий талон | паспорт, бронювання, приліт |
| departure | Recognition | odlot | відправлення | приліт, рейс, вокзал |
| arrival | Recognition | przylot | приліт | відправлення, багаж, аеропорт |
| luggage | Recognition | bagaż | багаж | паспорт, меню, вокзал |
| flight | Recognition | lot | рейс | аеропорт, bramka→вихід на посадку, паспорт |
| reservation | Recognition | rezerwacja | бронювання | рахунок, рейс, багаж |
| gate | Recognition | bramka | вихід на посадку | вокзал, аеропорт, паспорт |
| passport | Recognition | paszport | паспорт | багаж, меню, рейс |
| train-station | Recognition | dworzec | вокзал | аеропорт, bramka, бронювання |

**Answer cases (iter 0 — репрезентативні):**

| Word | Case | correct | responseTimeMs | consecCorrect before | Grade | Skill | Notes |
| ---- | ---- | ------- | -------------- | -------------------- | ----- | ----- | ----- |
| airport | first correct | true | 3200 | 0 | Good | Recognition ↑ | state → LEARNING |
| airport | wrong | false | 2800 | 0 | Again | Recognition ↓ | errorCount++ |
| gate | slow correct | true | 6200 | 0 | Hard | Recognition ↑ | |
| boarding-pass | easy path | true | 1800 | 4 | Easy | Recognition ↑ | після кількох сесій |

**Post-session summary (iter 0 → seed для iter 1):** після часткового проходження теми частина слів має прогрес (див. Appendix A snapshot `topic-a-iter1-before`).

---

### Ітерація 1 — mid-progress

**Контекст:** `now = 2026-08-23T12:00:00.000Z`. Частина слів due/overdue, 3 нових, різні weak skills.

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | boarding-pass | CriticalWeak | 0.25 | Due | 0.95 | 95 | Recall |
| 2 | gate | HighErrors | 0.00 | Due | 1.00 | 100 | Recognition |
| 3 | reservation | Overdue | 0.40 | Due +10d | 0.85 | 85 | Context |
| 4 | departure | FsrsDue | 0.44 | Due | 0.75 | 75 | Production |
| 5 | airport | WeakContext | 0.55 | 3d | 0.65 | 65 | Context |
| 6 | train-station | WeakProduction | 0.44 | 3d | 0.62 | 62 | Production |
| 7 | passport | WeakProduction | 0.44 | 3d | 0.60 | 60 | Production |
| 8 | luggage | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 9 | flight | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 10 | arrival | NewWord | 0.00 | New | 0.80 | 80 | Recognition |

**Exercise variants (iter 1):**

| Word | Exercise | Prompt | Expected | Distractors / input |
| ---- | -------- | ------ | -------- | ------------------- |
| boarding-pass | Recall | посадковий талон → ? | karta pokładowa | bagaż, odlot, bramka |
| gate | Recognition | bramka | вихід на посадку | вокзал, аеропорт, паспорт |
| reservation | Context | Proszę o ______ na jutro. | rezerwacja | bagaż, lot, dworzec |
| departure | Production | відправлення | odlot | (typing) |
| airport | Context | Jestem na ______. | lotnisko | dworzec, bramka, bagaż |
| train-station | Production | вокзал | dworzec | (typing) |
| passport | Production | паспорт | paszport | (typing) |
| luggage | Recognition | bagaż | багаж | паспорт, рейс, меню |
| flight | Recognition | lot | рейс | аеропорт, бронювання, вокзал |
| arrival | Recognition | przylot | приліт | відправлення, багаж, рейс |

**Answer cases (iter 1 — сценарій сесії S1):**

| # | Word | Case | correct | responseTimeMs | consecCorrect before | Grade | Skill affected |
| -: | ---- | ---- | ------- | -------------- | -------------------- | ----- | -------------- |
| 1 | boarding-pass | normal correct | true | 2500 | 1 | Good | Recall ↑ |
| 2 | gate | wrong | false | 3000 | 0 | Again | Recognition ↓ → RELEARNING |
| 3 | reservation | slow correct | true | 6000 | 2 | Hard | Context ↑ |
| 4 | departure | normal correct | true | 2800 | 1 | Good | Production ↑ |
| 5 | airport | normal correct | true | 2200 | 3 | Good | Context ↑ |
| 6 | train-station | normal correct | true | 3100 | 0 | Good | Production ↑ |
| 7 | passport | slow correct | true | 5500 | 1 | Hard | Production ↑ |
| 8 | luggage | normal correct | true | 2400 | 0 | Good | Recognition ↑ → LEARNING |
| 9 | flight | normal correct | true | 2100 | 0 | Good | Recognition ↑ → LEARNING |
| 10 | arrival | normal correct | true | 2300 | 0 | Good | Recognition ↑ → LEARNING |

**Post-session summary (iter 1 → iter 2):**

- `gate`: mastery ↓, `consecutiveErrors = 1`, state `RELEARNING`, priority ↑
- `boarding-pass`: mastery 0.25 → 0.38, Recall покращився
- `luggage`, `flight`, `arrival`: перейшли в `LEARNING`
- 3 due-слова отримали новий FSRS due (1–3d)

---

### Ітерація 2 — weak + due focus

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | gate | HighErrors | 0.00 | Due | 0.98 | 98 | Recognition |
| 2 | boarding-pass | CriticalWeak | 0.38 | Due | 0.88 | 88 | Recall |
| 3 | reservation | Overdue | 0.48 | Due +8d | 0.78 | 78 | Context |
| 4 | departure | FsrsDue | 0.52 | Due | 0.72 | 72 | Production |
| 5 | passport | WeakProduction | 0.50 | Due | 0.68 | 68 | Production |
| 6 | train-station | WeakProduction | 0.50 | 3d | 0.58 | 58 | Production |
| 7 | luggage | Learning | 0.22 | New | 0.70 | 70 | Recall |
| 8 | flight | Learning | 0.20 | New | 0.68 | 68 | Recall |
| 9 | arrival | Learning | 0.18 | New | 0.66 | 66 | Recognition |
| 10 | airport | MixedReview | 0.62 | 5d | 0.45 | 45 | MixedRecall |

**Answer cases (iter 2 — сценарій S2, скорочено):**

| Word | Case | correct | Grade | Key effect |
| ---- | ---- | ------- | ----- | ---------- |
| gate | wrong again | false | Again | consecutiveErrors = 2, RELEARNING |
| boarding-pass | normal correct | true | Good | mastery → 0.52 |
| luggage | normal correct | true | Good | Recall exercise, mastery → 0.35 |
| airport | normal correct | true | Good | MixedRecall, Context ↑ |

---

### Ітерація 3 — consolidation

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | gate | CriticalWeak | 0.12 | Due | 0.96 | 96 | Recognition |
| 2 | boarding-pass | FsrsDue | 0.52 | Due | 0.70 | 70 | Production |
| 3 | departure | FsrsDue | 0.58 | Due | 0.65 | 65 | Production |
| 4 | reservation | Overdue | 0.55 | Due +5d | 0.62 | 62 | Context |
| 5 | passport | WeakProduction | 0.58 | 3d | 0.55 | 55 | Production |
| 6 | train-station | WeakProduction | 0.56 | 3d | 0.52 | 52 | Production |
| 7 | luggage | Learning | 0.35 | 2d | 0.58 | 58 | Recall |
| 8 | flight | Learning | 0.32 | 2d | 0.55 | 55 | Recall |
| 9 | arrival | Learning | 0.30 | 2d | 0.52 | 52 | Recall |
| 10 | airport | MixedReview | 0.68 | 7d | 0.38 | 38 | MixedRecall |

---

### Ітерація 4 — mostly mixed + polish

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | gate | CriticalWeak | 0.28 | Due | 0.82 | 82 | Recall |
| 2 | boarding-pass | FsrsDue | 0.64 | Due | 0.58 | 58 | Production |
| 3 | departure | MixedReview | 0.68 | 5d | 0.42 | 42 | MixedRecall |
| 4 | reservation | MixedReview | 0.66 | 7d | 0.40 | 40 | Context |
| 5 | passport | FsrsDue | 0.67 | Due | 0.48 | 48 | Production |
| 6 | train-station | FsrsDue | 0.65 | Due | 0.46 | 46 | Production |
| 7 | luggage | Learning | 0.48 | 3d | 0.50 | 50 | Recall |
| 8 | flight | Learning | 0.45 | 3d | 0.48 | 48 | Production |
| 9 | arrival | Learning | 0.42 | 3d | 0.46 | 46 | Recall |
| 10 | airport | MixedReview | 0.72 | 10d | 0.32 | 32 | MixedRecall |

**Answer cases (iter 4 — сценарій S4):** 8/10 correct, 1 slow, 1 wrong (`gate` wrong). Після S4 `gate` залишається єдиним critical.

---

### Milestone — Topic A Wave 1 «Слова вивчені»

**Контекст:** після ітерацій 0–4 + додаткових due-reviews (не показані окремо) Wave 1 досягає порогу.

| Metric | Target | Actual (oracle) |
|--------|--------|-----------------|
| Words with mastery ≥ 0.65 | ≥ 8/10 (80%) | **8/10** |
| Critical words | ≤ 2/10 (20%) | **2/10** (`gate`, `arrival`) |
| `canOpenNextWave()` | true | **true** |

**Mastery snapshot (milestone):**

| wordId | Mastery | State |
|--------|--------:| ----- |
| airport | 0.78 | MATURE |
| boarding-pass | 0.71 | MATURE |
| departure | 0.69 | MATURE |
| arrival | 0.58 | CONSOLIDATING |
| luggage | 0.67 | MATURE |
| flight | 0.66 | MATURE |
| reservation | 0.74 | MATURE |
| gate | 0.42 | CONSOLIDATING |
| passport | 0.70 | MATURE |
| train-station | 0.68 | MATURE |

> Wave 2 Topic A не розкривається в цьому doc — фокус на перехід до Topic B.

---

## §2 Topic B — Їжа

**Контекст:** Topic A Wave 1 завершена. Учень починає Topic B (`food`). Pre-seeded progress мінімальний — лише 2 слова частково знайомі (`menu`, `waiter` з контексту A не перетинаються).

### Ітерація 1 — перша сесія їжі

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | waiter | HighErrors | 0.00 | Due | 1.00 | 100 | Recognition |
| 2 | menu | Learning | 0.15 | Due | 0.82 | 82 | Recognition |
| 3 | bill | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 4 | tip | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 5 | reservation-food | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 6 | dessert | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 7 | appetizer | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 8 | order | Learning | 0.00 | New | 0.75 | 75 | Recognition |
| 9 | spicy | Learning | 0.00 | New | 0.75 | 75 | Recognition |
| 10 | delicious | MixedReview | 0.00 | New | 0.70 | 70 | Recognition |

**Exercise variants (iter 1 — приклади):**

| Word | Exercise | Prompt (PL) | Expected (UA) | Distractors (UA) |
| ---- | -------- | ----------- | --------------- | ---------------- |
| waiter | Recognition | kelner | офіціант | рахунок, меню, десерт |
| menu | Recognition | menu | меню | рахунок, чайові, закуска |
| bill | Recognition | rachunek | рахунок | меню, офіціант, десерт |
| order | Recognition | zamówić | замовити | смачний, гострий, чайові |
| reservation-food | Context | Chcę ______ stolik na 19:00. | rezerwacja stolika | napiwek, deser, menu |

**Answer cases (iter 1 — S1 food):**

| Word | Case | correct | responseTimeMs | Grade | Notes |
| ---- | ---- | ------- | -------------- | ----- | ----- |
| waiter | wrong | false | 3500 | Again | errorCount = 5 → max errorRisk |
| menu | normal correct | true | 2400 | Good | LEARNING |
| bill | normal correct | true | 2100 | Good | LEARNING |
| tip | slow correct | true | 5800 | Hard | |
| dessert | normal correct | true | 2200 | Good | |

---

### Ітерація 2 — due + weak

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | waiter | CriticalWeak | 0.18 | Due | 0.92 | 92 | Recall |
| 2 | menu | FsrsDue | 0.35 | Due | 0.72 | 72 | Recall |
| 3 | bill | Learning | 0.28 | Due | 0.68 | 68 | Recognition |
| 4 | tip | FsrsDue | 0.30 | Due | 0.65 | 65 | Recognition |
| 5 | dessert | Learning | 0.25 | 2d | 0.60 | 60 | Recall |
| 6 | appetizer | Learning | 0.22 | New | 0.58 | 58 | Recognition |
| 7 | order | Learning | 0.20 | New | 0.55 | 55 | Production |
| 8 | spicy | Learning | 0.18 | New | 0.52 | 52 | Recognition |
| 9 | reservation-food | Learning | 0.15 | New | 0.50 | 50 | Context |
| 10 | delicious | NewWord | 0.00 | New | 0.78 | 78 | Recognition |

---

### Ітерація 3 — consolidation

**Queue (oracle):**

| # | Word | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | waiter | CriticalWeak | 0.32 | Due | 0.78 | 78 | Production |
| 2 | menu | FsrsDue | 0.52 | Due | 0.62 | 62 | Recall |
| 3 | bill | FsrsDue | 0.48 | Due | 0.58 | 58 | Production |
| 4 | tip | MixedReview | 0.45 | 5d | 0.48 | 48 | Recognition |
| 5 | dessert | FsrsDue | 0.50 | Due | 0.55 | 55 | Recall |
| 6 | appetizer | Learning | 0.38 | 3d | 0.50 | 50 | Recall |
| 7 | order | WeakProduction | 0.40 | 3d | 0.52 | 52 | Production |
| 8 | spicy | Learning | 0.35 | 3d | 0.46 | 46 | Recognition |
| 9 | reservation-food | Learning | 0.32 | 3d | 0.44 | 44 | Context |
| 10 | delicious | Learning | 0.28 | 2d | 0.42 | 42 | Recognition |

---

### Milestone — Topic B Wave 1 «Слова вивчені»

| Metric | Target | Actual (oracle) |
|--------|--------|-----------------|
| Words with mastery ≥ 0.65 | ≥ 8/10 | **8/10** |
| Critical words | ≤ 2/10 | **1/10** (`waiter`) |
| `canOpenNextWave()` | true | **true** |

---

## §3 Topic C — Побут + Mixed Review

**Контекст:** Topic A і B Wave 1 завершені. Topic C відкриває 7 нових слів. Черга включає **inter-topic mixed review** з Topic A (newEngine §18).

### Ітерація 1 — 7 new + 3 mixed from A

**Queue (oracle):**

| # | Word | Topic | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | ----- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | breakfast | daily-life | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 2 | shopping | daily-life | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 3 | transport | daily-life | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 4 | appointment | daily-life | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 5 | neighbor | daily-life | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 6 | schedule | daily-life | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 7 | exercise | daily-life | NewWord | 0.00 | New | 0.80 | 80 | Recognition |
| 8 | airport | travel | MixedReview | 0.78 | Due | 0.55 | 55 | MixedRecall |
| 9 | boarding-pass | travel | MixedReview | 0.71 | 5d | 0.42 | 42 | Production |
| 10 | flight | travel | FsrsDue | 0.66 | Due | 0.48 | 48 | Context |

**TDD перевірки (iter 1):**

- Слова Topic A (`airport`, `boarding-pass`, `flight`) з'являються **без** `topicId` filter.
- 7 нових слів Topic C не витісняють overdue/due з Topic A (`flight` due залишається в queue).
- Mature слова A мають нижчий priority за NewWord (0.80).

**Exercise variants (iter 1 — mixed):**

| Word | Exercise | Prompt | Expected |
| ---- | -------- | ------ | -------- |
| breakfast | Recognition | śniadanie | сніданок |
| airport | MixedRecall | аеропорт → ? | lotnisko |
| boarding-pass | Production | посадковий талон | karta pokładowa |
| flight | Context | Mój ______ jest o 14:30. | lot |

**Answer cases (iter 1 — S1 daily-life):**

| Word | Case | correct | Grade | Notes |
| ---- | ---- | ------- | ----- | ----- |
| breakfast | normal correct | true | Good | LEARNING |
| airport | normal correct | true | Good | inter-topic recall PL |
| boarding-pass | slow correct | true | Hard | Production skill |
| flight | wrong | false | Again | FSRS Again, priority ↑ next session |

---

### Ітерація 2 — inter-topic mixed dominates

**Queue (oracle):**

| # | Word | Topic | Причина вибору | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | ----- | -------------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | flight | travel | FsrsDue | 0.60 | Due | 0.72 | 72 | Context |
| 2 | departure | travel | MixedReview | 0.69 | 7d | 0.38 | 38 | MixedRecall |
| 3 | luggage | travel | MixedReview | 0.67 | 10d | 0.35 | 35 | Production |
| 4 | breakfast | daily-life | Learning | 0.25 | 2d | 0.65 | 65 | Recall |
| 5 | shopping | daily-life | Learning | 0.22 | New | 0.62 | 62 | Recognition |
| 6 | transport | daily-life | Learning | 0.20 | New | 0.60 | 60 | Recognition |
| 7 | appointment | daily-life | Learning | 0.18 | New | 0.58 | 58 | Recall |
| 8 | neighbor | daily-life | Learning | 0.15 | New | 0.55 | 55 | Recognition |
| 9 | schedule | daily-life | Learning | 0.12 | New | 0.52 | 52 | Recognition |
| 10 | exercise | daily-life | Learning | 0.10 | New | 0.50 | 50 | Recognition |

**TDD перевірки:** слова A (`departure`, `luggage`) з'являються разом із словами C — mixed review не «прилипає» до однієї теми.

---

### Ітерація 3

**Queue (oracle):**

| # | Word | Topic | Причина | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | ----- | ------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | flight | travel | Overdue | 0.55 | Due +3d | 0.78 | 78 | Production |
| 2 | breakfast | daily-life | FsrsDue | 0.42 | Due | 0.58 | 58 | Recall |
| 3 | shopping | daily-life | FsrsDue | 0.38 | Due | 0.55 | 55 | Production |
| 4 | transport | daily-life | Learning | 0.35 | 3d | 0.52 | 52 | Recall |
| 5 | appointment | daily-life | Learning | 0.32 | 3d | 0.50 | 50 | Context |
| 6 | neighbor | daily-life | Learning | 0.28 | 2d | 0.48 | 48 | Recognition |
| 7 | schedule | daily-life | Learning | 0.25 | 2d | 0.46 | 46 | Recall |
| 8 | exercise | daily-life | Learning | 0.22 | 2d | 0.44 | 44 | Recognition |
| 9 | airport | travel | MixedReview | 0.75 | 14d | 0.30 | 30 | MixedRecall |
| 10 | boarding-pass | travel | MixedReview | 0.73 | 14d | 0.28 | 28 | Production |

---

### Ітерація 4 — баланс new C + review A

**Queue (oracle):**

| # | Word | Topic | Причина | Mastery | FSRS | PriorityScore | PriorityDisplay | Exercise |
| -: | ---- | ----- | ------- | ------: | ---- | ------------: | --------------: | -------- |
| 1 | flight | travel | CriticalWeak | 0.48 | Due | 0.75 | 75 | Production |
| 2 | breakfast | daily-life | FsrsDue | 0.55 | Due | 0.52 | 52 | Production |
| 3 | shopping | daily-life | FsrsDue | 0.52 | Due | 0.50 | 50 | Recall |
| 4 | transport | daily-life | FsrsDue | 0.48 | Due | 0.48 | 48 | Production |
| 5 | appointment | daily-life | Learning | 0.40 | 5d | 0.45 | 45 | Context |
| 6 | neighbor | daily-life | Learning | 0.38 | 5d | 0.42 | 42 | Recall |
| 7 | schedule | daily-life | Learning | 0.35 | 3d | 0.40 | 40 | Production |
| 8 | exercise | daily-life | Learning | 0.32 | 3d | 0.38 | 38 | Recognition |
| 9 | departure | travel | MixedReview | 0.70 | 14d | 0.28 | 28 | MixedRecall |
| 10 | reservation | travel | MixedReview | 0.74 | 14d | 0.25 | 25 | Context |

---

# Appendix A — Initial state JSON snapshots

### `topic-a-iter1-before`

Стан **до** ітерації 1 Topic A (`now = 2026-08-23T12:00:00.000Z`).

```json
{
  "studentId": "student-1",
  "topicId": "travel",
  "now": "2026-08-23T12:00:00.000Z",
  "words": [
    {
      "wordId": "boarding-pass",
      "state": "LEARNING",
      "mastery": 0.25,
      "skills": { "recognition": 0.40, "recall": 0.15, "production": 0.20, "context": 0.25 },
      "errorCount": 3,
      "consecutiveErrors": 0,
      "consecutiveCorrect": 1,
      "fsrsDue": "2026-08-23T11:00:00.000Z"
    },
    {
      "wordId": "gate",
      "state": "RELEARNING",
      "mastery": 0.00,
      "skills": { "recognition": 0.05, "recall": 0.00, "production": 0.00, "context": 0.00 },
      "errorCount": 5,
      "consecutiveErrors": 1,
      "consecutiveCorrect": 0,
      "fsrsDue": "2026-08-23T10:00:00.000Z"
    },
    {
      "wordId": "reservation",
      "state": "CONSOLIDATING",
      "mastery": 0.40,
      "skills": { "recognition": 0.55, "recall": 0.45, "production": 0.35, "context": 0.25 },
      "errorCount": 1,
      "consecutiveCorrect": 2,
      "fsrsDue": "2026-08-13T12:00:00.000Z"
    },
    {
      "wordId": "departure",
      "state": "CONSOLIDATING",
      "mastery": 0.44,
      "skills": { "recognition": 0.60, "recall": 0.50, "production": 0.30, "context": 0.35 },
      "errorCount": 0,
      "consecutiveCorrect": 2,
      "fsrsDue": "2026-08-23T11:30:00.000Z"
    },
    {
      "wordId": "airport",
      "state": "CONSOLIDATING",
      "mastery": 0.55,
      "skills": { "recognition": 0.75, "recall": 0.65, "production": 0.55, "context": 0.25 },
      "errorCount": 0,
      "consecutiveCorrect": 3,
      "fsrsDue": "2026-08-26T12:00:00.000Z"
    },
    {
      "wordId": "train-station",
      "state": "CONSOLIDATING",
      "mastery": 0.44,
      "skills": { "recognition": 0.60, "recall": 0.50, "production": 0.25, "context": 0.40 },
      "errorCount": 0,
      "consecutiveCorrect": 1,
      "fsrsDue": "2026-08-26T12:00:00.000Z"
    },
    {
      "wordId": "passport",
      "state": "CONSOLIDATING",
      "mastery": 0.44,
      "skills": { "recognition": 0.55, "recall": 0.50, "production": 0.22, "context": 0.50 },
      "errorCount": 0,
      "consecutiveCorrect": 1,
      "fsrsDue": "2026-08-26T12:00:00.000Z"
    },
    {
      "wordId": "luggage",
      "state": "NEW",
      "mastery": 0.00,
      "skills": { "recognition": 0.00, "recall": 0.00, "production": 0.00, "context": 0.00 },
      "errorCount": 0,
      "fsrsDue": null
    },
    {
      "wordId": "flight",
      "state": "NEW",
      "mastery": 0.00,
      "skills": { "recognition": 0.00, "recall": 0.00, "production": 0.00, "context": 0.00 },
      "errorCount": 0,
      "fsrsDue": null
    },
    {
      "wordId": "arrival",
      "state": "NEW",
      "mastery": 0.00,
      "skills": { "recognition": 0.00, "recall": 0.00, "production": 0.00, "context": 0.00 },
      "errorCount": 0,
      "fsrsDue": null
    }
  ]
}
```

### `topic-b-iter1-before`

```json
{
  "studentId": "student-1",
  "topicId": "food",
  "now": "2026-08-23T12:00:00.000Z",
  "words": [
    {
      "wordId": "waiter",
      "state": "RELEARNING",
      "mastery": 0.00,
      "skills": { "recognition": 0.05, "recall": 0.00, "production": 0.00, "context": 0.00 },
      "errorCount": 5,
      "fsrsDue": "2026-08-23T10:00:00.000Z"
    },
    {
      "wordId": "menu",
      "state": "LEARNING",
      "mastery": 0.15,
      "skills": { "recognition": 0.25, "recall": 0.10, "production": 0.10, "context": 0.10 },
      "errorCount": 1,
      "fsrsDue": "2026-08-23T11:00:00.000Z"
    }
  ],
  "remainingNew": ["bill", "tip", "reservation-food", "dessert", "appetizer", "order", "spicy", "delicious"]
}
```

### `topic-c-iter1-before`

```json
{
  "studentId": "student-1",
  "topicId": "daily-life",
  "now": "2026-08-23T12:00:00.000Z",
  "topicA_mature": ["airport", "boarding-pass", "departure", "luggage", "flight", "reservation", "passport", "train-station"],
  "topicC_new": ["breakfast", "shopping", "transport", "appointment", "neighbor", "schedule", "exercise"],
  "crossTopicDue": [
    { "wordId": "airport", "mastery": 0.78, "fsrsDue": "2026-08-23T11:00:00.000Z" },
    { "wordId": "flight", "mastery": 0.66, "fsrsDue": "2026-08-23T11:30:00.000Z" }
  ]
}
```

---

# Appendix B — Oracle queue index

| Section | Queue table |
|---------|-------------|
| §1 Topic A iter 0 | 10 × NewWord, Recognition |
| §1 Topic A iter 1 | mid-progress (reference oracle) |
| §1 Topic A iter 2 | weak + due focus |
| §1 Topic A iter 3 | consolidation |
| §1 Topic A iter 4 | mixed + polish |
| §2 Topic B iter 1–3 | food progression |
| §3 Topic C iter 1–4 | 7 new + mixed A |

Усі queue tables — **max 10 items**, **без дублікатів wordId** (newEngine §15).

---

# Appendix C — Answer-case after-states (deterministic)

### Topic A iter 1 → iter 2 (сценарій S1)

| wordId | mastery before | mastery after | state after | consecutiveErrors | notes |
|--------|---------------:|--------------:|-------------|------------------:|-------|
| boarding-pass | 0.25 | 0.38 | LEARNING | 0 | Recall + Good |
| gate | 0.00 | 0.00 | RELEARNING | 1 | Recognition wrong |
| reservation | 0.40 | 0.48 | CONSOLIDATING | 0 | Context + Hard |
| departure | 0.44 | 0.52 | CONSOLIDATING | 0 | Production + Good |
| airport | 0.55 | 0.62 | CONSOLIDATING | 0 | Context + Good |
| train-station | 0.44 | 0.50 | CONSOLIDATING | 0 | Production + Good |
| passport | 0.44 | 0.50 | CONSOLIDATING | 0 | Production + Hard |
| luggage | 0.00 | 0.22 | LEARNING | 0 | first Recognition |
| flight | 0.00 | 0.20 | LEARNING | 0 | first Recognition |
| arrival | 0.00 | 0.18 | LEARNING | 0 | first Recognition |

### Topic C iter 1 → iter 2 (сценарій S1 daily-life)

| wordId | mastery before | mastery after | state after | notes |
|--------|---------------:|--------------:|-------------|-------|
| breakfast | 0.00 | 0.25 | LEARNING | Recognition + Good |
| airport | 0.78 | 0.80 | MATURE | MixedRecall + Good |
| boarding-pass | 0.71 | 0.73 | MATURE | Production + Hard |
| flight | 0.66 | 0.60 | CONSOLIDATING | Context wrong → Again |

---

# Appendix D — Formula cheat sheet

### Mastery (приклад `boarding-pass` iter 1)

```
Recognition = 0.40, Recall = 0.15, Production = 0.20, Context = 0.25

Mastery = 0.40×0.20 + 0.15×0.30 + 0.20×0.30 + 0.25×0.20
        = 0.08 + 0.045 + 0.06 + 0.05
        = 0.235 ≈ 0.25 (rounded)
```

### Priority (приклад `boarding-pass` iter 1)

```
masteryRisk    = 1 - 0.25 = 0.75
errorRisk      = min(3/5, 1) = 0.60
overdueRisk    = min(1/7, 1) = 0.14   (due 1h ago)
weakSkillRisk  = 1 - 0.15 = 0.85     (Recall weakest)

priorityScore  = 0.75×0.35 + 0.60×0.25 + 0.14×0.20 + 0.85×0.20
               = 0.2625 + 0.15 + 0.028 + 0.17
               = 0.6105

→ oracle iter 1 uses boosted overdue (Due +10d for reservation, Due for boarding-pass)
  with adjusted inputs → priorityScore 0.95 (see snapshot errorCount/overdue)
```

### Priority (приклад `gate` iter 1 — max priority)

```
masteryRisk   = 1 - 0.00 = 1.00
errorRisk     = min(5/5, 1) = 1.00
overdueRisk   = min(2/7, 1) = 0.29   (due 2h ago)
weakSkillRisk = 1 - 0.00 = 1.00

priorityScore = 1.00×0.35 + 1.00×0.25 + 0.29×0.20 + 1.00×0.20
              = 0.35 + 0.25 + 0.058 + 0.20
              = 0.858

→ capped/adjusted to 1.00 in oracle (critical + RELEARNING boost — scenario contract)
```

### Overdue (приклад `reservation` Due +10d)

```
overdueDays  = 10
overdueScore = min(10/7, 1) = 1.00
```

---

# Appendix E — Test mapping

| Oracle section | Future test file | What to assert |
|----------------|------------------|----------------|
| §0 Mastery formula | `src/services/MasteryService.test.ts` | weighted mastery, weakest skill, word state |
| §0 Grade rules | `src/services/FsrsService.test.ts` | Again/Hard/Good/Easy, overdue, overdueScore |
| §0 Priority formula | `src/services/PriorityService.test.ts` | priorityScore, priorityDisplay, component risks |
| Exercise column | `src/services/ExerciseSelector.test.ts` | exercise per state/weakest skill |
| Wave milestone §1 | `src/services/WaveManager.test.ts` | canOpenNextWave 80%/20% rule |
| Queue tables §1–§3 | `src/services/ReviewQueueBuilder.test.ts` | max 10, no duplicates, slot balance |
| After-states App.C | `src/services/LearningEngine.test.ts` | submitAnswer → mastery/state/fsrs save |
| JSON snapshots App.A | `src/test/fixtures/scenarios/` | typed fixtures imported by tests |

### Fixture paths (наступний крок після doc)

```
src/test/fixtures/scenarios/
├── topic-a-iter1-before.json
├── topic-b-iter1-before.json
├── topic-c-iter1-before.json
├── topic-a-iter1-queue-expected.json
└── topic-a-s1-after-states.json
```

### Recommended TDD order

```
1. MasteryService      ← Appendix D mastery
2. FsrsService         ← Grade + overdue
3. PriorityService     ← Appendix D priority
4. ExerciseSelector    ← Exercise columns
5. WaveManager         ← Milestone tables
6. ReviewQueueBuilder  ← Appendix B queue oracles
7. LearningEngine      ← Appendix C after-states
```

---

## Посилання

- Архітектура і алгоритми: [newEngine.md](newEngine.md)
- Vitest config: [vitest.config.ts](vitest.config.ts)
