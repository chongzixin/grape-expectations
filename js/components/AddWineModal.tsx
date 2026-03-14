import React from 'react';
import type { Wine, NewWineForm } from '../types';
import { RichText } from './RichText';

interface AddWineModalProps {
  showAdd: boolean;
  addTab: 'photo' | 'manual';
  setAddTab: (t: 'photo' | 'manual') => void;
  photoPreview: string | null;
  setPhotoPreview: (s: string | null) => void;
  scanLoading: boolean;
  scanMsg: string;
  scanMsgVisible: boolean;
  scannedWines: Partial<Wine>[];
  setScannedWines: (wines: Partial<Wine>[]) => void;
  previewIndex: number;
  setPreviewIndex: (i: number) => void;
  newWine: NewWineForm;
  setNewWine: React.Dispatch<React.SetStateAction<NewWineForm>>;
  localPairings: string[];
  setLocalPairings: (p: string[]) => void;
  pairingsLoading: boolean;
  windowLoading: boolean;
  scanNotes: { wine: string; winery: string; tasting: string } | null;
  setScanNotes: (n: { wine: string; winery: string; tasting: string } | null) => void;
  wantSommelierNotes: boolean;
  setWantSommelierNotes: (b: boolean) => void;
  handlePhoto: (file: File) => void;
  closeModal: () => void;
  advancePreview: (nextIdx: number) => void;
  confirmCurrentWine: () => void;
  addWine: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  galleryInputRef: React.RefObject<HTMLInputElement>;
}

const WINE_TYPES = ['Red', 'White', 'Sparkling', 'Rosé', 'Dessert', 'Fortified'];

export function AddWineModal({
  showAdd, addTab, setAddTab, photoPreview, setPhotoPreview,
  scanLoading, scanMsg, scanMsgVisible, scannedWines, setScannedWines,
  previewIndex, setPreviewIndex, newWine, setNewWine, localPairings,
  setLocalPairings, pairingsLoading, windowLoading, scanNotes, setScanNotes,
  wantSommelierNotes, setWantSommelierNotes, handlePhoto, closeModal,
  advancePreview, confirmCurrentWine, addWine, fileInputRef, galleryInputRef,
}: AddWineModalProps) {
  if (!showAdd) return null;

  const scannedWine = scannedWines[previewIndex] ?? null;
  const isMulti = scannedWines.length > 1;

  return (
    <div className="ge-modal-bg" onClick={e => e.target === e.currentTarget && closeModal()}>
      <div className="ge-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="ge-modal-ttl">✦ Add to Cellar</div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div className="mtabs">
          {([['photo', '📷 Scan Photo'], ['manual', '✍️ Manual Entry']] as [string, string][]).map(([t, l]) => (
            <button key={t} className={`mtab ${addTab === t ? 'on' : ''}`} onClick={() => setAddTab(t as 'photo' | 'manual')}>{l}</button>
          ))}
        </div>

        {addTab === 'photo' && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) { handlePhoto(e.target.files[0]); e.target.value = ''; } }} />
            <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) { handlePhoto(e.target.files[0]); e.target.value = ''; } }} />
            {!photoPreview ? (
              <div className="photo-drop">
                <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
                <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 4 }}>Scan Wine Label or Bottles</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 16 }}>Snap a single label, multiple bottles, or an invoice — we'll detect all wines</div>
                <div className="scan-upload-btns">
                  <button className="ge-btn btn-g" onClick={() => fileInputRef.current?.click()}>📷 Take Photo</button>
                  <button className="ge-btn btn-o" onClick={() => galleryInputRef.current?.click()}>🖼️ Upload from Gallery</button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 'var(--fs-sm)', color: 'var(--muted)', cursor: 'pointer', justifyContent: 'center', userSelect: 'none' }}>
                  <input type="checkbox" checked={wantSommelierNotes} onChange={e => setWantSommelierNotes(e.target.checked)} style={{ accentColor: 'var(--gold)', width: 14, height: 14, cursor: 'pointer' }} />
                  Include sommelier notes &amp; pairings
                  <span style={{ fontStyle: 'italic' }}>(takes a bit longer)</span>
                </label>
              </div>
            ) : (
              <div>
                <img src={photoPreview} style={{ width: '100%', borderRadius: 8, maxHeight: 160, objectFit: 'contain', background: 'var(--card)', marginBottom: 12 }} alt="Wine" />
                {scanLoading && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0' }}>
                    <div className="spin" />
                    <div className={`witty-msg${scanMsgVisible ? '' : ' wm-hidden'}`}>{scanMsg}</div>
                  </div>
                )}
                {!scanLoading && scannedWines.length > 0 && (
                  <>
                    {isMulti && (
                      <div className="scan-pagination">
                        <button
                          className="scan-page-btn"
                          disabled={previewIndex === 0}
                          onClick={() => {
                            const i = previewIndex - 1;
                            setPreviewIndex(i);
                            setNewWine({
                              name: '', winery: '', vintage: '', price: '',
                              style: '', country: '', region: '', subRegion: '', type: 'Red',
                              drinkFrom: '', drinkBy: '',
                              ...(Object.fromEntries(
                                Object.entries(scannedWines[i] as Record<string, unknown>).map(([k, v]) => [k, v ?? ''])
                              ) as Partial<NewWineForm>),
                              inventory: '1',
                            });
                            const wp = scannedWines[i] as Record<string, unknown>;
                            setLocalPairings((wp?.localPairings as string[]) || []);
                            setScanNotes(wp?.wineSummary || wp?.winerySummary || wp?.tastingNotes
                              ? { wine: (wp.wineSummary as string) || '', winery: (wp.winerySummary as string) || '', tasting: (wp.tastingNotes as string) || '' }
                              : null);
                          }}
                        >←</button>
                        <span className="scan-pagination-label">Wine {previewIndex + 1} of {scannedWines.length}</span>
                        <button
                          className="scan-page-btn"
                          disabled={previewIndex === scannedWines.length - 1}
                          onClick={() => {
                            const i = previewIndex + 1;
                            setPreviewIndex(i);
                            setNewWine({
                              name: '', winery: '', vintage: '', price: '',
                              style: '', country: '', region: '', subRegion: '', type: 'Red',
                              drinkFrom: '', drinkBy: '',
                              ...(Object.fromEntries(
                                Object.entries(scannedWines[i] as Record<string, unknown>).map(([k, v]) => [k, v ?? ''])
                              ) as Partial<NewWineForm>),
                              inventory: '1',
                            });
                            const wp = scannedWines[i] as Record<string, unknown>;
                            setLocalPairings((wp?.localPairings as string[]) || []);
                            setScanNotes(wp?.wineSummary || wp?.winerySummary || wp?.tastingNotes
                              ? { wine: (wp.wineSummary as string) || '', winery: (wp.winerySummary as string) || '', tasting: (wp.tastingNotes as string) || '' }
                              : null);
                          }}
                        >→</button>
                      </div>
                    )}
                    <div className="wine-preview-card">
                      <div className="wpc-scan-banner">✦ AI detected — review and edit if needed</div>
                      <div className="wpc-fields">
                        <div className="wpc-field wpc-full">
                          <label className="fl">Wine Name *</label>
                          <input className="fi" value={newWine.name} onChange={e => setNewWine(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chambolle-Musigny" />
                        </div>
                        <div className="wpc-field wpc-full">
                          <label className="fl">Winery / Producer</label>
                          <input className="fi" value={newWine.winery} onChange={e => setNewWine(p => ({ ...p, winery: e.target.value }))} placeholder="e.g. Domaine Mugnier" />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Vintage</label>
                          <input className="fi" value={newWine.vintage} onChange={e => setNewWine(p => ({ ...p, vintage: e.target.value }))} placeholder="e.g. 2019 or NV" />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Type</label>
                          <select className="fi" style={{ cursor: 'pointer' }} value={newWine.type} onChange={e => setNewWine(p => ({ ...p, type: e.target.value }))}>
                            {WINE_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Price (S$)</label>
                          <input className="fi" type="number" value={newWine.price} onChange={e => setNewWine(p => ({ ...p, price: e.target.value }))} placeholder="—" />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Varietal / Style</label>
                          <input className="fi" value={newWine.style} onChange={e => setNewWine(p => ({ ...p, style: e.target.value }))} placeholder="e.g. Pinot Noir" />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Country</label>
                          <input className="fi" value={newWine.country} onChange={e => setNewWine(p => ({ ...p, country: e.target.value }))} placeholder="e.g. France" />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Region</label>
                          <input className="fi" value={newWine.region} onChange={e => setNewWine(p => ({ ...p, region: e.target.value }))} placeholder="e.g. Burgundy" />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Sub-Region</label>
                          <input className="fi" value={newWine.subRegion} onChange={e => setNewWine(p => ({ ...p, subRegion: e.target.value }))} placeholder="e.g. Gevrey-Chambertin" />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Bottles</label>
                          <div className="inv">
                            <button className="ivb" onClick={() => setNewWine(p => ({ ...p, inventory: String(Math.max(1, parseInt(p.inventory) - 1)) }))}>−</button>
                            <span className="ivc">{newWine.inventory}</span>
                            <button className="ivb" onClick={() => setNewWine(p => ({ ...p, inventory: String(parseInt(p.inventory) + 1) }))}>+</button>
                          </div>
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Drink From</label>
                          <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2024" value={newWine.drinkFrom} onChange={e => setNewWine(p => ({ ...p, drinkFrom: e.target.value }))} />
                        </div>
                        <div className="wpc-field">
                          <label className="fl">Drink To</label>
                          <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2032" value={newWine.drinkBy} onChange={e => setNewWine(p => ({ ...p, drinkBy: e.target.value }))} />
                        </div>
                      </div>
                      {windowLoading && !newWine.drinkFrom && !newWine.drinkBy && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)', marginTop: 6 }}>
                          <div className="spin" /> Estimating drinking window…
                        </div>
                      )}
                      {pairingsLoading && !scanNotes && localPairings.length === 0 && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--muted)', fontSize: 'var(--fs-base)', marginTop: 12 }}>
                          <div className="spin" /> Preparing sommelier notes…
                        </div>
                      )}
                      {(scanNotes || localPairings.length > 0) && (
                        <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 8, padding: '10px 14px', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {scanNotes && (scanNotes.wine || scanNotes.winery || scanNotes.tasting) && (<>
                            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.5 }}>🍷 SOMMELIER NOTES</div>
                            {scanNotes.wine    && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={`**Wine:** ${scanNotes.wine}`} /></div>}
                            {scanNotes.winery  && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={`**Producer:** ${scanNotes.winery}`} /></div>}
                            {scanNotes.tasting && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={`**Tasting:** ${scanNotes.tasting}`} /></div>}
                          </>)}
                          {scanNotes && localPairings.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(201,168,76,0.25)', margin: '4px 0' }} />
                          )}
                          {localPairings.length > 0 && (<>
                            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.5 }}>🍜 LOCAL DISH PAIRINGS</div>
                            {localPairings.map((p, i) => (
                              <div key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--parch)', lineHeight: 1.65 }}><RichText text={p} /></div>
                            ))}
                          </>)}
                        </div>
                      )}
                    </div>
                    <div className="wpc-actions">
                      <button className="ge-btn btn-o" onClick={() => { setPhotoPreview(null); setScannedWines([]); setPreviewIndex(0); }}>
                        Try another
                      </button>
                      {isMulti && (
                        <button className="ge-btn btn-o" onClick={() => advancePreview(previewIndex + 1)}>
                          ✗ Skip
                        </button>
                      )}
                      <button className="ge-btn btn-g" onClick={confirmCurrentWine}>
                        ✓ {isMulti ? 'Add Wine' : 'Add to Cellar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {addTab === 'manual' && (
          <div>
            {scannedWine && (
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 'var(--fs-sm)', color: 'var(--gold)', marginBottom: 16 }}>
                {scannedWines.length > 1
                  ? `✦ Wine ${previewIndex + 1} of ${scannedWines.length} — verify and add to cellar`
                  : '✦ Pre-filled from label scan — please verify details'}
              </div>
            )}
            <div className="fg">
              <div className="ff full">
                <label className="fl">Wine Name *</label>
                <input className="fi" value={newWine.name} onChange={e => setNewWine(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chambolle-Musigny" />
              </div>
              <div className="ff full">
                <label className="fl">Winery / Producer</label>
                <input className="fi" value={newWine.winery} onChange={e => setNewWine(p => ({ ...p, winery: e.target.value }))} placeholder="e.g. Domaine Mugnier" />
              </div>
              <div className="ff">
                <label className="fl">Vintage</label>
                <input className="fi" value={newWine.vintage} onChange={e => setNewWine(p => ({ ...p, vintage: e.target.value }))} placeholder="e.g. 2019 or NV" />
              </div>
              <div className="ff">
                <label className="fl">Price (S$)</label>
                <input className="fi" type="number" value={newWine.price} onChange={e => setNewWine(p => ({ ...p, price: e.target.value }))} placeholder="e.g. 180" />
              </div>
              <div className="ff">
                <label className="fl">Type *</label>
                <select className="fi" style={{ cursor: 'pointer' }} value={newWine.type} onChange={e => setNewWine(p => ({ ...p, type: e.target.value }))}>
                  {WINE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="ff">
                <label className="fl">Varietal / Style</label>
                <input className="fi" value={newWine.style} onChange={e => setNewWine(p => ({ ...p, style: e.target.value }))} placeholder="e.g. Pinot Noir" />
              </div>
              <div className="ff">
                <label className="fl">Country</label>
                <input className="fi" value={newWine.country} onChange={e => setNewWine(p => ({ ...p, country: e.target.value }))} placeholder="e.g. France" />
              </div>
              <div className="ff">
                <label className="fl">Region</label>
                <input className="fi" value={newWine.region} onChange={e => setNewWine(p => ({ ...p, region: e.target.value }))} placeholder="e.g. Burgundy" />
              </div>
              <div className="ff">
                <label className="fl">Sub-Region</label>
                <input className="fi" value={newWine.subRegion} onChange={e => setNewWine(p => ({ ...p, subRegion: e.target.value }))} placeholder="e.g. Gevrey-Chambertin" />
              </div>
              <div className="ff">
                <label className="fl">Number of Bottles</label>
                <input className="fi" type="number" min="1" value={newWine.inventory} onChange={e => setNewWine(p => ({ ...p, inventory: e.target.value }))} />
              </div>
              <div className="ff">
                <label className="fl">Drink From</label>
                <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2024" value={newWine.drinkFrom} onChange={e => setNewWine(p => ({ ...p, drinkFrom: e.target.value }))} />
              </div>
              <div className="ff">
                <label className="fl">Drink To</label>
                <input className="fi" type="number" min="1900" max="2100" placeholder="e.g. 2032" value={newWine.drinkBy} onChange={e => setNewWine(p => ({ ...p, drinkBy: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              {scannedWines.length > 0
                ? <button className="ge-btn btn-o" onClick={() => setAddTab('photo')}>← Back to Preview</button>
                : <button className="ge-btn btn-o" onClick={closeModal}>Cancel</button>
              }
              <button className="ge-btn btn-g" onClick={addWine}>✦ Add to Cellar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
