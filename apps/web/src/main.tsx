import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {dictionary, locales} from '@venus/i18n';
import type {Locale} from '@venus/contracts';
import './style.css';
function App() {
  const [locale, setLocale] = useState<Locale>('ru');
  const [connection, setConnection] = useState<'idle'|'checking'|'ready'|'offline'>('idle');
  const [version, setVersion] = useState('0.0.0');
  const t = dictionary(locale);
  async function check() {
    setConnection('checking');
    try {
      const [health, metadata] = await Promise.all([
        fetch('/health/ready', {signal: AbortSignal.timeout(4000)}),
        fetch('/api/v1/version', {signal: AbortSignal.timeout(4000)})
      ]);
      if (!health.ok || !metadata.ok) throw new Error('unavailable');
      const data: unknown = await metadata.json();
      if (!data || typeof data !== 'object' || !('version' in data) || typeof data.version !== 'string') throw new Error('invalid');
      setVersion(data.version); setConnection('ready');
    } catch {setConnection('offline');}
  }
  return <main>
    <nav aria-label={t.language}><a className="brand" href="/">venus<span aria-hidden="true">✦</span></a>
      <div className="languages">{locales.map(value => <button key={value} lang={value} aria-pressed={locale === value} onClick={() => {setLocale(value); document.documentElement.lang = value;}}>{value.toUpperCase()}</button>)}</div>
    </nav>
    <section className="intro"><p className="eyebrow">{t.tagline}</p><h1>{t.title}</h1><p className="description">{t.description}</p>
      <p className="stage">{t.stage}</p>
    </section>
    <section className="status" aria-label={t.foundation}>
      <div><h2>{t.foundation}</h2><p>{t.unavailable}</p></div>
      <div className="connection"><p role="status">{connection === 'idle' ? `${t.version} ${version}` : t[connection]}</p><button disabled={connection === 'checking'} onClick={() => {void check();}}>{t.retry}</button></div>
    </section>
    <footer>Venus · {t.version} {version}</footer>
  </main>;
}
const root = document.getElementById('root');
if (root) createRoot(root).render(<App/>);
