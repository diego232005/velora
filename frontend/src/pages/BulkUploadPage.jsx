import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { API_URL } from '../api/client';
import { FormMessage } from '../components/common/FormMessage';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { SectionHeader } from '../components/common/SectionHeader';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { isExcelFile, readExcelClients } from '../utils/readExcelClients';
import styles from './BulkUploadPage.module.css';

async function downloadFile(path, fallbackName) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error('No se pudo descargar el archivo.');
  }
  const blob = await response.blob();
  const header = response.headers.get('Content-Disposition') || '';
  const match = header.match(/filename="([^"]+)"/);
  const name = match ? match[1] : fallbackName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BulkUploadPage() {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleDownload = async (path, name) => {
    setError('');
    try {
      await downloadFile(path, name);
    } catch (downloadError) {
      setError(downloadError.message);
    }
  };

  const takeFile = async (nextFile) => {
    setError('');
    setSuccess('');
    setResult(null);

    if (!nextFile) return;
    if (!isExcelFile(nextFile)) {
      setFile(null);
      setRows([]);
      setError('Arrastra un archivo Excel .xlsx o .xls');
      return;
    }

    try {
      const parsed = await readExcelClients(nextFile);
      setFile(nextFile);
      setRows(parsed);
      if (!parsed.length) {
        setError('El Excel se leyó, pero no tiene filas de clientes.');
      }
    } catch {
      setFile(null);
      setRows([]);
      setError('No se pudo leer el Excel. Revisa que las columnas sean las de la plantilla.');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    takeFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setResult(null);

    if (!file) {
      setError('Arrastra un Excel a la zona de carga.');
      return;
    }

    const payload = new FormData();
    payload.append('file', file);
    setBusy(true);

    try {
      const response = await fetch(`${API_URL}/api/bulk/clients`, {
        method: 'POST',
        body: payload,
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || 'No se pudo importar el archivo.');
        return;
      }
      setSuccess(
        `Carga completada: ${data.createdCount} clientes creados y ${data.skippedCount} omitidos. Ya puedes cargar otro archivo.`,
      );
      setFile(null);
      setRows([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setError('No hay conexión con el servidor.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <section className={styles.page}>
        <SectionHeader
          eyebrow="Administración"
          title="Carga masiva de clientes"
        />
        <p className={styles.lead}>
          Arrastra un Excel a la zona de abajo. El sistema lo lee y muestra las
          filas antes de guardarlas en MySQL.
        </p>

        <div className={styles.actions}>
          <SecondaryButton
            onClick={() => handleDownload('/api/bulk/clients/template', 'plantilla_clientes.xlsx')}
          >
            <Download size={16} />
            Plantilla vacía
          </SecondaryButton>
          <PrimaryButton
            onClick={() => handleDownload('/api/bulk/clients/sample', 'clientes_aleatorios.xlsx')}
          >
            <FileSpreadsheet size={16} />
            Excel aleatorio
          </PrimaryButton>
        </div>

        <form className={styles.card} onSubmit={handleUpload}>
          <div
            className={`${styles.drop} ${dragging ? styles.dragging : ''} ${file ? styles.ready : ''}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={handleDrop}
          >
            <Upload size={28} aria-hidden="true" />
            <strong>
              {file ? file.name : 'Arrastra aquí tu archivo Excel'}
            </strong>
            <small>
              {file
                ? `${rows.length} filas leídas. Puedes soltar otro archivo para reemplazarlo.`
                : 'Suelta un .xlsx o .xls. También puedes hacer clic para buscarlo.'}
            </small>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                takeFile(event.dataTransfer.files?.[0]);
              }}
              onChange={(event) => takeFile(event.target.files?.[0] || null)}
            />
          </div>
          <PrimaryButton type="submit" disabled={busy || !file} fullWidth>
            {busy ? 'Importando...' : 'Guardar clientes en la base'}
          </PrimaryButton>
        </form>

        <FormMessage tone="success">{success}</FormMessage>
        <FormMessage tone="error">{error}</FormMessage>

        {rows.length > 0 && (
          <div className={styles.preview}>
            <h3>Archivo leído</h3>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Ciudad</th>
                    <th>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.line}-${row.correo}`}>
                      <td>{row.line}</td>
                      <td>
                        {row.nombres} {row.apellidos}
                      </td>
                      <td>{row.correo}</td>
                      <td>{row.ciudad}</td>
                      <td>
                        {row.tipo_documento} {row.numero_documento}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className={styles.report}>
            <p>
              Creados: <strong>{result.createdCount}</strong> · Omitidos:{' '}
              <strong>{result.skippedCount}</strong>
            </p>
            {result.created?.length > 0 && (
              <ul>
                {result.created.map((item) => (
                  <li key={`ok-${item.line}`}>
                    Fila {item.line}: {item.name} ({item.email})
                  </li>
                ))}
              </ul>
            )}
            {result.skipped?.length > 0 && (
              <ul className={styles.errors}>
                {result.skipped.map((item) => (
                  <li key={`err-${item.line}`}>
                    Fila {item.line}: {item.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
