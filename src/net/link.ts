// Liaison pair-à-pair entre deux navigateurs (jeu en ligne).
// Le moteur est déterministe : les deux joueurs créent la même partie (même graine, mêmes decks) puis
// s'échangent seulement leurs actions. Deux façons de se connecter :
// - PeerJS : un service gratuit met les deux navigateurs en relation grâce à un code court ;
// - copier-coller : aucun service externe, chaque joueur transmet un long code à l'autre.
import Peer, { type DataConnection } from 'peerjs';
import type { Action, Faction, PlayerId } from '../engine/types';

export const PROTOCOL = 1;

/** Un joueur en ligne : nom, deck, image de profil. */
export interface Seat { name: string; faction: Faction; deck: string[]; avatar?: string }

export type NetMsg =
  | { t: 'hello'; v: number; name: string; faction: Faction; deck: string[]; avatar?: string }
  | { t: 'start'; seed: string; hostSide: PlayerId; A: Seat; B: Seat }
  | { t: 'act'; n: number; a: Action }
  | { t: 'emote'; id: string }
  | { t: 'rematch' }
  | { t: 'bye' };

export interface Link {
  send(m: NetMsg): void;
  onMessage: ((m: NetMsg) => void) | null;
  onClose: (() => void) | null;
  close(): void;
}

const ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
export const webrtcAvailable = () => typeof RTCPeerConnection !== 'undefined';

// ---------- PeerJS ----------
const PREFIX = 'ligne-de-front-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newRoomCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

function wrapConn(conn: DataConnection, peer: Peer): Link {
  const link: Link = {
    send: m => conn.send(m),
    onMessage: null,
    onClose: null,
    close: () => { try { conn.close(); peer.destroy(); } catch { /* déjà fermée */ } },
  };
  conn.on('data', d => link.onMessage?.(d as NetMsg));
  conn.on('close', () => link.onClose?.());
  conn.on('error', () => link.onClose?.());
  peer.on('disconnected', () => { /* le service de mise en relation peut couper : la liaison directe continue */ });
  return link;
}

const peerError = (e: unknown) => {
  const type = (e as { type?: string }).type ?? '';
  if (type === 'peer-unavailable') return 'Aucune partie avec ce code. Vérifie le code, ou demande à l’hôte de relancer.';
  if (type === 'unavailable-id') return 'Ce code est déjà utilisé, réessaie.';
  if (type === 'network' || type === 'server-error' || type === 'socket-error') return 'Le service de mise en relation est injoignable. Essaie la connexion par codes à copier-coller.';
  if (type === 'browser-incompatible') return 'Ce navigateur (ou cette page) ne permet pas le jeu en ligne.';
  return `Connexion impossible (${type || String(e)}).`;
};

/** Hôte : ouvre une salle ; `onReady` reçoit le code à donner, `onLink` la liaison quand l'invité arrive. */
export function hostRoom(code: string, onReady: () => void, onLink: (l: Link) => void, onError: (msg: string) => void): () => void {
  const peer = new Peer(PREFIX + code, { config: { iceServers: ICE } });
  peer.on('open', onReady);
  peer.on('connection', conn => conn.on('open', () => onLink(wrapConn(conn, peer))));
  peer.on('error', e => onError(peerError(e)));
  return () => { try { peer.destroy(); } catch { /* rien */ } };
}

/** Invité : rejoint la salle d'un hôte par son code. */
export function joinRoom(code: string, onLink: (l: Link) => void, onError: (msg: string) => void): () => void {
  const peer = new Peer({ config: { iceServers: ICE } });
  peer.on('open', () => {
    const conn = peer.connect(PREFIX + code.trim().toUpperCase().replace(/^LDF-/, ''), { reliable: true, serialization: 'json' });
    conn.on('open', () => onLink(wrapConn(conn, peer)));
    conn.on('error', e => onError(peerError(e)));
  });
  peer.on('error', e => onError(peerError(e)));
  return () => { try { peer.destroy(); } catch { /* rien */ } };
}

// ---------- Copier-coller (WebRTC sans service externe) ----------
async function pack(desc: RTCSessionDescriptionInit): Promise<string> {
  const json = JSON.stringify({ type: desc.type, sdp: desc.sdp });
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return 'Z' + btoa(bin);
  }
  return 'J' + btoa(json);
}
async function unpack(code: string): Promise<RTCSessionDescriptionInit> {
  const c = code.replace(/\s+/g, '');
  if (c[0] === 'Z') {
    const bin = atob(c.slice(1));
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return JSON.parse(await new Response(stream).text());
  }
  return JSON.parse(atob(c.slice(1)));
}
function iceDone(pc: RTCPeerConnection): Promise<void> {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, 4000); // ne pas attendre indéfiniment : les candidats déjà trouvés suffisent souvent
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}
function wrapChannel(ch: RTCDataChannel, pc: RTCPeerConnection): Link {
  const link: Link = {
    send: m => ch.send(JSON.stringify(m)),
    onMessage: null,
    onClose: null,
    close: () => { try { ch.close(); pc.close(); } catch { /* déjà fermée */ } },
  };
  ch.onmessage = e => link.onMessage?.(JSON.parse(String(e.data)) as NetMsg);
  ch.onclose = () => link.onClose?.();
  return link;
}

/** Hôte, étape 1 : produit le code d'invitation. Étape 2 : `accept(codeRéponse)`. La liaison arrive par `onLink`. */
export async function manualHost(onLink: (l: Link) => void): Promise<{ offer: string; accept: (answer: string) => Promise<void> }> {
  const pc = new RTCPeerConnection({ iceServers: ICE });
  const ch = pc.createDataChannel('ldf', { ordered: true });
  ch.onopen = () => onLink(wrapChannel(ch, pc));
  await pc.setLocalDescription(await pc.createOffer());
  await iceDone(pc);
  return { offer: await pack(pc.localDescription!), accept: async answer => { await pc.setRemoteDescription(await unpack(answer)); } };
}

/** Invité : à partir du code d'invitation, produit le code de réponse à renvoyer à l'hôte. */
export async function manualJoin(offer: string, onLink: (l: Link) => void): Promise<string> {
  const pc = new RTCPeerConnection({ iceServers: ICE });
  pc.ondatachannel = e => { const ch = e.channel; ch.onopen = () => onLink(wrapChannel(ch, pc)); };
  await pc.setRemoteDescription(await unpack(offer));
  await pc.setLocalDescription(await pc.createAnswer());
  await iceDone(pc);
  return pack(pc.localDescription!);
}
