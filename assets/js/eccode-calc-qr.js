        // --- 6. LÃ³gica ECCode ---
        const codeEditor = document.getElementById('code-editor'), lineNumbers = document.getElementById('line-numbers'), highlightCode = document.getElementById('highlight-code'), highlightLayer = document.getElementById('highlight-layer');
        function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
        function updateCode() { let text = codeEditor.value; if (text[text.length - 1] === "\n") text += " "; highlightCode.innerHTML = escapeHtml(text); Prism.highlightElement(highlightCode); }
        function changeCodeLanguage() { const sel = document.getElementById('code-language-selector'); highlightCode.className = `language-${sel.value}`; document.getElementById('editor-lang-label').textContent = sel.options[sel.selectedIndex].text; updateCode(); }
        
        function updateLineNumbers() { 
            const lines = codeEditor.value.split('\n').length; 
            // Se aÃ±aden 50 lÃ­neas extra vacÃ­as para asegurar el scroll perfecto al fondo siempre
            lineNumbers.innerHTML = Array(lines + 50).fill(0).map((_, i) => (i < lines ? i + 1 : '')).join('<br>'); 
        }
        
        function syncScroll() { lineNumbers.scrollTop = codeEditor.scrollTop; highlightLayer.scrollTop = codeEditor.scrollTop; highlightLayer.scrollLeft = codeEditor.scrollLeft; }
        function updateCursorPos() { const text = codeEditor.value.substring(0, codeEditor.selectionStart).split('\n'); document.getElementById('editor-status').textContent = `LÃ­nea: ${text.length}, Col: ${text[text.length-1].length + 1}`; }
        updateLineNumbers(); updateCursorPos(); updateCode();
        codeEditor.addEventListener('keydown', function(e) {
            if (e.key == 'Tab') { e.preventDefault(); const s = this.selectionStart, e_pos = this.selectionEnd; this.value = this.value.substring(0, s) + "    " + this.value.substring(e_pos); this.selectionStart = this.selectionEnd = s + 4; updateLineNumbers(); updateCursorPos(); updateCode(); }
        });
        
        function saveCodeDoc() { 
            const sel = document.getElementById('code-language-selector');
            const extMap = { 'javascript': 'js', 'python': 'py', 'html': 'html', 'css': 'css', 'sql': 'sql' };
            const ext = extMap[sel.value] || 'txt';
            const a = document.createElement('a'); 
            a.href = URL.createObjectURL(new Blob([codeEditor.value], { type: 'text/plain' })); 
            a.download = `codigo.${ext}`; 
            a.click(); 
            URL.revokeObjectURL(a.href); 
        }

        function openCodeDoc() { document.getElementById('code-file-input').click(); }
        
        document.getElementById('code-file-input').addEventListener('change', function(e) {
            const f = e.target.files[0]; if (!f) return;
            const extMap = { 'js': 'javascript', 'py': 'python', 'html': 'html', 'css': 'css', 'sql': 'sql' }, ext = f.name.split('.').pop().toLowerCase();
            if (extMap[ext]) { document.getElementById('code-language-selector').value = extMap[ext]; changeCodeLanguage(); }
            const r = new FileReader(); r.onload = ev => { codeEditor.value = ev.target.result; updateLineNumbers(); updateCursorPos(); updateCode(); document.querySelector('#window-notepad .title-bar div:nth-child(2)').textContent = `ECCode - ${f.name}`; }; r.readAsText(f);
        });

        // --- 7. Calculadora ---
        let calcVal = '0', prevVal = '', calcOp = null, resetDisp = false;
        const disp = document.getElementById('calc-display'), hist = document.getElementById('calc-history');
        function upDisp() { disp.textContent = calcVal; hist.textContent = calcOp ? `${prevVal} ${calcOp.replace('add','+').replace('sub','âˆ’').replace('mul','Ã—').replace('div','Ã·')}` : ''; }
        function calcInput(v) { playClick(); if (resetDisp) { calcVal = ''; resetDisp = false; } if (v === '.' && calcVal.includes('.')) return; calcVal = (calcVal === '0' && v !== '.') ? v : calcVal + v; upDisp(); }
        function calcClear() { playClick(); calcVal = '0'; prevVal = ''; calcOp = null; upDisp(); }
        function calcAction(op) {
            playClick();
            if(op==='sqrt'){calcVal=Math.sqrt(parseFloat(calcVal)).toString(); upDisp(); return;}
            if(op==='sqr'){calcVal=Math.pow(parseFloat(calcVal),2).toString(); upDisp(); return;}
            if(op==='inv'){calcVal=(1/parseFloat(calcVal)).toString(); upDisp(); return;}
            if (calcOp) calcCalculate(); prevVal = calcVal; calcOp = op; resetDisp = true; upDisp();
        }
        function calcCalculate() {
            playClick();
            if (!calcOp || resetDisp) return;
            let p = parseFloat(prevVal), c = parseFloat(calcVal), r = 0;
            if(calcOp==='add')r=p+c; if(calcOp==='sub')r=p-c; if(calcOp==='mul')r=p*c; if(calcOp==='div')r=c===0?'Error':p/c;
            calcVal = r.toString(); calcOp = null; prevVal = ''; resetDisp = true; upDisp();
        }

        // --- 8. QR Gen ---
        function generateQR() {
            playClick();
            const v = document.getElementById('qr-input').value.trim(), c = document.getElementById('qrcode');
            if(!v) return; c.innerHTML = ''; document.getElementById('qr-placeholder').style.display = 'none';
            new QRCode(c, { text: v, width: 180, height: 180, correctLevel : QRCode.CorrectLevel.H });
        }
        function downloadQR() {
            playClick();
            const img = document.querySelector('#qrcode img'), canvas = document.querySelector('#qrcode canvas'), url = img?.src || canvas?.toDataURL();
            if(url) { const a = document.createElement('a'); a.href = url; a.download = 'QR.png'; a.click(); }
        }

