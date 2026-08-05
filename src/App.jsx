import { Bike } from 'lucide-react'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
  },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--color-primary)',
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    fontWeight: 700,
  },
  tagline: {
    marginTop: 'var(--space-3)',
    color: 'var(--color-muted)',
    fontSize: 13.5,
  },
  cta: {
    marginTop: 'var(--space-5)',
    background: 'var(--color-accent)',
    color: '#fff',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    fontSize: 13.5,
    padding: '12px 24px',
    transition: 'opacity 0.3s ease',
  },
}

export default function App() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.logo}>
          <Bike size={26} strokeWidth={2.2} />
          Pídelo
        </span>
        <p style={styles.tagline}>
          Tu domicilio, en camino. Proyecto en construcción — cada cambio que
          guardes se refleja aquí al instante.
        </p>
        <button style={styles.cta} onClick={() => alert('¡Funciona! 🛵')}>
          Probar
        </button>
      </div>
    </div>
  )
}
