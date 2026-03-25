const supabaseUrl = 'https://vsxiobbqobavnsagcwla.supabase.co';
const supabaseKey = 'sb_publishable_ubzFewgOlGaa5bZDCVq8_w_5i68YS51';
// A biblioteca do Supabase via CDN expõe window.supabase
const supabase = (typeof window.supabase !== 'undefined') ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

const App = {
    state: {
        currentModule: 'dashboard',
        userName: 'Rodrigo',
        hideBalance: false,
        data: {
            finances: { balance: 0, transactions: [] },
            tasks: [],
            notes: [],
            goals: [],
            ideas: [],
            time: { deepWorkSessions: 0, lastSession: null }
        }
    },

    async init() {
        this.cacheDOM();
        this.bindEvents();
        await this.load();
        this.checkFirstRun();
        this.render();
        console.log('Life OS Initialized with Cloud Sync');
    },

    checkFirstRun() {
        if (this.state.data.tasks.length === 0 && this.state.data.finances.balance === 0) {
            this.state.data.tasks = [
                { text: 'Finalizar design do Life OS', done: true, tag: 'Trabalho' },
                { text: 'Comprar café premium', done: false, tag: 'Pessoal' },
                { text: 'Treino de alta intensidade', done: false, tag: 'Saúde' }
            ];
            this.state.data.finances = {
                balance: 14500.80,
                transactions: [
                    { desc: 'Freelance Design', val: 2500, date: '24/03/2026' },
                    { desc: 'Assinatura Adobe', val: -124, date: '23/03/2026' }
                ]
            };
            this.state.data.goals = [
                { title: 'Liberdade Financeira', category: 'Finanças', progress: 65 },
                { title: 'Maratona de SP', category: 'Saúde', progress: 40 }
            ];
            this.state.data.notes = [
                { title: 'Ideias de Startup', text: 'Aplicativo de gestão de tempo baseado em estados mentais...' }
            ];
            this.save();
        }
    },

    cacheDOM() {
        this.dom = {
            mainContent: document.getElementById('main-content'),
            navItems: document.querySelectorAll('.nav-item'),
            sidebarItems: document.querySelectorAll('.sidebar-item'),
            fab: document.getElementById('fab')
        };
    },

    bindEvents() {
        const handleNav = (item) => {
            const module = item.getAttribute('data-module');
            this.switchModule(module);
        };

        this.dom.navItems.forEach(item => item.addEventListener('click', () => handleNav(item)));
        this.dom.sidebarItems.forEach(item => item.addEventListener('click', () => handleNav(item)));

        this.dom.fab.addEventListener('click', () => {
            this.handleFabAction();
        });

        const openSettings = () => {
            const newName = prompt('Qual o seu nome?', this.state.userName);
            if (newName) {
                this.state.userName = newName;
                this.save();
                this.render();
            }
        };

        const setMobileHeader = () => {
            const btnSettings = document.getElementById('btn-settings');
            const btnSearch = document.getElementById('btn-search');
            const btnSettingsSidebar = document.getElementById('btn-settings-sidebar');
            
            if (btnSettings) btnSettings.onclick = openSettings;
            if (btnSettingsSidebar) btnSettingsSidebar.onclick = openSettings;
            if (btnSearch) btnSearch.onclick = () => alert('Busca global em breve no Life OS.');
        };
        
        setMobileHeader();
    },

    switchModule(moduleName) {
        if (this.state.currentModule === moduleName) return;
        this.state.currentModule = moduleName;
        this.dom.navItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-module') === moduleName));
        this.dom.sidebarItems.forEach(item => item.classList.toggle('active', item.getAttribute('data-module') === moduleName));
        this.dom.mainContent.style.opacity = '0';
        setTimeout(() => {
            this.render();
            this.dom.mainContent.style.opacity = '1';
        }, 150);
    },

    async load() {
        if (supabase) {
            const { data, error } = await supabase.from('os_state').select('data').eq('id', 1).single();
            if (data && data.data && Object.keys(data.data).length > 0) {
                const s = data.data;
                this.state.data = s.data || this.state.data;
                this.state.userName = s.userName || this.state.userName;
                this.state.hideBalance = s.hideBalance || false;
                console.log('Dados carregados da Nuvem');
            } else {
                this.loadLocal();
            }
        } else {
            this.loadLocal();
        }
    },

    loadLocal() {
        const localData = localStorage.getItem('lifeos_cloud_backup');
        if (localData) {
            const parsed = JSON.parse(localData);
            this.state.data = parsed.data || this.state.data;
            this.state.userName = parsed.userName || this.state.userName;
            this.state.hideBalance = parsed.hideBalance || false;
        }
    },

    async save() {
        const payload = {
            userName: this.state.userName,
            hideBalance: this.state.hideBalance,
            data: this.state.data
        };
        localStorage.setItem('lifeos_cloud_backup', JSON.stringify(payload));
        if (supabase) {
            await supabase.from('os_state').upsert({ id: 1, data: payload, updated_at: new Date() });
            console.log('Nuvem Sincronizada');
        }
    },

    toggleBalance() {
        this.state.hideBalance = !this.state.hideBalance;
        this.save();
        this.render();
    },

    render() {
        const module = this.state.currentModule;
        this.dom.mainContent.innerHTML = '';
        if (['tasks', 'finances', 'notes', 'goals'].includes(module)) {
            this.dom.fab.classList.remove('hidden');
        } else {
            this.dom.fab.classList.add('hidden');
        }
        switch (module) {
            case 'dashboard': this.renderDashboard(); break;
            case 'tasks': this.renderTasks(); break;
            case 'finances': this.renderFinances(); break;
            case 'notes': this.renderNotes(); break;
            case 'goals': this.renderGoals(); break;
            case 'ideas': this.renderIdeas(); break;
            case 'time': this.renderTime(); break;
            default: this.renderDashboard();
        }
    },

    renderDashboard() {
        const t = this.state.data;
        const balanceDisplay = this.state.hideBalance ? '••••••' : `R$ ${t.finances.balance.toLocaleString('pt-BR')}`;
        const html = `
            <div class="animate-fade-in">
                <p class="label-md">Dashboard</p>
                <h1 class="display-lg">Olá, ${this.state.userName}</h1>
                <div class="dashboard-widget" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 2rem;">
                    <button class="card" onclick="App.quickAction('tasks')" style="padding: 1rem; margin: 0; text-align: center; background: var(--surface-container); border:none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" style="margin-bottom: 5px;"><path d="M12 5v14M5 12h14"/></svg>
                        <p style="font-size: 0.7rem; font-weight: 600; color:white;">Tarefa</p>
                    </button>
                    <button class="card" onclick="App.quickAction('finances')" style="padding: 1rem; margin: 0; text-align: center; background: var(--surface-container); border:none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" style="margin-bottom: 5px;"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        <p style="font-size: 0.7rem; font-weight: 600; color:white;">Finança</p>
                    </button>
                    <button class="card" onclick="App.quickAction('notes')" style="padding: 1rem; margin: 0; text-align: center; background: var(--surface-container); border:none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F1DBFF" stroke-width="2" style="margin-bottom: 5px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <p style="font-size: 0.7rem; font-weight: 600; color:white;">Nota</p>
                    </button>
                </div>
                <div class="card-grid-2">
                    <div class="card card-elevated">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <p class="label-md">Patrimônio Geral</p>
                            <button onclick="App.toggleBalance()" style="background: none; border: none; color: var(--text-hint); cursor: pointer; padding: 5px;">
                                ${this.state.hideBalance ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'}
                            </button>
                        </div>
                        <h2 style="font-size: 2.25rem;">${balanceDisplay}</h2>
                    </div>
                    <div class="card" onclick="App.switchModule('time')" style="background: linear-gradient(135deg, var(--primary-container) 0%, #2D0050 100%); cursor: pointer; text-align: center;">
                        <p class="label-md" style="color: var(--primary);">Foco / Pomodoro</p>
                        <span style="font-size: 2.5rem; font-weight: 800; font-family: 'Manrope'; color:white;">25:00</span>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem;">
                    <h3>Checklist</h3>
                    <span class="label-md" onclick="App.switchModule('tasks')" style="color: var(--primary); cursor: pointer;">Ver todos</span>
                </div>
                <div>
                    ${t.tasks.slice(0, 3).map((task, i) => `
                        <div class="card" style="padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                            <div onclick="App.toggleTask(${i})" style="width: 20px; height: 20px; border: 2px solid var(--primary); border-radius: 50%; background: ${task.done ? 'var(--primary)' : 'transparent'};"></div>
                            <span style="text-decoration: ${task.done ? 'line-through' : 'none'}; color: ${task.done ? 'var(--text-hint)' : 'var(--text-primary)'}">${task.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    quickAction(type) {
        this.state.currentModule = type;
        this.handleFabAction();
        this.state.currentModule = 'dashboard';
        this.render();
    },

    renderTasks() {
        const tasks = this.state.data.tasks;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Tarefas</h1>
                <div class="task-list">
                    ${tasks.map((task, index) => `
                        <div class="card" style="display: flex; align-items: center; gap: 1rem;">
                            <input type="checkbox" ${task.done ? 'checked' : ''} onclick="App.toggleTask(${index})">
                            <span style="text-decoration: ${task.done ? 'line-through' : 'none'};">${task.text}</span>
                        </div>
                    `).join('') || '<p>Nenhuma tarefa no horizonte.</p>'}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderFinances() {
        const f = this.state.data.finances;
        const balanceDisplay = this.state.hideBalance ? '••••' : `R$ ${f.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Finanças</h1>
                <div class="card card-elevated">
                    <p class="label-md">Patrimônio Total</p>
                    <h2 style="font-size: 2.25rem;">${balanceDisplay}</h2>
                </div>
                <h3 style="margin-top: 2rem;">Histórico</h3>
                ${f.transactions.map((t, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span>${t.desc}</span>
                        <span style="color: ${t.val < 0 ? '#FF5252' : '#4CAF50'}">${t.val < 0 ? '-' : '+'} R$ ${Math.abs(t.val).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderNotes() {
        const notes = this.state.data.notes;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Notas</h1>
                <div style="column-count: 2;">
                    ${notes.map((note, index) => `
                        <div class="card" onclick="App.openNote(${index})">
                            <h3>${note.title}</h3>
                            <p>${note.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    openNote(index) {
        const note = this.state.data.notes[index];
        const newTitle = prompt('Título:', note.title);
        const newText = prompt('Conteúdo:', note.text);
        if (newTitle !== null) note.title = newTitle;
        if (newText !== null) note.text = newText;
        this.save(); this.render();
    },

    renderGoals() {
        const goals = this.state.data.goals;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Metas</h1>
                ${goals.map((goal, i) => `
                    <div class="card">
                        <h3>${goal.title}</h3>
                        <div style="height: 6px; width:100%; background:var(--surface-high); margin-top:10px;">
                            <div style="height:100%; width:${goal.progress}%; background:var(--primary);"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderIdeas() {
        const ideas = this.state.data.ideas;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Ideias</h1>
                ${ideas.map(idea => `<div class="card">${idea.text}</div>`).join('')}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderTime() {
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Tempo</h1>
                <div class="card card-elevated" style="text-align: center; padding: 3rem 1rem;">
                    <div style="font-size: 4rem; font-weight: 800; font-family: 'Manrope'; margin: 1.5rem 0;">25:00</div>
                    <button class="fab" style="position: static;" onclick="alert('Foco iniciado')">Iniciar</button>
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    handleFabAction() {
        const module = this.state.currentModule;
        if (module === 'tasks') {
            const t = prompt('Nova tarefa:');
            if (t) { this.state.data.tasks.unshift({ text: t, done: false }); this.save(); this.render(); }
        } else if (module === 'finances') {
            const desc = prompt('Descrição:');
            const val = parseFloat(prompt('Valor:'));
            if (desc && !isNaN(val)) {
                this.state.data.finances.transactions.unshift({ desc, val, date: new Date().toLocaleDateString('pt-BR') });
                this.state.data.finances.balance += val;
                this.save(); this.render();
            }
        } else if (module === 'notes') {
            const title = prompt('Título:');
            const text = prompt('Texto:');
            if (title) { this.state.data.notes.unshift({ title, text }); this.save(); this.render(); }
        }
    },

    toggleTask(index) {
        this.state.data.tasks[index].done = !this.state.data.tasks[index].done;
        this.save();
        this.render();
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
