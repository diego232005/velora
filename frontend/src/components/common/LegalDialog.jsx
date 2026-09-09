import { X } from 'lucide-react';
import { brand } from '../../config/brand';
import { useUi } from '../../context/UiContext';
import styles from './LegalDialog.module.css';

const content = {
  terms: {
    title: 'Términos y condiciones',
    body: `${brand.name} es una maquetación frontend de demostración. Estos términos son textos provisionales y no constituyen un contrato real. El acceso visual no implica cuenta, depósito ni apuesta.`,
  },
  privacy: {
    title: 'Política de privacidad',
    body: 'Esta demostración no envía ni almacena datos personales en un servidor. Los formularios solo validan información en el navegador y se descartan al recargar.',
  },
  responsible: {
    title: 'Juego responsable',
    body: `El servicio representado está pensado exclusivamente para mayores de ${brand.minAge} años. En una etapa futura, una operación real debería incluir límites, autoexclusión y recursos de ayuda. Esta versión no procesa dinero.`,
  },
};

export function LegalDialog() {
  const { legalDialog, setLegalDialog } = useUi();
  if (!legalDialog || !content[legalDialog]) return null;
  const current = content[legalDialog];

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => setLegalDialog(null)}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.top}>
          <h2 id="legal-title">{current.title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={() => setLegalDialog(null)}
            aria-label="Cerrar aviso legal"
          >
            <X size={18} />
          </button>
        </div>
        <p>{current.body}</p>
      </div>
    </div>
  );
}
