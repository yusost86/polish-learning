import { FC, useState } from "react";
import { StudentWord } from "../../domain/types";
import { InteractionKind } from "../GameScreen";
import { MasteryInfo } from "./MasteryInfo";

interface DifficultyBadgeProps {
  kind: InteractionKind;
  card: StudentWord
}
const DifficultyBadge: FC<DifficultyBadgeProps> = ({ kind, card }) => {
  const config: Record<InteractionKind, { label: string; dots: number; }> = {
    MULTIPLE_CHOICE: { label: 'Легко · вибір варіанту', dots: 1 },
    FILL_BLANK: { label: 'Середньо · впишіть букви', dots: 2 },
    TYPE_IN: { label: 'Складно · впишіть слово', dots: 3 },
  };
  const { label, dots } = config[kind];
  const [displayMaterInfo, setDisplayMasterInfo] = useState(false);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-faint)' }}  onClick={() => setDisplayMasterInfo(!displayMaterInfo)}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i <= dots ? 'var(--gold)' : 'var(--border)',
              }} />
          ))}
        </div>
        {label}
      </div>
      {displayMaterInfo && <MasteryInfo studentWord={card} accuracy={0} />}
    </>
  );
}

export default DifficultyBadge;