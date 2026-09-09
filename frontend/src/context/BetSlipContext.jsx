import { createContext, useContext, useMemo, useState } from 'react';
import { multiplyOdds } from '../utils/format';

const BetSlipContext = createContext(null);

export function BetSlipProvider({ children }) {
  const [selections, setSelections] = useState([]);
  const [stake, setStake] = useState('10');
  const [open, setOpen] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');

  const addSelection = (selection) => {
    setSelections((current) => {
      const exists = current.some((item) => item.oddId === selection.oddId);
      if (exists) {
        return current.filter((item) => item.oddId !== selection.oddId);
      }
      const withoutSameEvent = current.filter(
        (item) => item.eventId !== selection.eventId,
      );
      return [...withoutSameEvent, selection];
    });
    setOpen(true);
    setDemoMessage('');
  };

  const removeSelection = (oddId) => {
    setSelections((current) => current.filter((item) => item.oddId !== oddId));
  };

  const clearSelections = () => {
    setSelections([]);
    setDemoMessage('');
  };

  const placeDemoBet = () => {
    if (!selections.length) {
      setDemoMessage('Añade al menos una selección para continuar.');
      return;
    }
    const amount = Number(stake);
    if (!amount || amount <= 0) {
      setDemoMessage('Introduce un importe válido para esta demostración.');
      return;
    }
    setDemoMessage(
      'Esta es una demostración visual. No se ha procesado ninguna apuesta real.',
    );
  };

  const totalOdd = useMemo(
    () => multiplyOdds(selections.map((item) => item.odd)),
    [selections],
  );

  const potentialWin = useMemo(() => {
    const amount = Number(stake);
    if (!amount || !selections.length) return 0;
    return amount * totalOdd;
  }, [stake, selections.length, totalOdd]);

  const value = useMemo(
    () => ({
      selections,
      stake,
      setStake,
      open,
      setOpen,
      demoMessage,
      addSelection,
      removeSelection,
      clearSelections,
      placeDemoBet,
      totalOdd,
      potentialWin,
      isSelected: (oddId) => selections.some((item) => item.oddId === oddId),
    }),
    [selections, stake, open, demoMessage, totalOdd, potentialWin],
  );

  return (
    <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip debe usarse dentro de BetSlipProvider');
  }
  return context;
}
