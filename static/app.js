/**
 * BeautySync Dynamic Mobile Updates Portal
 * Frontend Controller — multi-media upload, lightbox viewer, live preview.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM refs ──────────────────────────────────────────────────────
    const campaignForm      = document.getElementById('campaign-form');
    const versionInput      = document.getElementById('version_code');
    const startDateInput    = document.getElementById('start_date');
    const endDateInput      = document.getElementById('end_date');
    const mediaContainer    = document.getElementById('media-items-container');
    const mediaEmptyHint    = document.getElementById('media-empty-hint');
    const addImageBtn       = document.getElementById('add-image-btn');
    const addVideoBtn       = document.getElementById('add-video-btn');
    const submitBtn         = document.getElementById('submit-btn');
    const refreshBtn        = document.getElementById('refresh-btn');

    // Mockup
    const mockupBadge       = document.getElementById('mockup-version-badge');
    const mockupMedia       = document.getElementById('mockup-media-container');
    const mockupPlaceholder = document.getElementById('mockup-placeholder');
    const mockupDesc        = document.getElementById('mockup-description-overlay');
    const mockupCount       = document.getElementById('mockup-media-count');
    const mockupTitle       = document.getElementById('mockup-footer-title');
    const mockupStart       = document.getElementById('mockup-start-date');
    const mockupEnd         = document.getElementById('mockup-end-date');
    const mockupPrev        = document.getElementById('mockup-prev');
    const mockupNext        = document.getElementById('mockup-next');
    const mockupDots        = document.getElementById('mockup-dots');

    // Stats
    const statTotal  = document.getElementById('stat-total');
    const statActive = document.getElementById('stat-active');
    const statHits   = document.getElementById('stat-hits');
    const statMedia  = document.getElementById('stat-media');

    // Table
    const tableBody  = document.getElementById('campaigns-table-body');
    const toastBox   = document.getElementById('toast-container');

    // Lightbox
    const lightbox      = document.getElementById('lightbox');
    const lbBackdrop    = document.getElementById('lightbox-backdrop');
    const lbClose       = document.getElementById('lightbox-close');
    const lbTitle       = document.getElementById('lightbox-title');
    const lbSubtitle    = document.getElementById('lightbox-subtitle');
    const lbMain        = document.getElementById('lightbox-main');
    const lbStrip       = document.getElementById('lightbox-strip');
    const lbPrev        = document.getElementById('lb-prev');
    const lbNext        = document.getElementById('lb-next');
    const lbCounter     = document.getElementById('lb-counter');

    // ── State ─────────────────────────────────────────────────────────
    let mediaItems    = [];
    let mediaIdCtr    = 0;
    let mockupIdx     = 0;
    let lbItems       = [];
    let lbIdx         = 0;


    // ── Helpers ───────────────────────────────────────────────────────
    const pad = n => String(n).padStart(2, '0');
    const fmtDT = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const fmtDisplay = iso => {
        if (!iso) return '--';
        return new Date(iso).toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    };
    const fmtFull = iso => new Date(iso).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

    // ── Default dates ─────────────────────────────────────────────────
    const initDates = () => {
        const now = new Date(), next = new Date();
        next.setDate(now.getDate() + 7);
        startDateInput.value = fmtDT(now);
        endDateInput.value   = fmtDT(next);
        syncMockupDates();
    };

    // ── Mockup sync ───────────────────────────────────────────────────
    const syncMockupVersion = () => {
        const v = versionInput.value.trim();
        mockupBadge.textContent = v ? `v${v}` : 'v1.0.0';
        mockupTitle.textContent = v ? `Update Available (v${v})` : 'New Update Alert';
    };

    const syncMockupDates = () => {
        mockupStart.textContent = fmtDisplay(startDateInput.value);
        mockupEnd.textContent   = fmtDisplay(endDateInput.value);
    };

    const syncPills = val => {
        document.querySelectorAll('.version-pill').forEach(p =>
            p.classList.toggle('active', p.dataset.version.toLowerCase() === val.trim().toLowerCase())
        );
    };

    versionInput.addEventListener('input', () => { syncMockupVersion(); syncPills(versionInput.value); });
    startDateInput.addEventListener('change', syncMockupDates);
    endDateInput.addEventListener('change', syncMockupDates);

    document.querySelectorAll('.version-pill').forEach(p => p.addEventListener('click', () => {
        versionInput.value = p.dataset.version;
        syncMockupVersion(); syncPills(p.dataset.version);
    }));


    // ── Mockup media preview ──────────────────────────────────────────
    const renderMockup = () => {
        mockupMedia.innerHTML = '';
        mockupDots.innerHTML  = '';
        const items = mediaItems.filter(m => m.file);

        if (!items.length) {
            mockupMedia.style.display = 'none';
            mockupPlaceholder.style.display = 'flex';
            mockupDesc.style.display  = 'none';
            mockupCount.style.display = 'none';
            mockupPrev.style.display  = 'none';
            mockupNext.style.display  = 'none';
            return;
        }

        if (mockupIdx >= items.length) mockupIdx = 0;
        if (mockupIdx < 0) mockupIdx = items.length - 1;

        const cur = items[mockupIdx];
        const url = URL.createObjectURL(cur.file);

        if (cur.type === 'video') {
            const v = document.createElement('video');
            v.src = url; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
            mockupMedia.appendChild(v);
        } else {
            const img = document.createElement('img');
            img.src = url;
            mockupMedia.appendChild(img);
        }

        mockupMedia.style.display = 'block';
        mockupPlaceholder.style.display = 'none';

        const desc = cur.description.trim();
        mockupDesc.textContent = desc;
        mockupDesc.style.display = desc ? 'block' : 'none';

        const multi = items.length > 1;
        mockupCount.textContent = `${mockupIdx + 1} / ${items.length}`;
        mockupCount.style.display = multi ? 'block' : 'none';
        mockupPrev.style.display  = multi ? 'flex' : 'none';
        mockupNext.style.display  = multi ? 'flex' : 'none';

        // Dots
        items.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'mockup-dot' + (i === mockupIdx ? ' active' : '');
            dot.addEventListener('click', () => { mockupIdx = i; renderMockup(); });
            mockupDots.appendChild(dot);
        });
    };

    mockupPrev.addEventListener('click', () => { mockupIdx--; renderMockup(); });
    mockupNext.addEventListener('click', () => { mockupIdx++; renderMockup(); });


    // ── Dynamic media cards ───────────────────────────────────────────
    const addMedia = type => {
        const id   = ++mediaIdCtr;
        const item = { id, type, file: null, description: '' };
        mediaItems.push(item);
        if (mediaEmptyHint) mediaEmptyHint.style.display = 'none';
        renderCard(item);
    };

    addImageBtn.addEventListener('click', () => addMedia('image'));
    addVideoBtn.addEventListener('click', () => addMedia('video'));

    // ── Global drop zone on the whole media container ─────────────────
    // Dropping multiple files here auto-creates a card per file
    const mediaSection = mediaContainer.closest('.form-group') || mediaContainer.parentElement;

    ['dragenter','dragover'].forEach(ev => mediaContainer.addEventListener(ev, e => {
        e.preventDefault(); e.stopPropagation();
        mediaContainer.classList.add('container-dragover');
    }));
    ['dragleave','drop'].forEach(ev => mediaContainer.addEventListener(ev, e => {
        e.preventDefault(); e.stopPropagation();
        mediaContainer.classList.remove('container-dragover');
    }));
    mediaContainer.addEventListener('drop', e => {
        const files = Array.from(e.dataTransfer.files);
        if (!files.length) return;
        // If dropped onto an existing empty card zone, let that card handle it
        if (e.target.closest('.media-upload-zone')) return;
        // Otherwise bulk-create cards for all dropped files
        files.forEach(file => {
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            const id   = ++mediaIdCtr;
            const item = { id, type, file: null, description: '' };
            mediaItems.push(item);
            if (mediaEmptyHint) mediaEmptyHint.style.display = 'none';
            renderCard(item);
            // Immediately assign the file to the new card
            const card = mediaContainer.querySelector(`[data-media-id="${id}"]`);
            const zone = card?.querySelector('.media-upload-zone');
            if (zone) pickFile(item, file, zone);
        });
    });

    const renderCard = item => {
        const isImg = item.type === 'image';
        const card  = document.createElement('div');
        card.className = `media-card ${item.type}`;
        card.dataset.mediaId = item.id;

        const iconSvg = isImg
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;

        card.innerHTML = `
            <div class="media-card-header">
                <span class="media-type-badge ${item.type}">${iconSvg} ${isImg ? 'Image' : 'Video'}</span>
                <button type="button" class="media-remove-btn" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="media-card-body">
                <div class="media-upload-zone" data-media-id="${item.id}">
                    <div class="upload-icon">${iconSvg}</div>
                    <div class="upload-text"><strong>Click to Upload</strong> or drag & drop</div>
                    <span class="hint-text" style="margin-top:3px;">${isImg ? 'PNG, JPG, WEBP, GIF' : 'MP4, WEBM, MOV'} · Max 100 MB</span>
                    <input type="file" class="media-file-input" accept="${isImg ? 'image/*' : 'video/*'}" multiple data-media-id="${item.id}">
                </div>
                <input type="text" class="media-description-input" placeholder="Optional caption / description..." data-media-id="${item.id}">
            </div>`;

        mediaContainer.appendChild(card);

        const zone      = card.querySelector('.media-upload-zone');
        const fileInput = card.querySelector('.media-file-input');
        const descInput = card.querySelector('.media-description-input');
        const removeBtn = card.querySelector('.media-remove-btn');

        zone.addEventListener('click', e => { if (e.target !== fileInput) fileInput.click(); });

        // Handle multiple files selected via file picker
        fileInput.addEventListener('change', () => {
            const files = Array.from(fileInput.files);
            if (!files.length) return;
            // First file goes into this card
            pickFile(item, files[0], zone);
            // Extra files each get a new card
            files.slice(1).forEach(file => {
                const type   = file.type.startsWith('video/') ? 'video' : 'image';
                const newId  = ++mediaIdCtr;
                const newItem = { id: newId, type, file: null, description: '' };
                mediaItems.push(newItem);
                renderCard(newItem);
                const newCard = mediaContainer.querySelector(`[data-media-id="${newId}"]`);
                const newZone = newCard?.querySelector('.media-upload-zone');
                if (newZone) pickFile(newItem, file, newZone);
            });
        });

        // Per-card drag & drop — also supports multiple files dropped on one card
        ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); zone.classList.add('dragover'); }));
        ['dragleave'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); zone.classList.remove('dragover'); }));
        zone.addEventListener('drop', e => {
            e.preventDefault(); e.stopPropagation();
            zone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            if (!files.length) return;
            // First file fills this card
            pickFile(item, files[0], zone);
            // Extra files get new cards
            files.slice(1).forEach(file => {
                const type    = file.type.startsWith('video/') ? 'video' : 'image';
                const newId   = ++mediaIdCtr;
                const newItem = { id: newId, type, file: null, description: '' };
                mediaItems.push(newItem);
                if (mediaEmptyHint) mediaEmptyHint.style.display = 'none';
                renderCard(newItem);
                const newCard = mediaContainer.querySelector(`[data-media-id="${newId}"]`);
                const newZone = newCard?.querySelector('.media-upload-zone');
                if (newZone) pickFile(newItem, file, newZone);
            });
        });

        descInput.addEventListener('input', () => { item.description = descInput.value; renderMockup(); });
        removeBtn.addEventListener('click', () => {
            mediaItems = mediaItems.filter(m => m.id !== item.id);
            card.remove();
            if (!mediaItems.length && mediaEmptyHint) mediaEmptyHint.style.display = 'flex';
            renderMockup();
        });
    };


    const pickFile = (item, file, zone) => {
        const isImg = item.type === 'image';
        if (!(isImg ? file.type.startsWith('image/') : file.type.startsWith('video/'))) {
            showToast(`Please select a valid ${item.type} file.`, 'error'); return;
        }
        if (file.size > 100 * 1024 * 1024) { showToast('File must be under 100 MB.', 'error'); return; }

        item.file = file;
        zone.querySelector('.preview-overlay')?.remove();

        const overlay  = document.createElement('div');
        overlay.className = 'preview-overlay';

        let el;
        if (isImg) {
            el = document.createElement('img');
            el.src = URL.createObjectURL(file);
        } else {
            el = document.createElement('video');
            el.src = URL.createObjectURL(file);
            el.muted = true; el.playsInline = true;
            zone.addEventListener('mouseenter', () => el.play());
            zone.addEventListener('mouseleave', () => el.pause());
        }

        const details = document.createElement('div');
        details.className = 'preview-details';
        const shortName = file.name.length > 20 ? file.name.slice(0, 20) + '…' : file.name;
        const sizeMB    = (file.size / (1024 * 1024)).toFixed(2);

        const changeBtn = document.createElement('button');
        changeBtn.className = 'remove-preview-btn';
        changeBtn.type = 'button';
        changeBtn.textContent = 'Change';
        changeBtn.addEventListener('click', e => {
            e.stopPropagation();
            overlay.remove();
            item.file = null;
            zone.querySelector('.media-file-input').value = '';
            renderMockup();
        });

        details.innerHTML = `<span>${shortName} <em style="color:var(--text-secondary)">(${sizeMB} MB)</em></span>`;
        details.appendChild(changeBtn);
        overlay.appendChild(el);
        overlay.appendChild(details);
        zone.appendChild(overlay);
        renderMockup();
    };


    // ── Toast ─────────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icon = type === 'success'
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        t.innerHTML = `${icon}<span class="toast-message">${msg}</span>`;
        toastBox.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4000);
    };

    // ── API ───────────────────────────────────────────────────────────
    const fetchStats = async () => {
        try {
            const r = await fetch('/api/stats');
            const d = await r.json();
            if (d.status === 'success') {
                statTotal.textContent = d.stats.total_campaigns;
                statActive.textContent = d.stats.active_campaigns;
                statHits.textContent  = d.stats.total_api_hits;
                statMedia.textContent = d.stats.total_media_items;
            }
        } catch(e) { console.error(e); }
    };

    const fetchCampaigns = async () => {
        try {
            const r = await fetch('/api/updates');
            const d = await r.json();
            if (d.status === 'success') renderTable(d.data);
            else showToast('Failed to load campaigns.', 'error');
        } catch(e) { showToast('Server connection error.', 'error'); }
    };

    const deleteCampaign = async id => {
        try {
            const r = await fetch(`/api/updates/${id}`, { method: 'DELETE' });
            const d = await r.json();
            if (d.status === 'success') { showToast('Campaign deleted.'); fetchCampaigns(); fetchStats(); }
            else showToast(d.message || 'Delete failed.', 'error');
        } catch(e) { showToast('Server error.', 'error'); }
    };

    refreshBtn.addEventListener('click', () => { fetchCampaigns(); fetchStats(); showToast('Refreshed.'); });


    // ── Render table ──────────────────────────────────────────────────
    const renderTable = campaigns => {
        tableBody.innerHTML = '';
        if (!campaigns?.length) {
            tableBody.innerHTML = `<tr><td colspan="6" class="empty-table">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <p>No campaigns yet.</p><p style="font-size:.75rem;margin-top:.25rem;">Create one above to get started.</p>
            </td></tr>`;
            return;
        }

        const now = new Date();
        campaigns.forEach(c => {
            const start = new Date(c.start_date), end = new Date(c.end_date);
            let status = 'expired', statusText = 'Expired';
            if (now >= start && now <= end) { status = 'active'; statusText = 'Active'; }
            else if (now < start) { status = 'scheduled'; statusText = 'Scheduled'; }

            const media    = c.media || [];
            const imgCount = media.filter(m => m.type === 'image').length;
            const vidCount = media.filter(m => m.type === 'video').length;
            const firstImg = media.find(m => m.type === 'image');
            const firstVid = media.find(m => m.type === 'video');

            // Thumbnail
            let thumb = `<div class="thumbnail-box no-media"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
            if (firstImg) thumb = `<div class="thumbnail-box"><img src="${firstImg.url}" alt="thumb" loading="lazy"></div>`;
            else if (firstVid || c.video_url) thumb = `<div class="thumbnail-box vid-thumb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>`;
            else if (c.image_url) thumb = `<div class="thumbnail-box"><img src="${c.image_url}" alt="thumb" loading="lazy"></div>`;

            // Media pills
            const pills = [];
            if (imgCount) pills.push(`<span class="media-pill img">${imgCount} img</span>`);
            if (vidCount) pills.push(`<span class="media-pill vid">${vidCount} vid</span>`);
            const pillsHtml = pills.length ? `<div class="media-pills-row">${pills.join('')}</div>` : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="table-media-preview">
                        ${thumb}
                        <div>
                            <span class="campaign-version">v${c.version_code}</span>
                            <div class="campaign-id">Campaign #${c.id}</div>
                        </div>
                    </div>
                </td>
                <td>${pillsHtml || '<span style="color:var(--text-secondary);font-size:.75rem;">—</span>'}</td>
                <td><span class="status-badge ${status}"><span class="badge-dot"></span>${statusText}</span></td>
                <td>
                    <div class="date-container">
                        <div><span class="date-label">START</span> ${fmtFull(c.start_date)}</div>
                        <div><span class="date-label">END</span> ${fmtFull(c.end_date)}</div>
                    </div>
                </td>
                <td><span class="hits-count">${c.api_hits}</span><span class="hits-label"> hits</span></td>
                <td>
                    <div class="action-btns">
                        <button class="view-btn" data-id="${c.id}" title="View Media">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button class="delete-btn" data-id="${c.id}" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                </td>`;

            tr.querySelector('.view-btn').addEventListener('click', () => openLightbox(c));
            tr.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm(`Delete campaign #${c.id}?`)) await deleteCampaign(c.id);
            });

            tableBody.appendChild(tr);
        });
    };


    // ── Lightbox ──────────────────────────────────────────────────────
    const openLightbox = campaign => {
        const media = campaign.media || [];
        // Fallback to legacy fields
        if (!media.length) {
            if (campaign.image_url) media.push({ type:'image', url: campaign.image_url, description: campaign.image_description || '' });
            if (campaign.video_url) media.push({ type:'video', url: campaign.video_url, description: campaign.video_description || '' });
        }
        if (!media.length) { showToast('No media attached to this campaign.', 'error'); return; }

        lbItems = media;
        lbIdx   = 0;
        lbTitle.textContent    = `Campaign #${campaign.id} — v${campaign.version_code}`;
        lbSubtitle.textContent = `${media.length} media file${media.length > 1 ? 's' : ''}`;

        renderLightbox();
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    const renderLightbox = () => {
        const item = lbItems[lbIdx];
        lbMain.innerHTML = '';
        lbCounter.textContent = `${lbIdx + 1} / ${lbItems.length}`;

        if (item.type === 'video') {
            const v = document.createElement('video');
            v.src = item.url; v.controls = true; v.autoplay = true; v.muted = false;
            v.style.cssText = 'max-width:100%;max-height:100%;border-radius:12px;';
            lbMain.appendChild(v);
        } else {
            const img = document.createElement('img');
            img.src = item.url;
            img.style.cssText = 'max-width:100%;max-height:100%;border-radius:12px;object-fit:contain;';
            lbMain.appendChild(img);
        }

        if (item.description) {
            const cap = document.createElement('div');
            cap.className = 'lb-caption';
            cap.textContent = item.description;
            lbMain.appendChild(cap);
        }

        // Strip thumbnails
        lbStrip.innerHTML = '';
        lbItems.forEach((m, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'lb-thumb' + (i === lbIdx ? ' active' : '');
            if (m.type === 'image') {
                const img = document.createElement('img');
                img.src = m.url; img.loading = 'lazy';
                thumb.appendChild(img);
            } else {
                thumb.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
                thumb.classList.add('vid');
            }
            thumb.addEventListener('click', () => { lbIdx = i; renderLightbox(); });
            lbStrip.appendChild(thumb);
        });

        lbPrev.disabled = lbIdx === 0;
        lbNext.disabled = lbIdx === lbItems.length - 1;
    };

    const closeLightbox = () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
        lbMain.innerHTML = '';
    };

    lbClose.addEventListener('click', closeLightbox);
    lbBackdrop.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => { if (lbIdx > 0) { lbIdx--; renderLightbox(); } });
    lbNext.addEventListener('click', () => { if (lbIdx < lbItems.length - 1) { lbIdx++; renderLightbox(); } });

    document.addEventListener('keydown', e => {
        if (lightbox.style.display !== 'none') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft' && lbIdx > 0) { lbIdx--; renderLightbox(); }
            if (e.key === 'ArrowRight' && lbIdx < lbItems.length - 1) { lbIdx++; renderLightbox(); }
        }
    });


    // ── Form submit ───────────────────────────────────────────────────
    campaignForm.addEventListener('submit', async e => {
        e.preventDefault();

        const version = versionInput.value.trim();
        const start   = new Date(startDateInput.value);
        const end     = new Date(endDateInput.value);

        if (!version) { showToast('Please enter a target version code.', 'error'); return; }
        if (end <= start) { showToast('End date must be after start date.', 'error'); return; }

        const images = mediaItems.filter(m => m.type === 'image' && m.file);
        const videos = mediaItems.filter(m => m.type === 'video' && m.file);

        if (!images.length && !videos.length) {
            showToast('Add at least one image or video.', 'error'); return;
        }

        const fd = new FormData();
        fd.append('version_code', version);
        fd.append('start_date', startDateInput.value);
        fd.append('end_date', endDateInput.value);
        images.forEach(m => { fd.append('images', m.file); fd.append('image_descriptions', m.description); });
        videos.forEach(m => { fd.append('videos', m.file); fd.append('video_descriptions', m.description); });

        const origHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = `<svg class="spin-icon" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80,200" stroke-linecap="round"/></svg> Uploading…`;
        submitBtn.disabled = true;

        try {
            const r = await fetch('/api/updates', { method: 'POST', body: fd });
            const d = await r.json();
            if (r.ok && d.status === 'success') {
                showToast('Campaign deployed successfully!');
                campaignForm.reset();
                mediaItems = []; mockupIdx = 0;
                mediaContainer.innerHTML = '';
                if (mediaEmptyHint) { mediaContainer.appendChild(mediaEmptyHint); mediaEmptyHint.style.display = 'flex'; }
                initDates(); syncMockupVersion(); syncPills(''); renderMockup();
                fetchCampaigns(); fetchStats();
            } else {
                showToast(d.message || 'Upload failed.', 'error');
            }
        } catch(err) {
            showToast('Failed to reach server.', 'error');
        } finally {
            submitBtn.innerHTML = origHtml;
            submitBtn.disabled  = false;
        }
    });

    // ── Spinner CSS ───────────────────────────────────────────────────
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { width:20px;height:20px;animation:spin .8s linear infinite;margin-right:.4rem; }
    `;
    document.head.appendChild(style);

    // ── Init ──────────────────────────────────────────────────────────
    initDates();
    syncMockupVersion();
    renderMockup();
    fetchCampaigns();
    fetchStats();
    setInterval(fetchStats, 15000);

});
