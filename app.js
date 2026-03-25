const supabaseUrl = 'https://vsxiobbqobavnsagcwla.supabase.co';
const supabaseKey = 'sb_publishable_ubzFewgOlGaa5bZDCVq8_w_5i68YS51';

// Função para obter o cliente de forma segura
function getSupabase() {
    if (typeof window.supabase !== 'undefined') {
        return window.supabase.createClient(supabaseUrl, supabaseKey);
    }
    return null;
}

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
        console.log('Iniciando Life OS...');
        try {
            this.cacheDOM();
            this.bindEvents();
            
            // Tentar carregar dados, mas não travar se falhar
            await this.load().catch(err => console.error('Falha no carregamento inicial:', err));
            
            this.checkFirstRun();
            this.render();
            console.log('Life OS pronto.');
        } catch (error) {
            console.error('Erro crítico na inicialização:', error);
            // Tentar renderizar o que for possível
            this.render();
        }
    },

    checkFirstRun() {
        if (this.state.data.tasks.length === 0 && this.state.data.finances.balance === 0) {
            console.log('Configurando dados iniciais de demonstração...');
            this.state.data.tasks = [
                { text: 'Sincronização Nuvem Ativada ☁️', done: true, tag: 'Sistema' },
                { text: 'Explorar o novo Life OS', done: false, tag: 'Dashboard' }
            ];
            this.state.data.finances = {
                balance: 500.00,
                transactions: [
                    { desc: 'Saldo Inicial Cloud', val: 500.00, date: new Date().toLocaleDateString('pt-BR') }
                ]
            };
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

        if (this.dom.fab) {
            this.dom.fab.addEventListener('click', () => this.handleFabAction());
        }

        const openSettings = () => {
            const newName = prompt('Qual o seu nome?', this.state.userName);
            if (newName) {
                this.state.userName = newName;
                this.save();
                this.render();
            }
        };

        const btnSettings = document.getElementById('btn-settings');
        const btnSettingsSidebar = document.getElementById('btn-settings-sidebar');
        const btnSearch = document.getElementById('btn-search');

        if (btnSettings) btnSettings.onclick = openSettings;
        if (btnSettingsSidebar) btnSettingsSidebar.onclick = openSettings;
        if (btnSearch) btnSearch.onclick = () => alert('Busca funcional em breve.');
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
        const client = getSupabase();
        if (client) {
            console.log('Buscando dados na nuvem...');
            const { data, error } = await client.from('os_state').select('data').eq('id', 1).single();
            
            if (error) {
                console.warn('Erro ao buscar na nuvem, usando local:', error.message);
                this.loadLocal();
                return;
            }

            if (data && data.data) {
                const s = data.data;
                this.state.data = s.data || this.state.data;
                this.state.userName = s.userName || this.state.userName;
                this.state.hideBalance = s.hideBalance || false;
                console.log('Dados sincronizados da nuvem com sucesso.');
            } else {
                this.loadLocal();
            }
        } else {
            console.warn('Supabase não detectado, usando LocalStorage.');
            this.loadLocal();
        }
    },

    loadLocal() {
        const localData = localStorage.getItem('lifeos_cloud_backup');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                this.state.data = parsed.data || this.state.data;
                this.state.userName = parsed.userName || this.state.userName;
                this.state.hideBalance = parsed.hideBalance || false;
            } catch (e) {
                console.error('Erro ao ler LocalStorage:', e);
            }
        }
    },

    async save() {
        const payload = {
            userName: this.state.userName,
            hideBalance: this.state.hideBalance,
            data: this.state.data
        };
        
        // Backup Local imediato
        localStorage.setItem('lifeos_cloud_backup', JSON.stringify(payload));
        
        const client = getSupabase();
        if (client) {
            const { error } = await client.from('os_state').upsert({ id: 1, data: payload, updated_at: new Date() });
            if (error) console.error('Erro de push nuvem:', error.message);
            else console.log('Nuvem atualizada.');
        }
    },

    toggleBalance() {
        this.state.hideBalance = !this.state.hideBalance;
        this.save();
        this.render();
    },

    render() {
        if (!this.dom.mainContent) return;
        
        const module = this.state.currentModule;
        this.dom.mainContent.innerHTML = '';
        
        if (this.dom.fab) {
            if (['tasks', 'finances', 'notes', 'goals'].includes(module)) {
                this.dom.fab.classList.remove('hidden');
            } else {
                this.dom.fab.classList.add('hidden');
            }
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
                        <span style="font-size: 2.5rem; font-weight: 800; color:white;">25:00</span>
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
                    `).join('') || '<p style="color:var(--text-hint); padding: 1rem;">Nenhuma tarefa pendente.</p>'}
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
                        <div class="card" style="display: flex; align-items: center; gap: 1rem; padding: 1rem;">
                            <div onclick="App.toggleTask(${index})" style="width: 20px; height: 20px; border: 2px solid var(--primary); border-radius: 50%; background: ${task.done ? 'var(--primary)' : 'transparent'};"></div>
                            <span style="text-decoration: ${task.done ? 'line-through' : 'none'}; flex:1;">${task.text}</span>
                            <button onclick="App.removeTask(${index})" style="background:none; border:none; color:#FF5252;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    `).join('') || '<p style="text-align:center; padding: 2rem;">Nada por aqui.</p>'}
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
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Histórico</h3>
                ${f.transactions.map((t, index) => `
                    <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div>
                            <p style="font-weight: 500;">${t.desc}</p>
                            <p class="label-md" style="font-size: 0.6rem;">${t.date}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-weight: 600; color: ${t.val < 0 ? '#FF5252' : '#4CAF50'}">${t.val < 0 ? '-' : '+'} R$ ${Math.abs(t.val).toFixed(2)}</span>
                            <button onclick="App.removeTransaction(${index})" style="background:none; border:none; color:#FF5252;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('') || '<p style="text-align:center; padding: 2rem;">Sem transações.</p>'}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderNotes() {
        const notes = this.state.data.notes;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Notas</h1>
                <div style="column-count: 2; column-gap: 1rem;">
                    ${notes.map((note, index) => `
                        <div class="card" onclick="App.openNote(${index})" style="break-inside: avoid; margin-bottom: 1rem;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h3 style="font-size: 1rem;">${note.title}</h3>
                                <button onclick="event.stopPropagation(); App.removeNote(${index})" style="background:none; border:none; color:#FF5252;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">${note.text}</p>
                        </div>
                    `).join('') || '<p style="text-align:center; padding: 2rem; column-span:all;">Vazio por aqui.</p>'}
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
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <h3 onclick="App.updateGoalProgress(${i})" style="cursor:pointer;">${goal.title}</h3>
                            <button onclick="App.removeGoal(${i})" style="background:none; border:none; color:#FF5252;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                        <div style="height: 6px; width:100%; background:var(--surface-high); margin-top:10px; border-radius:3px; overflow:hidden;">
                            <div style="height:100%; width:${goal.progress}%; background:var(--primary);"></div>
                        </div>
                    </div>
                `).join('') || '<p style="text-align:center; padding: 2rem;">Trace suas metas.</p>'}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderIdeas() {
        const ideas = this.state.data.ideas;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Ideias</h1>
                ${ideas.map((idea, i) => `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between;">
                            <p>${idea.text}</p>
                            <button onclick="App.removeIdea(${i})" style="background:none; border:none; color:#FF5252;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('') || '<p style="text-align:center; padding: 2rem;">Insights aparecerão aqui.</p>'}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderTime() {
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Tempo</h1>
                <div class="card card-elevated" style="text-align: center; padding: 3rem 1rem;">
                    <div style="font-size: 4rem; font-weight: 800; margin: 1.5rem 0;">25:00</div>
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
            const text = prompt('Conteúdo:');
            if (title) { this.state.data.notes.unshift({ title, text }); this.save(); this.render(); }
        } else if (module === 'goals') {
            const title = prompt('Meta:');
            if (title) { this.state.data.goals.unshift({ title, progress: 0 }); this.save(); this.render(); }
        }
    },

    toggleTask(index) {
        this.state.data.tasks[index].done = !this.state.data.tasks[index].done;
        this.save();
        this.render();
    },

    removeTask(i) { if(confirm('Remover?')){ this.state.data.tasks.splice(i,1); this.save(); this.render(); } },
    removeTransaction(i) { if(confirm('Remover?')){ const t=this.state.data.finances.transactions[i]; this.state.data.finances.balance-=t.val; this.state.data.finances.transactions.splice(i,1); this.save(); this.render(); } },
    removeNote(i) { if(confirm('Remover?')){ this.state.data.notes.splice(i,1); this.save(); this.render(); } },
    removeGoal(i) { if(confirm('Remover?')){ this.state.data.goals.splice(i,1); this.save(); this.render(); } },
    removeIdea(i) { if(confirm('Remover?')){ this.state.data.ideas.splice(i,1); this.save(); this.render(); } },
    updateGoalProgress(i) { const p = prompt('Progresso %', this.state.data.goals[i].progress); if(p!==null){ this.state.data.goals[i].progress = Math.min(100, Math.max(0, parseInt(p))); this.save(); this.render(); } }
};

// Auto-inicializar
window.addEventListener('DOMContentLoaded', () => App.init());
