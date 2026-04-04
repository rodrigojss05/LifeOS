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
        version: '1.0.4',
        userId: null,
        currentModule: 'dashboard',
        userName: 'Rodrigo',
        hideBalance: false,
        syncStatus: 'offline', 
        isLoaded: false,
        financeView: 'list', // 'list' or 'table'
        financePeriod: new Date().toISOString().substring(0, 7), // YYYY-MM
        data: {
            finances: { 
                balance: 0, 
                transactions: [],
                savingsGoals: [] 
            },
            tasks: [],
            notes: [],
            goals: [],
            ideas: [],
            time: { deepWorkSessions: 0, lastSession: null }
        }
    },

    generateUUID() {
        const id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('lifeos_user_id', id);
        return id;
    },

    async init() {
        console.log('Iniciando Life OS...');
        this.state.userId = localStorage.getItem('lifeos_user_id') || this.generateUUID();
        try {
            this.cacheDOM();
            this.bindEvents();
            
            // Tentar carregar dados, mas não travar se falhar
            await this.load().catch(err => console.error('Falha no carregamento inicial:', err));
            
            this.checkFirstRun();
            this.render();
            console.log('Life OS pronto (User:', this.state.userId, ')');
        } catch (error) {
            console.error('Erro crítico na inicialização:', error);
            // Tentar renderizar o que for possível
            this.render();
        }
    },

    checkFirstRun() {
        if (!this.state.isLoaded) return; // Só roda após tentar carregar tudo
        
        const hasData = this.state.data.tasks.length > 0 || 
                        this.state.data.finances.transactions.length > 0 ||
                        this.state.data.notes.length > 0;

        if (!hasData) {
            console.log('Configurando dados iniciais de demonstração...');
            // ... demo data ...
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

        const btnSettings = document.getElementById('btn-settings');
        const btnSettingsSidebar = document.getElementById('btn-settings-sidebar');
        const btnSearch = document.getElementById('btn-search');

        if (btnSettings) btnSettings.onclick = () => this.openSettings();
        if (btnSettingsSidebar) btnSettingsSidebar.onclick = () => this.openSettings();
        if (btnSearch) btnSearch.onclick = () => this.ui.alert('Busca funcional em breve.');
    },

    ui: {
        async alert(message) {
            return this.showModal({
                title: 'Aviso',
                body: `<p>${message}</p>`,
                actions: [{ text: 'OK', primary: true, resolve: true }]
            });
        },
        async confirm(message) {
            return this.showModal({
                title: 'Confirmar',
                body: `<p>${message}</p>`,
                actions: [
                    { text: 'Cancelar', resolve: false },
                    { text: 'Confirmar', primary: true, resolve: true }
                ]
            });
        },
        async prompt(message, defaultValue = '') {
            return this.showModal({
                title: 'Entrada',
                body: `
                    <div class="input-group">
                        <label class="input-label">${message}</label>
                        <input type="text" id="prompt-input" value="${defaultValue}" autofocus>
                    </div>
                `,
                actions: [
                    { text: 'Cancelar', resolve: null },
                    { text: 'OK', primary: true, resolve: () => document.getElementById('prompt-input').value }
                ]
            });
        },
        showModal({ title, body, actions }) {
            const overlay = document.getElementById('modal-overlay');
            const container = document.getElementById('modal-container');
            
            return new Promise((resolve) => {
                const html = `
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                    </div>
                    <div class="modal-body">${body}</div>
                    <div class="modal-footer">
                        ${actions.map((a, i) => `
                            <button class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'}" data-index="${i}">${a.text}</button>
                        `).join('')}
                    </div>
                `;
                container.innerHTML = html;
                overlay.classList.add('active');

                const cleanup = (value) => {
                    overlay.classList.remove('active');
                    setTimeout(() => { container.innerHTML = ''; }, 300);
                    resolve(value);
                };

                container.querySelectorAll('.btn').forEach(btn => {
                    btn.onclick = () => {
                        const action = actions[btn.getAttribute('data-index')];
                        const val = typeof action.resolve === 'function' ? action.resolve() : action.resolve;
                        cleanup(val);
                    };
                });
            });
        }
    },

    async openSettings() {
        const newName = await this.ui.prompt('Qual o seu nome?', this.state.userName);
        if (newName) {
            this.state.userName = newName;
            this.save();
            this.render();
        }
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
        this.updateSyncStatus('syncing');
        const client = getSupabase();
        
        // Tentar carregar local primeiro para rapidez
        this.loadLocal();

        if (client) {
            console.log('Sincronizando nuvem (ID:', this.state.userId, ')');
            try {
                const { data, error } = await client.from('os_state').select('data').eq('user_id', this.state.userId).single();
                
                if (error) {
                    if (error.code === 'PGRST116') {
                        console.log('Nenhum dado na nuvem para este usuário.');
                        this.updateSyncStatus('online');
                        this.state.isLoaded = true;
                        return;
                    }
                    throw error;
                }

                if (data && data.data) {
                    const s = data.data;
                    // SÓ SOBRESCREVE SE A NUVEM TIVER DADOS REAIS
                    const cloudHasData = s.data && (s.data.tasks.length > 0 || s.data.finances.transactions.length > 0);
                    
                    if (cloudHasData) {
                        this.state.data = s.data;
                        this.state.userName = s.userName || this.state.userName;
                        this.state.hideBalance = s.hideBalance || false;
                        console.log('Dados sincronizados da nuvem.');
                    } else {
                        console.log('Nuvem vazia, mantendo dados locais.');
                    }
                }
                this.updateSyncStatus('online');
            } catch (err) {
                console.error('Erro ao carregar nuvem:', err.message);
                this.updateSyncStatus('error');
            }
        } else {
            this.updateSyncStatus('offline');
        }
        this.state.isLoaded = true;
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
        this.updateSyncStatus('syncing');
        const payload = {
            userName: this.state.userName,
            hideBalance: this.state.hideBalance,
            data: this.state.data
        };
        
        localStorage.setItem('lifeos_cloud_backup', JSON.stringify(payload));
        
        const client = getSupabase();
        if (client) {
            try {
                // Tentamos upsert com user_id
                const { error } = await client.from('os_state').upsert({ 
                    user_id: this.state.userId, 
                    data: payload, 
                    updated_at: new Date() 
                }, { onConflict: 'user_id' });
                
                if (error) throw error;
                this.updateSyncStatus('online');
                console.log('Nuvem atualizada.');
            } catch (err) {
                console.error('Falha de sync nuvem:', err.message);
                this.updateSyncStatus('error');
            }
        } else {
            this.updateSyncStatus('offline');
        }
    },

    updateSyncStatus(status) {
        this.state.syncStatus = status;
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.className = 'sync-dot ' + status;
            indicator.title = 'Status: ' + status;
        }
    },

    async toggleBalance() {
        this.state.hideBalance = !this.state.hideBalance;
        await this.save();
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

    async quickAction(type) {
        this.state.currentModule = type;
        await this.handleFabAction();
        this.state.currentModule = 'dashboard';
        this.render();
    },

    renderTasks() {
        const tasks = this.state.data.tasks;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Tarefas</h1>
                
                <div class="task-quick-add">
                    <input type="text" id="quick-task-input" placeholder="O que precisa ser feito agora?">
                    <button class="btn btn-primary" onclick="App.addQuickTask()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>

                <div class="task-list">
                    ${tasks.map((task, index) => {
                        const tagClass = task.tag ? `tag-${task.tag.toLowerCase()}` : '';
                        return `
                        <div class="card animate-fade-in" style="display: flex; gap: 1rem; padding: 1.25rem; margin-bottom: 0;">
                            <div onclick="App.toggleTask(${index})" style="margin-top: 4px; width: 22px; height: 22px; border: 2px solid var(--primary); border-radius: 50%; background: ${task.done ? 'var(--primary)' : 'transparent'}; flex-shrink: 0; cursor: pointer;"></div>
                            <div style="flex:1;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <span style="text-decoration: ${task.done ? 'line-through' : 'none'}; color: ${task.done ? 'var(--text-hint)' : 'var(--text-primary)'}; font-weight: 500;">${task.text}</span>
                                    <button onclick="App.removeTask(${index})" style="background:none; border:none; color:var(--text-hint); cursor: pointer; padding: 4px;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                                <div class="task-meta">
                                    ${task.tag ? `<span class="task-tag ${tagClass}">${task.tag}</span>` : ''}
                                    ${task.endDate ? `<span class="task-date-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${task.endDate}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `}).join('') || '<div style="grid-column: 1/-1; text-align:center; padding: 4rem; color: var(--text-hint);">Nada por aqui. Use o campo acima para começar.</div>'}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
        
        // Listener para Enter no quick task
        const input = document.getElementById('quick-task-input');
        if (input) {
            input.onkeypress = (e) => { if(e.key === 'Enter') this.addQuickTask(); };
        }
    },

    async addQuickTask() {
        const input = document.getElementById('quick-task-input');
        const text = input.value.trim();
        if (text) {
            this.state.data.tasks.unshift({ text, done: false, createdAt: new Date().toISOString() });
            input.value = '';
            await this.save();
            this.render();
        }
    },

    setFinanceView(view) {
        this.state.financeView = view;
        this.render();
    },

    setFinancePeriod(period) {
        this.state.financePeriod = period;
        this.render();
    },

    renderFinances() {
        const f = this.state.data.finances;
        const currentPeriod = this.state.financePeriod;
        
        // Filtrar transações por período
        const filteredTransactions = f.transactions.filter(t => {
            const tDate = t.date.split('/').reverse().join('-'); // Converter DD/MM/YYYY para YYYY-MM-DD
            return tDate.startsWith(currentPeriod);
        });

        const totalIncome = filteredTransactions.filter(t => t.val > 0).reduce((acc, t) => acc + t.val, 0);
        const totalExpense = Math.abs(filteredTransactions.filter(t => t.val < 0).reduce((acc, t) => acc + t.val, 0));
        
        const balanceDisplay = this.state.hideBalance ? '••••' : `R$ ${f.balance.toLocaleString('pt-BR')}`;
        const safeToSpend = f.balance * 0.6;
        const safeDisplay = this.state.hideBalance ? '••••' : `R$ ${safeToSpend.toLocaleString('pt-BR')}`;

        const categoryMap = {
            'Food': { icon: '🍔', class: 'cat-food' },
            'Transport': { icon: '🚗', class: 'cat-transport' },
            'Subs': { icon: '📺', class: 'cat-subs' },
            'Leisure': { icon: '🎮', class: 'cat-leisure' },
            'Health': { icon: '🏥', class: 'cat-health' },
            'Other': { icon: '💰', class: 'cat-other' }
        };

        const html = `
            <div class="animate-fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 class="display-lg" style="margin: 0;">Finanças</h1>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <input type="month" value="${currentPeriod}" onchange="App.setFinancePeriod(this.value)" 
                               style="width: auto; padding: 6px 12px; font-size: 0.8rem; background: var(--surface-container);">
                        <div class="view-toggle">
                            <button class="toggle-btn ${this.state.financeView === 'list' ? 'active' : ''}" onclick="App.setFinanceView('list')">Lista</button>
                            <button class="toggle-btn ${this.state.financeView === 'table' ? 'active' : ''}" onclick="App.setFinanceView('table')">Tabela</button>
                        </div>
                    </div>
                </div>
                
                <div class="finance-summary">
                    <div class="stat-card">
                        <p class="label-md">Patrimônio Total</p>
                        <div class="stat-value">${balanceDisplay}</div>
                    </div>
                    <div class="stat-card" style="border-left: 4px solid #34d399;">
                        <p class="label-md" style="color: #34d399;">Entradas (Mês)</p>
                        <div class="stat-value" style="color: #34d399;">R$ ${totalIncome.toLocaleString('pt-BR')}</div>
                    </div>
                    <div class="stat-card" style="border-left: 4px solid #f87171;">
                        <p class="label-md" style="color: #f87171;">Saídas (Mês)</p>
                        <div class="stat-value" style="color: #f87171;">R$ ${totalExpense.toLocaleString('pt-BR')}</div>
                    </div>
                </div>

                <div class="chart-card">
                    <canvas id="financeChart"></canvas>
                </div>

                <div class="card-grid-2">
                    <div class="card card-elevated" style="margin-bottom: 2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h3>Metas de Economia</h3>
                            <button class="btn btn-ghost" style="padding: 5px;" onclick="App.addSavingsGoal()">+</button>
                        </div>
                        ${(f.savingsGoals || []).map((g, i) => `
                            <div style="margin-bottom: 1.25rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-size: 0.85rem; font-weight: 600;">${g.title}</span>
                                    <span style="font-size: 0.85rem; color: var(--text-hint);">R$ ${g.current.toLocaleString('pt-BR')} / ${g.target.toLocaleString('pt-BR')}</span>
                                </div>
                                <div style="height: 8px; background: var(--surface-high); border-radius: 4px; overflow: hidden; position: relative; cursor: pointer;" onclick="App.updateSavingsGoal(${i})">
                                    <div style="height: 100%; width: ${Math.min(100, (g.current/g.target)*100)}%; background: var(--primary); transition: width 0.5s;"></div>
                                </div>
                            </div>
                        `).join('') || '<p style="color: var(--text-hint); font-size: 0.8rem;">Nenhuma meta definida.</p>'}
                    </div>

                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>Transações de ${currentPeriod}</h3>
                        </div>
                        
                        ${this.state.financeView === 'list' ? `
                            <div class="transaction-list">
                                ${filteredTransactions.map((t, index) => {
                                    const cat = categoryMap[t.category] || categoryMap['Other'];
                                    return `
                                    <div class="transaction-item">
                                        <div class="transaction-info">
                                            <div class="category-icon ${cat.class}">${cat.icon}</div>
                                            <div>
                                                <p style="font-weight: 600; font-size: 0.9rem;">${t.desc}</p>
                                                <p class="label-md" style="font-size: 0.6rem;">${t.date}</p>
                                            </div>
                                        </div>
                                        <div style="text-align: right; display: flex; align-items: center; gap: 0.75rem;">
                                            <div style="font-weight: 700; color: ${t.val < 0 ? '#f87171' : '#34d399'}; font-size: 0.9rem;">
                                                ${t.val < 0 ? '-' : '+'} R$ ${Math.abs(t.val).toLocaleString('pt-BR')}
                                            </div>
                                            <button onclick="App.removeTransaction(${index})" style="background:none; border:none; color:var(--text-hint); cursor: pointer;">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                `}).join('') || '<p style="text-align:center; padding: 2rem; color: var(--text-hint);">Sem dados para este mês.</p>'}
                            </div>
                        ` : `
                            <div class="card" style="padding: 0; overflow-x: auto;">
                                <table class="finance-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Descrição</th>
                                            <th>Categoria</th>
                                            <th style="text-align: right;">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${filteredTransactions.map(t => `
                                            <tr>
                                                <td>${t.date}</td>
                                                <td style="font-weight: 600;">${t.desc}</td>
                                                <td>${t.category || 'Other'}</td>
                                                <td style="text-align: right; color: ${t.val < 0 ? '#f87171' : '#34d399'}; font-weight: 700;">
                                                    R$ ${t.val.toLocaleString('pt-BR')}
                                                </td>
                                            </tr>
                                        `).join('') || '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Vazio.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
        setTimeout(() => this.initFinanceChart(filteredTransactions), 100);
    },

    initFinanceChart(transactions) {
        const ctx = document.getElementById('financeChart');
        if (!ctx) return;

        // Agrupar por categorias
        const catTotals = {};
        transactions.filter(t => t.val < 0).forEach(t => {
            const cat = t.category || 'Other';
            catTotals[cat] = (catTotals[cat] || 0) + Math.abs(t.val);
        });

        const labels = Object.keys(catTotals);
        const data = Object.values(catTotals);
        
        if (this.chart) this.chart.destroy();
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gastos por Categoria (R$)',
                    data: data,
                    backgroundColor: 'rgba(223, 183, 255, 0.6)',
                    borderColor: '#DFB7FF',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    async addSavingsGoal() {
        const title = await this.ui.prompt('Nome da meta (Ex: Viagem)');
        const target = parseFloat(await this.ui.prompt('Valor total (R$)'));
        if (title && !isNaN(target)) {
            if (!this.state.data.finances.savingsGoals) this.state.data.finances.savingsGoals = [];
            this.state.data.finances.savingsGoals.push({ title, target, current: 0 });
            await this.save();
            this.render();
        }
    },

    async updateSavingsGoal(i) {
        const val = parseFloat(await this.ui.prompt('Adicionar valor à meta (R$)', '0'));
        if (!isNaN(val)) {
            this.state.data.finances.savingsGoals[i].current += val;
            await this.save();
            this.render();
        }
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

    async openNote(index) {
        const note = this.state.data.notes[index];
        const newTitle = await this.ui.prompt('Título:', note.title);
        const newText = await this.ui.prompt('Conteúdo:', note.text);
        if (newTitle !== null) note.title = newTitle;
        if (newText !== null) note.text = newText;
        await this.save(); 
        this.render();
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
                    <button class="fab" style="position: static;" onclick="App.ui.alert('Foco iniciado (Simulação)')">Iniciar</button>
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    async handleFabAction() {
        const module = this.state.currentModule;
        if (module === 'tasks') {
            const res = await this.ui.showModal({
                title: 'Nova Tarefa Detalhada',
                body: `
                    <div class="input-group">
                        <label class="input-label">O que fazer?</label>
                        <input type="text" id="task-text" placeholder="Ex: Estudar Java">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="input-group">
                            <label class="input-label">Tipo</label>
                            <select id="task-tag">
                                <option value="">Nenhum</option>
                                <option value="Work">Trabalho</option>
                                <option value="Personal">Pessoal</option>
                                <option value="Urgent">Urgente</option>
                                <option value="Study">Estudo</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label class="input-label">Prazo</label>
                            <input type="date" id="task-date">
                        </div>
                    </div>
                `,
                actions: [
                    { text: 'Cancelar', resolve: null },
                    { text: 'Criar Tarefa', primary: true, resolve: () => {
                        return {
                            text: document.getElementById('task-text').value,
                            tag: document.getElementById('task-tag').value,
                            endDate: document.getElementById('task-date').value
                        };
                    }}
                ]
            });

            if (res && res.text) {
                this.state.data.tasks.unshift({ ...res, done: false });
                await this.save(); 
                this.render();
            }
        } else if (module === 'finances') {
            const res = await this.ui.showModal({
                title: 'Nova Transação',
                body: `
                    <div class="input-group">
                        <label class="input-label">O que foi?</label>
                        <input type="text" id="fin-desc" placeholder="Ex: Mercado">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="input-group">
                            <label class="input-label">Valor (Positivo ou Negativo)</label>
                            <input type="number" id="fin-val" step="0.01" placeholder="0.00">
                        </div>
                        <div class="input-group">
                            <label class="input-label">Categoria</label>
                            <select id="fin-cat">
                                <option value="Other">Outros</option>
                                <option value="Food">Alimentação</option>
                                <option value="Transport">Transporte</option>
                                <option value="Subs">Assinaturas</option>
                                <option value="Leisure">Lazer</option>
                                <option value="Health">Saúde</option>
                            </select>
                        </div>
                    </div>
                `,
                actions: [
                    { text: 'Cancelar', resolve: null },
                    { text: 'Salvar', primary: true, resolve: () => {
                        return {
                            desc: document.getElementById('fin-desc').value,
                            val: parseFloat(document.getElementById('fin-val').value),
                            category: document.getElementById('fin-cat').value
                        };
                    }}
                ]
            });

            if (res && res.desc && !isNaN(res.val)) {
                this.state.data.finances.transactions.unshift({ ...res, date: new Date().toLocaleDateString('pt-BR') });
                this.state.data.finances.balance += res.val;
                await this.save(); 
                this.render();
            }
        } else if (module === 'notes') {
            const title = await this.ui.prompt('Título da nota:');
            if (title) {
                const text = await this.ui.prompt('Conteúdo:');
                this.state.data.notes.unshift({ title, text });
                await this.save(); 
                this.render();
            }
        } else if (module === 'goals') {
            const title = await this.ui.prompt('Sua nova meta:');
            if (title) {
                this.state.data.goals.unshift({ title, progress: 0 });
                await this.save(); 
                this.render();
            }
        }
    },

    async toggleTask(index) {
        this.state.data.tasks[index].done = !this.state.data.tasks[index].done;
        await this.save();
        this.render();
    },

    async removeTask(i) { if(await this.ui.confirm('Deseja remover esta tarefa?')){ this.state.data.tasks.splice(i,1); await this.save(); this.render(); } },
    async removeTransaction(i) { if(await this.ui.confirm('Remover transação?')){ const t=this.state.data.finances.transactions[i]; this.state.data.finances.balance-=t.val; this.state.data.finances.transactions.splice(i,1); await this.save(); this.render(); } },
    async removeNote(i) { if(await this.ui.confirm('Excluir nota permanentemente?')){ this.state.data.notes.splice(i,1); await this.save(); this.render(); } },
    async removeGoal(i) { if(await this.ui.confirm('Desistir desta meta?')){ this.state.data.goals.splice(i,1); await this.save(); this.render(); } },
    async removeIdea(i) { if(await this.ui.confirm('Remover ideia?')){ this.state.data.ideas.splice(i,1); await this.save(); this.render(); } },
    async updateGoalProgress(i) { 
        const p = await this.ui.prompt('Progresso atual (%)', this.state.data.goals[i].progress); 
        if(p!==null){ this.state.data.goals[i].progress = Math.min(100, Math.max(0, parseInt(p))); await this.save(); this.render(); } 
    }
};

// Auto-inicializar
window.addEventListener('DOMContentLoaded', () => App.init());
