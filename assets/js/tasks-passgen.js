        // --- 10. Tareas ---
        function addTask() {
            playClick();
            const i = document.getElementById('task-input'), t = i.value.trim(), l = document.getElementById('task-list');
            if(!t) return; const li = document.createElement('li'); li.className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm group";
            li.innerHTML=`<div class="flex items-center gap-3 overflow-hidden"><input type="checkbox" class="w-5 h-5 accent-yellow-500 cursor-pointer rounded" onchange="this.nextElementSibling.classList.toggle('line-through'); this.nextElementSibling.classList.toggle('text-gray-400')"><span class="text-sm text-gray-800 font-medium truncate">${escapeHtml(t)}</span></div><button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 hidden group-hover:block transition border-0"><i class="fa-solid fa-circle-xmark text-lg"></i></button>`;
            l.insertBefore(li, l.firstChild); i.value = '';
        }

        // --- 11. PassGen ---
        function generatePassword() {
            playClick();
            const len = document.getElementById('pass-length').value, u = document.getElementById('pass-upper').checked, l = document.getElementById('pass-lower').checked, n = document.getElementById('pass-nums').checked, s = document.getElementById('pass-syms').checked;
            let c='', p=''; if(u)c+='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if(l)c+='abcdefghijklmnopqrstuvwxyz'; if(n)c+='0123456789'; if(s)c+='!@#$%^&*()_+~`|}{[]:;?><,./-=';
            const d = document.getElementById('pass-display');
            if(c===''){ d.innerText='Selecciona opciÃ³n'; return; }
            if(u)p+='A'; if(l)p+='a'; if(n)p+='1'; if(s)p+='!'; // Asegurar al menos 1
            for(let i=p.length; i<len; i++) p+=c.charAt(Math.floor(Math.random()*c.length));
            d.innerText = escapeHtml(p.split('').sort(()=>0.5-Math.random()).join(''));
        }
        function copyPassword() {
            playClick();
            const p = document.getElementById('pass-display').innerText;
            if(p && p!=='Selecciona opciÃ³n') {
                navigator.clipboard.writeText(p).catch(()=>{ const t=document.createElement("textarea"); t.value=p; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); });
                const i = document.getElementById('pass-copy-icon'); i.classList.replace('fa-copy','fa-check'); setTimeout(()=>i.classList.replace('fa-check','fa-copy'),1500);
            }
        }
        setTimeout(generatePassword, 500);

