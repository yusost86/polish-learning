import type { StudentWord } from '../../domain/types';
import { Row, stateLabel } from '../WordDetailScreen';

interface MasteryInfoProps {
  studentWord: StudentWord | undefined;
  accuracy: number | null;
}
export function MasteryInfo({ studentWord, accuracy }: MasteryInfoProps) {
  const learning = studentWord?.learningProgress;

  return <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)', padding: '16px 18px' }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>Статистика по слову</div>
    <Row label="Стан" value={learning ? stateLabel(learning.state) : 'Нове'} />
    <Row label="Mastery" value={`${Math.round((learning?.mastery ?? 0) * 100)}%`} />
    {learning && <>
      <Row label="Розпізнавання" value={`${Math.round(learning.skills.recognition * 100)}%`} />
      <Row label="Відтворення" value={`${Math.round(learning.skills.recall * 100)}%`} />
      <Row label="Написання" value={`${Math.round(learning.skills.production * 100)}%`} />
      <Row label="Контекст" value={`${Math.round(learning.skills.context * 100)}%`} />
    </>}
    <Row label="Правильних" value={studentWord?.correctCount ?? 0} />
    <Row label="Неправильних" value={studentWord?.incorrectCount ?? 0} />
    {accuracy !== null && <Row label="Точність" value={`${accuracy}%`} />}
    <Row label="Поточний streak" value={studentWord?.consecutiveCorrect ?? 0} />
    <Row
      label="Наступне повторення"
      value={studentWord ? new Date(learning?.nextReviewAt ?? studentWord.fsrsCard.due).toLocaleString('uk-UA') : '—'} />
  </section>;
}
