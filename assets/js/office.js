        // --- 5. EC Office Pro (Page System) ---
        const officePagesContainer = document.getElementById('office-pages-container');
        let officeFormatPainterActive = false;
        let officeSavedRange = null;
        let officeAutoSaveTimer = null;
        let officeZoom = 100;
        let officePageCount = 0;
        const PAGE_EDITOR_HEIGHT = 858; // usable content height inside each page (1018 - 80*2 padding)

        // --- Page Management ---
        function officeCreatePage(html, insertAfter) {
            const pageNum = officePagesContainer.querySelectorAll('.office-page').length + 1;
            const page = document.createElement('div');
            page.className = 'office-page';
            page.id = `office-page-${pageNum}`;

            const editor = document.createElement('div');
            editor.className = 'office-page-editor';
            editor.contentEditable = 'true';
            editor.spellcheck = true;
            editor.innerHTML = html || '<p><br></p>';

            const pageNumEl = document.createElement('div');
            pageNumEl.className = 'office-page-number';
            pageNumEl.textContent = pageNum;

            page.appendChild(editor);
            page.appendChild(pageNumEl);

            if (insertAfter) {
                // Add break before new page
                const brk = document.createElement('div');
                brk.className = 'office-page-break';
                officePagesContainer.insertBefore(brk, insertAfter.nextSibling);
                officePagesContainer.insertBefore(page, brk.nextSibling);
            } else {
                officePagesContainer.appendChild(page);
            }

            officeSetupPageEditor(editor);
            officeUpdatePageNumbers();
            officePageCount = officePagesContainer.querySelectorAll('.office-page').length;
            return editor;
        }

        function officeRemovePage(pageEl) {
            const brk = pageEl.previousElementSibling;
            if (brk && brk.classList.contains('office-page-break')) brk.remove();
            pageEl.remove();
            officeUpdatePageNumbers();
            officePageCount = officePagesContainer.querySelectorAll('.office-page').length;
        }

        function officeUpdatePageNumbers() {
            officePagesContainer.querySelectorAll('.office-page').forEach((page, i) => {
                const numEl = page.querySelector('.office-page-number');
                if (numEl) numEl.textContent = i + 1;
            });
        }

        function officeCheckPages() {
            const pages = officePagesContainer.querySelectorAll('.office-page');
            // Check each page for overflow
            pages.forEach((page, idx) => {
                const editor = page.querySelector('.office-page-editor');
                if (!editor) return;
                // If content overflows and this is the last page, create new page
                if (idx === pages.length - 1 && editor.scrollHeight > editor.clientHeight + 5 && pages.length < 50) {
                    const newEditor = officeCreatePage('<p><br></p>', page);
                    // Move overflow content to new page (take last child elements)
                    // For simplicity, just create empty page - user continues typing there
                }
            });
            // Remove empty trailing pages (keep at least 1)
            const allPages = officePagesContainer.querySelectorAll('.office-page');
            if (allPages.length > 1) {
                for (let i = allPages.length - 1; i > 0; i--) {
                    const ed = allPages[i].querySelector('.office-page-editor');
                    if (ed && ed.innerText.trim() === '' && allPages[i].querySelectorAll('img, table, hr').length === 0) {
                        officeRemovePage(allPages[i]);
                    }
                }
            }
            officePageCount = officePagesContainer.querySelectorAll('.office-page').length;
        }

        function officeSetupPageEditor(editor) {
            editor.addEventListener('input', () => {
                officeCheckPages();
                officeUpdateStatusBar();
                officeScheduleAutoSave();
            });
            editor.addEventListener('keyup', () => officeUpdateStatusBar());
            editor.addEventListener('click', () => officeUpdateStatusBar());
            editor.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveOfficeDoc(); }
                if (e.ctrlKey && e.key === 'p') { e.preventDefault(); printOfficeDoc(); }
                if (e.ctrlKey && e.key === 'f') { e.preventDefault(); officeFindReplace(); }
                if (e.ctrlKey && e.key === 'h') { e.preventDefault(); officeFindReplace(); }
                if (e.ctrlKey && e.key === 'k') { e.preventDefault(); officeInsertLink(); }
                if (e.ctrlKey && e.key === 'n') { e.preventDefault(); officeMenuAction('new'); }
                if (e.ctrlKey && e.key === 'b') { e.preventDefault(); formatDoc('bold'); }
                if (e.ctrlKey && e.key === 'i') { e.preventDefault(); formatDoc('italic'); }
                if (e.ctrlKey && e.key === 'u') { e.preventDefault(); formatDoc('underline'); }
                // Check for page overflow on Enter
                if (e.key === 'Enter') {
                    setTimeout(() => officeCheckPages(), 10);
                }
            });
        }

        function officeGetAllContent() {
            let html = '';
            officePagesContainer.querySelectorAll('.office-page-editor').forEach(ed => {
                html += ed.innerHTML;
            });
            return html;
        }

        function officeSetAllContent(html) {
            // Clear all pages
            officePagesContainer.innerHTML = '';
            officePageCount = 0;
            // Create first page with content
            officeCreatePage(html || '<p><br></p>');
        }

        function formatDoc(cmd, value = null) {
            document.execCommand(cmd, false, value);
            officeUpdateStatusBar();
        }

        // --- Save/Export ---
        function saveOfficeDoc() {
            playClick();
            document.getElementById('save-office-modal').classList.remove('hidden');
        }
        function closeSaveOfficeModal() {
            playClick();
            document.getElementById('save-office-modal').classList.add('hidden');
        }
        function executeSaveOfficeDoc() {
            playClick();
            let name = document.getElementById('save-doc-name').value.trim();
            if (!name) name = 'Documento_Oficial';
            const format = document.getElementById('save-doc-format').value;
            const allContent = officeGetAllContent();

            if (format === 'pdf') {
                closeSaveOfficeModal();
                const printHtml = Array.from(officePagesContainer.querySelectorAll('.office-page')).map(p => {
                    const ed = p.querySelector('.office-page-editor');
                    return `<div style="width:720px;min-height:1018px;padding:80px 72px;page-break-after:always;background:white;margin:0 auto;box-sizing:border-box;font-family:serif;font-size:13pt;line-height:1.5;">${ed ? ed.innerHTML : ''}</div>`;
                }).join('');
                const printDiv = document.createElement('div');
                printDiv.innerHTML = printHtml;
                html2pdf().set({
                    margin: 0, filename: `${name}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'px', format: [720, 1018], orientation: 'portrait' }
                }).from(printDiv).save();
                return;
            }

            let content = '', mimeType = '';
            if (format === 'txt') {
                content = allContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
                mimeType = 'text/plain';
            } else if (format === 'html') {
                content = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + name + '</title><style>body{font-family:serif;max-width:720px;margin:40px auto;padding:80px 72px;line-height:1.5;color:#000;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #aaa;padding:4px 8px;}th{background:#eee;}</style></head><body>' + allContent + '</body></html>';
                mimeType = 'text/html';
            } else if (format === 'doc') {
                content = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body>" + allContent + "</body></html>";
                mimeType = 'application/msword';
            } else if (format === 'md') {
                content = officeHtmlToMarkdown(allContent);
                mimeType = 'text/markdown';
            }

            const blob = new Blob([content], { type: mimeType });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${name}.${format}`;
            a.click();
            URL.revokeObjectURL(a.href);
            closeSaveOfficeModal();
        }

        function officeHtmlToMarkdown(html) {
            let md = html;
            md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
            md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
            md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
            md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
            md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
            md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
            md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
            md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
            md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');
            md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
            md = md.replace(/<br\s*\/?>/gi, '\n');
            md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
            md = md.replace(/<\/?(ul|ol|p|div|blockquote)[^>]*>/gi, '\n');
            md = md.replace(/<hr[^>]*>/gi, '\n---\n');
            md = md.replace(/<[^>]+>/g, '');
            md = md.replace(/&nbsp;/g, ' ');
            md = md.replace(/&amp;/g, '&');
            return md.trim();
        }

        // --- Open ---
        function openOfficeDoc() { document.getElementById('office-file-input').click(); }
        document.getElementById('office-file-input').addEventListener('change', e => {
            if (!e.target.files[0]) return;
            const r = new FileReader();
            r.onload = ev => {
                officeSetAllContent(ev.target.result);
                document.getElementById('office-doc-title').textContent = e.target.files[0].name;
                officeUpdateStatusBar();
            };
            r.readAsText(e.target.files[0]);
        });

        // --- New ---
        function officeMenuAction(action) {
            playClick();
            if (action === 'new') {
                if (confirm('Crear un nuevo documento? Se perderan los cambios no guardados.')) {
                    officeSetAllContent('<h1>Nuevo Documento</h1><p><br></p><p>Escriba aqui...</p>');
                    document.getElementById('office-doc-title').textContent = 'Documento Sin Titulo';
                    officeUpdateStatusBar();
                }
            }
        }

        // --- Insert Table ---
        function officeInsertTable() { playClick(); document.getElementById('office-table-modal').classList.remove('hidden'); }
        function officeCloseTableModal() { document.getElementById('office-table-modal').classList.add('hidden'); }
        function officeConfirmInsertTable() {
            playClick();
            const rows = parseInt(document.getElementById('office-table-rows').value) || 3;
            const cols = parseInt(document.getElementById('office-table-cols').value) || 3;
            let html = '<table><thead><tr>';
            for (let c = 0; c < cols; c++) html += `<th>Encabezado ${c + 1}</th>`;
            html += '</tr></thead><tbody>';
            for (let r = 0; r < rows; r++) { html += '<tr>'; for (let c = 0; c < cols; c++) html += '<td>&nbsp;</td>'; html += '</tr>'; }
            html += '</tbody></table><p><br></p>';
            document.execCommand('insertHTML', false, html);
            officeCloseTableModal();
            officeCheckPages();
        }

        // --- Table Tools ---
        function officeTableAction(action) {
            playClick();
            const table = officeGetTable(); if (!table) return;
            const row = officeGetRow(); const cell = officeGetCell(); if (!cell) return;
            switch (action) {
                case 'addRowAbove': if (row) { const nr = row.cloneNode(true); nr.querySelectorAll('td,th').forEach(td => td.innerHTML = '&nbsp;'); row.parentNode.insertBefore(nr, row); } break;
                case 'addRowBelow': if (row) { const nr = row.cloneNode(true); nr.querySelectorAll('td,th').forEach(td => td.innerHTML = '&nbsp;'); row.parentNode.insertBefore(nr, row.nextSibling); } break;
                case 'addColLeft': if (cell) { const idx = officeGetCellIndex(cell); table.querySelectorAll('tr').forEach(tr => { const nc = document.createElement(cell.tagName === 'TH' ? 'th' : 'td'); nc.innerHTML = '&nbsp;'; tr.insertBefore(nc, tr.children[idx]); }); } break;
                case 'addColRight': if (cell) { const idx = officeGetCellIndex(cell); table.querySelectorAll('tr').forEach(tr => { const nc = document.createElement(cell.tagName === 'TH' ? 'th' : 'td'); nc.innerHTML = '&nbsp;'; tr.insertBefore(nc, tr.children[idx + 1]); }); } break;
                case 'delRow': if (row && table.rows.length > 1) row.remove(); break;
                case 'delCol': if (cell) { const idx = officeGetCellIndex(cell); table.querySelectorAll('tr').forEach(tr => { if (tr.children[idx]) tr.children[idx].remove(); }); } break;
                case 'delTable': table.remove(); document.getElementById('office-table-toolbar').style.display = 'none'; break;
                case 'merge': const sel = window.getSelection(); if (sel.rangeCount > 0) { const sc = sel.getRangeAt(0).startContainer.closest('td,th'); const ec = sel.getRangeAt(0).endContainer.closest('td,th'); if (sc && ec && sc !== ec) { let mh = ''; for (let r = sc.parentElement.rowIndex; r <= ec.parentElement.rowIndex; r++) for (let c = sc.cellIndex; c <= ec.cellIndex; c++) if (table.rows[r] && table.rows[r].cells[c]) mh += table.rows[r].cells[c].innerHTML; sc.innerHTML = mh; sc.rowSpan = ec.parentElement.rowIndex - sc.parentElement.rowIndex + 1; sc.colSpan = ec.cellIndex - sc.cellIndex + 1; for (let r = ec.parentElement.rowIndex; r >= sc.parentElement.rowIndex; r--) for (let c = ec.cellIndex; c >= sc.cellIndex; c--) { if (r === sc.parentElement.rowIndex && c === sc.cellIndex) continue; if (table.rows[r] && table.rows[r].cells[c]) table.rows[r].cells[c].remove(); } } } break;
            }
        }
        function officeGetTable() { const s = window.getSelection(); return s.rangeCount > 0 ? s.getRangeAt(0).startContainer.closest('table') : null; }
        function officeGetRow() { const s = window.getSelection(); return s.rangeCount > 0 ? s.getRangeAt(0).startContainer.closest('tr') : null; }
        function officeGetCell() { const s = window.getSelection(); return s.rangeCount > 0 ? s.getRangeAt(0).startContainer.closest('td,th') : null; }
        function officeGetCellIndex(cell) { return Array.from(cell.parentElement.children).indexOf(cell); }

        document.addEventListener('keyup', officeCheckTableToolbar);
        document.addEventListener('click', officeCheckTableToolbar);
        function officeCheckTableToolbar() {
            const sel = window.getSelection();
            document.getElementById('office-table-toolbar').style.display = (sel.rangeCount > 0 && sel.getRangeAt(0).startContainer.closest('table')) ? 'flex' : 'none';
        }

        // --- Insert Link ---
        function officeInsertLink() { playClick(); document.getElementById('office-link-text').value = window.getSelection().toString() || ''; document.getElementById('office-link-url').value = ''; document.getElementById('office-link-modal').classList.remove('hidden'); }
        function officeCloseLinkModal() { document.getElementById('office-link-modal').classList.add('hidden'); }
        function officeConfirmInsertLink() {
            playClick();
            const text = document.getElementById('office-link-text').value.trim();
            const url = document.getElementById('office-link-url').value.trim();
            if (!url) return;
            const target = document.getElementById('office-link-newtab').checked ? ' target="_blank"' : '';
            document.execCommand('insertHTML', false, `<a href="${url}"${target}>${text || url}</a>`);
            officeCloseLinkModal();
        }

        function officeInsertHR() { playClick(); document.execCommand('insertHTML', false, '<hr><p><br></p>'); }
        function officeInsertDate() { playClick(); document.execCommand('insertHTML', false, new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })); }

        // --- Emoji ---
        function officeInsertEmoji() {
            playClick();
            const grid = document.getElementById('office-emoji-grid');
            if (grid.children.length === 0) {
                ['ðŸ˜€','ðŸ˜ƒ','ðŸ˜„','ðŸ˜','ðŸ˜†','ðŸ˜…','ðŸ¤£','ðŸ˜‚','ðŸ™‚','ðŸ™ƒ','ðŸ˜‰','ðŸ˜Š','ðŸ˜‡','ðŸ¥°','ðŸ˜','ðŸ¤©','ðŸ˜˜','ðŸ˜—','ðŸ˜š','ðŸ˜™','ðŸ¥²','ðŸ˜‹','ðŸ˜›','ðŸ˜œ','ðŸ¤ª','ðŸ˜','ðŸ¤‘','ðŸ¤—','ðŸ¤­','ðŸ¤«','ðŸ¤”','ðŸ˜','ðŸ˜‘','ðŸ˜¶','ðŸ˜','ðŸ˜’','ðŸ™„','ðŸ˜¬','ðŸ¤¥','ðŸ˜Œ','ðŸ˜”','ðŸ˜ª','ðŸ¤¤','ðŸ˜´','ðŸ˜·','ðŸ¤’','ðŸ¤•','ðŸ¤¢','ðŸ¤®','ðŸ¥µ','ðŸ¥¶','ðŸ¥´','ðŸ˜µ','ðŸ¤¯','ðŸ¤ ','ðŸ¥³','ðŸ¥¸','ðŸ˜Ž','ðŸ¤“','ðŸ§','ðŸ˜•','ðŸ˜Ÿ','ðŸ™','ðŸ˜®','ðŸ˜¯','ðŸ˜²','ðŸ˜³','ðŸ¥º','ðŸ˜¦','ðŸ˜§','ðŸ˜¨','ðŸ˜°','ðŸ˜¥','ðŸ˜¢','ðŸ˜­','ðŸ˜±','ðŸ˜–','ðŸ˜£','ðŸ˜ž','ðŸ˜“','ðŸ˜©','ðŸ˜«','ðŸ¥±','ðŸ˜¤','ðŸ˜¡','ðŸ˜ ','ðŸ¤¬','ðŸ˜ˆ','ðŸ‘¿','ðŸ’€','â˜ ï¸','ðŸ’©','ðŸ¤¡','ðŸ‘¹','ðŸ‘º','ðŸ‘»','ðŸ‘½','ðŸ‘¾','ðŸ¤–','â¤ï¸','ðŸ§¡','ðŸ’›','ðŸ’š','ðŸ’™','ðŸ’œ','ðŸ–¤','ðŸ¤','ðŸ¤Ž','ðŸ’”','â£ï¸','ðŸ’•','ðŸ’ž','ðŸ’“','ðŸ’—','ðŸ’–','ðŸ’˜','ðŸ’','â­','ðŸŒŸ','âœ¨','ðŸ’«','ðŸ”¥','ðŸ’¥','ðŸŽ‰','ðŸŽŠ','ðŸ†','ðŸ¥‡','ðŸŽ¯','ðŸš€','ðŸ’Ž','ðŸ•','ðŸ”','ðŸŸ','ðŸŒ®','ðŸ¦','â˜•','ðŸº','ðŸŽµ','ðŸŽ¶','ðŸ“±','ðŸ’»','âŒ¨ï¸','ðŸ–¥ï¸','ðŸ–¨ï¸','ðŸ“·','ðŸ“¸','ðŸŽ®','ðŸ•¹ï¸','ðŸŽ²','â™Ÿï¸','ðŸŽ³','ðŸŽ¾','âš½','ðŸ€','ðŸˆ','âš¾','ðŸ'].forEach(e => {
                    const btn = document.createElement('button');
                    btn.textContent = e; btn.className = 'text-xl hover:bg-gray-100 rounded cursor-pointer p-0.5 transition';
                    btn.onclick = () => { document.execCommand('insertText', false, e); officeCloseEmojiModal(); };
                    grid.appendChild(btn);
                });
            }
            document.getElementById('office-emoji-modal').classList.remove('hidden');
        }
        function officeCloseEmojiModal() { document.getElementById('office-emoji-modal').classList.add('hidden'); }
        document.getElementById('office-emoji-modal').addEventListener('click', function(e) { if (e.target === this) officeCloseEmojiModal(); });

        // --- Heading & Line Height ---
        function officeApplyHeading(tag) { playClick(); document.execCommand('formatBlock', false, tag); }
        const origFormatDoc = formatDoc;
        formatDoc = function(cmd, value) {
            if (cmd === 'lineHeight') { document.execCommand('lineHeight', false, value); return; }
            origFormatDoc(cmd, value);
        };

        // --- Format Painter ---
        function officeFormatPainter() {
            playClick();
            officeFormatPainterActive = !officeFormatPainterActive;
            const btn = document.getElementById('office-painter-btn');
            if (officeFormatPainterActive) { btn.classList.add('active-state'); const s = window.getSelection(); if (s.rangeCount > 0) officeSavedRange = s.getRangeAt(0).cloneRange(); }
            else { btn.classList.remove('active-state'); officeSavedRange = null; }
        }

        // --- Find & Replace ---
        function officeFindReplace() { playClick(); document.getElementById('office-find-modal').classList.remove('hidden'); document.getElementById('office-find-input').focus(); }
        function officeCloseFindModal() { document.getElementById('office-find-modal').classList.add('hidden'); officeClearFindHighlights(); }
        function officeFindNext() {
            officeClearFindHighlights();
            const query = document.getElementById('office-find-input').value; if (!query) return;
            const cs = document.getElementById('office-find-case').checked;
            const ww = document.getElementById('office-find-word').checked;
            let flags = cs ? 'g' : 'gi';
            let rs = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (ww) rs = '\\b' + rs + '\\b';
            const regex = new RegExp(rs, flags);
            let total = 0;
            officePagesContainer.querySelectorAll('.office-page-editor').forEach(ed => {
                const matches = ed.innerHTML.match(regex);
                if (matches) { total += matches.length; ed.innerHTML = ed.innerHTML.replace(regex, m => `<span class="office-find-highlight">${m}</span>`); }
            });
            document.getElementById('office-find-result').textContent = total > 0 ? `${total} resultado${total !== 1 ? 's' : ''}` : 'Sin resultados';
            if (total > 0) { const f = officePagesContainer.querySelector('.office-find-highlight'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }
        function officeClearFindHighlights() {
            officePagesContainer.querySelectorAll('.office-page-editor').forEach(ed => { ed.querySelectorAll('.office-find-highlight').forEach(el => el.replaceWith(el.textContent)); });
            document.getElementById('office-find-result').textContent = '';
        }
        function officeReplaceOne() { const h = officePagesContainer.querySelectorAll('.office-find-highlight'); if (!h.length) { officeFindNext(); return; } h[0].outerHTML = document.getElementById('office-replace-input').value; officeFindNext(); }
        function officeReplaceAll() {
            const query = document.getElementById('office-find-input').value; const rt = document.getElementById('office-replace-input').value; if (!query) return;
            officeClearFindHighlights();
            const cs = document.getElementById('office-find-case').checked; const ww = document.getElementById('office-find-word').checked;
            let rs = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); if (ww) rs = '\\b' + rs + '\\b';
            const regex = new RegExp(rs, cs ? 'g' : 'gi'); let total = 0;
            officePagesContainer.querySelectorAll('.office-page-editor').forEach(ed => { total += (ed.innerHTML.match(regex) || []).length; ed.innerHTML = ed.innerHTML.replace(regex, rt); });
            document.getElementById('office-find-result').textContent = `${total} reemplazo${total !== 1 ? 's' : ''}`;
        }

        // --- Spell Check ---
        function officeSpellCheck() {
            playClick();
            const eds = officePagesContainer.querySelectorAll('.office-page-editor');
            const current = eds[0]?.getAttribute('spellcheck') !== 'false';
            eds.forEach(ed => ed.setAttribute('spellcheck', !current));
            alert(`Ortografia ${!current ? 'activada' : 'desactivada'}`);
        }

        // --- Print ---
        function printOfficeDoc() {
            let pagesHtml = '';
            officePagesContainer.querySelectorAll('.office-page').forEach(page => {
                const ed = page.querySelector('.office-page-editor');
                pagesHtml += `<div style="width:720px;min-height:1018px;padding:80px 72px;page-break-after:always;background:white;margin:0 auto 20px;font-family:serif;font-size:13pt;line-height:1.5;color:#000;box-sizing:border-box;">${ed ? ed.innerHTML : ''}</div>`;
            });
            const w = window.open('', '', 'height=800,width=900');
            w.document.write(`<html><head><title>Imprimir</title><style>@page{size:A4;margin:0;}body{margin:0;background:#808080;padding:20px;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #999;padding:4px 8px;}th{background:#eee;}img{max-width:100%;}</style></head><body>${pagesHtml}</body></html>`);
            w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 500);
        }

        function insertImagePrompt() { const url = prompt("URL de la imagen:"); if (url) formatDoc('insertImage', url); }

        // --- Fullscreen ---
        function toggleOfficeFullscreen() {
            playClick();
            const win = document.getElementById('window-libreoffice');
            if (!document.fullscreenElement) win.requestFullscreen().catch(() => {});
            else document.exitFullscreen();
        }

        // --- Zoom ---
        function officeZoomIn() { officeZoom = Math.min(200, officeZoom + 10); officeApplyZoom(); }
        function officeZoomOut() { officeZoom = Math.max(50, officeZoom - 10); officeApplyZoom(); }
        function officeZoomReset() { officeZoom = 100; officeApplyZoom(); }
        function officeApplyZoom() {
            officePagesContainer.style.transform = `scale(${officeZoom / 100})`;
            officePagesContainer.style.transformOrigin = 'top center';
            document.getElementById('office-zoom-level').textContent = officeZoom + '%';
        }

        // --- Status Bar ---
        function officeUpdateStatusBar() {
            const text = officeGetAllContent().replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            document.getElementById('office-word-count').textContent = `${words} palabra${words !== 1 ? 's' : ''}`;
            document.getElementById('office-char-count').textContent = `${text.length} caracter${text.length !== 1 ? 'es' : ''}`;
            document.getElementById('office-line-count').textContent = `${officePageCount} hoja${officePageCount !== 1 ? 's' : ''}`;
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const r = sel.getRangeAt(0);
                const editable = r.startContainer.nodeType === 3 ? r.startContainer.parentElement.closest('.office-page-editor') : r.startContainer.closest('.office-page-editor');
                if (editable) {
                    const pr = r.cloneRange(); pr.selectNodeContents(editable); pr.setEnd(r.startContainer, r.startOffset);
                    const lb = pr.toString().split('\n');
                    document.getElementById('office-cursor-pos').textContent = `Ln ${lb.length}, Col ${lb[lb.length - 1].length + 1}`;
                }
            }
        }

        // --- Auto-save ---
        function officeAutoSave() {
            try {
                localStorage.setItem('ec_office_content', officeGetAllContent());
                localStorage.setItem('ec_office_title', document.getElementById('office-doc-title').textContent);
                document.getElementById('office-autosave-status').textContent = 'Guardado ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            } catch(e) {}
        }
        function officeAutoLoad() {
            try {
                const saved = localStorage.getItem('ec_office_content');
                const title = localStorage.getItem('ec_office_title');
                if (saved) officeSetAllContent(saved);
                if (title) document.getElementById('office-doc-title').textContent = title;
            } catch(e) {}
        }
        function officeScheduleAutoSave() { clearTimeout(officeAutoSaveTimer); officeAutoSaveTimer = setTimeout(officeAutoSave, 2000); }

        // --- Initialize ---
        officeAutoLoad();
        officeCheckPages();
        officeUpdateStatusBar();
        // If no pages exist yet, create first one
        if (officePagesContainer.querySelectorAll('.office-page').length === 0) {
            officeCreatePage('<h1>Documento Oficial - EC</h1><h2>Bienvenido a EC Office Pro</h2><p><br></p><p>Escriba aqui los detalles operativos de su documento...</p>');
        }

