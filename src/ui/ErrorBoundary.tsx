// Filet de sécurité : si l'interface plante, on affiche l'erreur (pour une capture d'écran) au lieu d'un écran vide,
// avec de quoi revenir au jeu. La dernière erreur est aussi gardée dans le navigateur (localStorage « ldf-last-error »).
import { Component, type ReactNode } from 'react';
import { APP_VERSION } from '../version';

interface State { error: Error | null; info: string }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null, info: '' };
  static getDerivedStateFromError(error: Error): Partial<State> { return { error }; }
  override componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    const stack = (info.componentStack ?? '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 6).join(' ← ');
    this.setState({ info: stack });
    try { localStorage.setItem('ldf-last-error', JSON.stringify({ at: new Date().toISOString(), version: APP_VERSION, message: String(error?.message ?? error), stack: String(error?.stack ?? '').slice(0, 2000), components: stack })); } catch { /* stockage indisponible */ }
    console.error('Ligne de Front — erreur d’interface', error, info.componentStack);
  }
  override render(): ReactNode {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="crash">
        <h1>Oups, l’interface a planté</h1>
        <p>Fais une capture de cet écran et envoie-la : elle dit où chercher. Ta collection et ta campagne sont sauvegardées.</p>
        <pre>{`Version ${APP_VERSION}\n${error.message}\n\n${(error.stack ?? '').split('\n').slice(0, 8).join('\n')}\n\nComposants : ${info}`}</pre>
        <div className="choices row">
          <button type="button" onClick={() => this.setState({ error: null, info: '' })}>Réessayer</button>
          <button type="button" className="primary" onClick={() => location.reload()}>Recharger le jeu</button>
        </div>
      </div>
    );
  }
}
