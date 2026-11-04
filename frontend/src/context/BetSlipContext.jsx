import { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from './AuthContext';
import { multiplyOdds } from '../utils/odds';

const BetSlipContext = createContext(null);

export function BetSlipProvider({ children }) {
  const { token, isAuthenticated, user, refreshBalance } = useAuth();
  const [selections, setSelections] = useState([]);
  const [stake, setStake] = useState('10000');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [placing, setPlacing] = useState(false);

  const addSelection = (selection) => {
    setSelections((current) => {
      const exists = current.some((item) => item.oddId === selection.oddId);
      if (exists) {
        return current.filter((item) => item.oddId !== selection.oddId);
      }
      const conflict = current.some((item) => item.eventId === selection.eventId);
      if (conflict) {
        setMessage(
          'Solo una selección por partido en el combinado; se reemplazó la anterior.',
        );
      } else {
        setMessage('');
      }
      const withoutSameEvent = current.filter(
        (item) => item.eventId !== selection.eventId,
      );
      return [...withoutSameEvent, selection];
    });
    setOpen(true);
  };

  const removeSelection = (oddId) => {
    setSelections((current) => current.filter((item) => item.oddId !== oddId));
  };

  const clearSelections = () => {
    setSelections([]);
    setMessage('');
  };

  const placeBet = async () => {
    if (!selections.length) {
      setMessage('Añade al menos una selección para continuar.');
      return;
    }
    const amount = Number(stake);
    if (!amount || amount <= 0) {
      setMessage('Introduce un importe válido.');
      return;
    }
    if (!isAuthenticated || !token) {
      setMessage('Inicia sesión para confirmar la apuesta en el servidor.');
      return;
    }

    setPlacing(true);
    const idempotencyKey = `web-${user.id}-${Date.now()}-${selections.map((s) => s.oddId).join('-')}`;
    const result = await apiRequest('/api/bets/place', {
      method: 'POST',
      token,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        selectionIds: selections.map((s) => Number(s.oddId)),
        stake: amount,
        idempotencyKey,
      }),
    });
    setPlacing(false);

    if (!result.ok) {
      setMessage(result.data.error || 'El servidor rechazó la apuesta.');
      return;
    }

    setMessage(
      result.data.duplicate
        ? `Apuesta ya registrada (idempotencia). Cupón #${result.data.bet.id_cupon}`
        : `Apuesta confirmada. Cupón #${result.data.bet.id_cupon}`,
    );
    setSelections([]);
    await refreshBalance();
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
      message,
      setMessage,
      placing,
      addSelection,
      removeSelection,
      clearSelections,
      placeBet,
      totalOdd,
      potentialWin,
      isSelected: (oddId) => selections.some((item) => item.oddId === oddId),
    }),
    [selections, stake, open, message, placing, totalOdd, potentialWin, token, isAuthenticated],
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
