/**
 * Life OS - Premium Personal Application Engine
 * Optimized for PWA and Mobile Experience
 */

const App = {
    state: {
        currentModule: 'dashboard',
        userName: 'Rodrigo',
        hideBalance: JSON.parse(localStorage.getItem('lifeos_hidebalance')) || false,
        data: {
            finances: JSON.parse(localStorage.getItem('lifeos_finances')) || { balance: 0, transactions: [] },
            tasks: JSON.parse(localStorage.getItem('lifeos_tasks')) || [],
            notes: JSON.parse(localStorage.getItem('lifeos_notes')) || [],
            goals: JSON.parse(localStorage.getItem('lifeos_goals')) || [],
            ideas: JSON.parse(localStorage.getItem('lifeos_ideas')) || [],
            time: JSON.parse(localStorage.getItem('lifeos_time')) || { deepWorkSessions: 0, lastSession: null }
        }
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkFirstRun();
        this.render();
        console.log('Life OS Initialized');
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

        // Settings & Search Actions
        const openSettings = () => {
            const newName = prompt('Qual o seu nome?', this.state.userName);
            if (newName) {
                this.state.userName = newName;
                this.save();
                this.render();
            }
        };

        document.getElementById('btn-settings').addEventListener('click', openSettings);
        document.getElementById('btn-settings-sidebar').addEventListener('click', openSettings);

        document.getElementById('btn-search').addEventListener('click', () => {
            alert('Busca global em breve no Life OS.');
        });
    },

    switchModule(moduleName) {
        if (this.state.currentModule === moduleName) return;
        
        this.state.currentModule = moduleName;
        
        // Update Nav UI
        this.dom.navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-module') === moduleName);
        });
        this.dom.sidebarItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-module') === moduleName);
        });

        // Transition content
        this.dom.mainContent.style.opacity = '0';
        setTimeout(() => {
            this.render();
            this.dom.mainContent.style.opacity = '1';
        }, 150);
    },

    save() {
        Object.keys(this.state.data).forEach(key => {
            localStorage.setItem(`lifeos_${key}`, JSON.stringify(this.state.data[key]));
        });
        localStorage.setItem('lifeos_hidebalance', JSON.stringify(this.state.hideBalance));
    },

    toggleBalance() {
        this.state.hideBalance = !this.state.hideBalance;
        this.save();
        this.render();
    },

    render() {
        const module = this.state.currentModule;
        this.dom.mainContent.innerHTML = '';
        
        // Update FAB Visibility
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

    // --- RENDERING MODULES ---

    renderDashboard() {
        const t = this.state.data;
        const balanceDisplay = this.state.hideBalance ? '••••••' : `R$ ${t.finances.balance.toLocaleString('pt-BR')}`;
        
        const html = `
            <div class="animate-fade-in">
                <p class="label-md">Dashboard</p>
                <h1 class="display-lg">Olá, ${this.state.userName}</h1>
                
                <!-- Quick Action Widgets -->
                <div class="dashboard-widget" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 2rem;">
                    <button class="card" onclick="App.quickAction('tasks')" style="padding: 1rem; margin: 0; text-align: center; background: var(--surface-container); border:none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" style="margin-bottom: 5px;"><path d="M12 5v14M5 12h14"/></svg>
                        <p style="font-size: 0.7rem; font-weight: 600;">Tarefa</p>
                    </button>
                    <button class="card" onclick="App.quickAction('finances')" style="padding: 1rem; margin: 0; text-align: center; background: var(--surface-container); border:none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" style="margin-bottom: 5px;"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        <p style="font-size: 0.7rem; font-weight: 600;">Finança</p>
                    </button>
                    <button class="card" onclick="App.quickAction('notes')" style="padding: 1rem; margin: 0; text-align: center; background: var(--surface-container); border:none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F1DBFF" stroke-width="2" style="margin-bottom: 5px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <p style="font-size: 0.7rem; font-weight: 600;">Nota</p>
                    </button>
                </div>

                <div class="card-grid-2">
                    <div class="card card-elevated" style="position: relative;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <p class="label-md">Patrimônio Geral</p>
                            <button onclick="App.toggleBalance()" style="background: none; border: none; color: var(--text-hint); cursor: pointer; padding: 5px;">
                                ${this.state.hideBalance ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'}
                            </button>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1rem;">
                            <div>
                                <h2 style="font-size: 2.25rem;">${balanceDisplay}</h2>
                                <p style="color: var(--text-secondary); font-size: 0.9rem;">Saldo líquido</p>
                            </div>
                        </div>
                    </div>

                    <div class="card" onclick="App.switchModule('time')" style="background: linear-gradient(135deg, var(--primary-container) 0%, #2D0050 100%); cursor: pointer; display: flex; flex-direction: column; justify-content: center;">
                        <p class="label-md" style="color: var(--primary);">Foco / Pomodoro</p>
                        <div style="text-align: center; padding: 0.5rem 0;">
                            <span style="font-size: 2.5rem; font-weight: 800; font-family: 'Manrope';">25:00</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; margin-bottom: 1rem;">
                    <h3>Checklist</h3>
                    <span class="label-md" onclick="App.switchModule('tasks')" style="color: var(--primary); cursor: pointer;">Ver todos</span>
                </div>
                <div id="dashboard-tasks">
                    ${t.tasks.slice(0, 3).map(task => `
                        <div class="card" style="padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem;">
                            <div onclick="App.toggleTask(${t.tasks.indexOf(task)})" style="width: 20px; height: 20px; border: 2px solid var(--primary); border-radius: 50%; background: ${task.done ? 'var(--primary)' : 'transparent'}; cursor: pointer;"></div>
                            <span style="text-decoration: ${task.done ? 'line-through' : 'none'}; color: ${task.done ? 'var(--text-hint)' : 'var(--text-primary)'}">${task.text}</span>
                        </div>
                    `).join('') || '<p style="color: var(--text-hint); text-align: center;">Tudo em ordem.</p>'}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    quickAction(type) {
        this.state.currentModule = type; // Temporarily switch module state for logic
        this.handleFabAction();
        this.state.currentModule = 'dashboard'; // Back to dashboard
        this.render();
    },

    renderTasks() {
        const tasks = this.state.data.tasks;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Tarefas</h1>
                <div class="view-controls" style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <span class="label-md" onclick="App.state.taskView='list'; App.render()" style="${this.state.taskView !== 'calendar' ? 'color: var(--primary); border-bottom: 2px solid var(--primary);' : ''} padding-bottom: 4px; cursor:pointer;">Lista</span>
                    <span class="label-md" onclick="App.state.taskView='calendar'; App.render()" style="${this.state.taskView === 'calendar' ? 'color: var(--primary); border-bottom: 2px solid var(--primary);' : ''} padding-bottom: 4px; cursor:pointer;">Calendário</span>
                </div>

                ${this.state.taskView === 'calendar' ? this.getCalendarHtml() : `
                <div class="task-list">
                    ${tasks.map((task, index) => `
                        <div class="card ${task.done ? 'done' : ''}" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem;">
                            <input type="checkbox" ${task.done ? 'checked' : ''} onclick="App.toggleTask(${index})" style="width: 22px; height: 22px; border-radius: 50%; accent-color: var(--primary);">
                            <div style="flex: 1;">
                                <div style="text-decoration: ${task.done ? 'line-through' : 'none'}; color: ${task.done ? 'var(--text-hint)' : 'var(--text-primary)'}">${task.text}</div>
                                <div class="label-md" style="font-size: 0.6rem; margin-top: 4px;">${task.tag || 'Pessoal'}</div>
                            </div>
                        </div>
                    `).join('') || `
                        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-hint);">
                            <p>O que vamos conquistar hoje?</p>
                        </div>
                    `}
                </div>`}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    getCalendarHtml() {
        const date = new Date();
        const month = date.toLocaleString('pt-BR', { month: 'long' });
        const year = date.getFullYear();
        const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
        const firstDay = new Date(year, date.getMonth(), 1).getDay();
        
        const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        
        return `
            <div class="card" style="padding: 1.5rem;">
                <h3 style="text-transform: capitalize; margin-bottom: 1rem;">${month} ${year}</h3>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; text-align: center;">
                    ${weekdays.map(w => `<div class="label-md" style="font-size: 0.6rem;">${w}</div>`).join('')}
                    ${Array(firstDay).fill('').map(() => `<div></div>`).join('')}
                    ${Array.from({length: daysInMonth}, (_, i) => i + 1).map(d => `
                        <div style="padding: 8px 0; border-radius: 8px; ${d === date.getDate() ? 'background: var(--primary); color: var(--on-primary); font-weight: bold;' : ''}">${d}</div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderFinances() {
        const f = this.state.data.finances;
        const balanceDisplay = this.state.hideBalance ? '••••' : `R$ ${f.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Finanças</h1>
                
                <div class="card card-elevated">
                    <p class="label-md">Patrimônio Total</p>
                    <h2 style="font-size: 2.25rem; margin: 0.5rem 0;">${balanceDisplay}</h2>
                    <div style="height: 60px; width: 100%; margin-top: 1rem; display: flex; align-items: flex-end; gap: 4px;">
                        ${[40, 60, 45, 70, 85, 65, 90, 100].map(h => `<div style="flex:1; background: var(--primary); height: ${h}%; border-radius: 2px 2px 0 0; opacity: 0.6;"></div>`).join('')}
                    </div>
                </div>

                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Histórico</h3>
                <div class="transaction-list">
                    ${f.transactions.map((t, index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--surface-high); display: flex; align-items: center; justify-content: center;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>
                                </div>
                                <div>
                                    <p style="font-weight: 500;">${t.desc}</p>
                                    <p class="label-md" style="font-size: 0.6rem;">${t.date}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1.25rem;">
                                <span style="font-weight: 600; color: ${t.val < 0 ? '#FF5252' : '#4CAF50'}">${t.val < 0 ? '-' : '+'} R$ ${Math.abs(t.val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="App.editTransaction(${index})" style="background:none; border:none; color: var(--text-hint); cursor:pointer; padding: 5px;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button onclick="App.removeTransaction(${index})" style="background:none; border:none; color: #FF5252; cursor:pointer; padding: 5px;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') || '<p style="color: var(--text-hint); text-align: center; padding: 3rem;">Nenhuma transação registrada.</p>'}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    editTransaction(index) {
        const t = this.state.data.finances.transactions[index];
        const newDesc = prompt('Editar descrição:', t.desc);
        const newValStr = prompt('Editar valor (ex: -50 para saída):', t.val);
        if (newDesc !== null && newValStr !== null) {
            const newVal = parseFloat(newValStr);
            if (!isNaN(newVal)) {
                this.state.data.finances.balance += (newVal - t.val);
                this.state.data.finances.transactions[index] = { ...t, desc: newDesc, val: newVal };
                this.save();
                this.render();
            }
        }
    },

    removeTransaction(index) {
        if (confirm('Deseja remover esta transação?')) {
            const t = this.state.data.finances.transactions[index];
            this.state.data.finances.balance -= t.val;
            this.state.data.finances.transactions.splice(index, 1);
            this.save();
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
                        <div class="card" onclick="App.openNote(${index})" style="break-inside: avoid; padding: 1.25rem; margin-bottom: 1rem; cursor:pointer;">
                            <h3 style="font-size: 1rem; margin-bottom: 5px;">${note.title}</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${note.text}</p>
                        </div>
                    `).join('') || '<p style="color: var(--text-hint); text-align: center; column-span: all; padding-top: 4rem;">Capture seus pensamentos...</p>'}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    openNote(index) {
        const note = this.state.data.notes[index];
        const newTitle = prompt('Editar título da nota:', note.title);
        const newText = prompt(`Editando conteúdo de: ${newTitle || note.title}`, note.text);
        if (newTitle !== null) this.state.data.notes[index].title = newTitle;
        if (newText !== null) this.state.data.notes[index].text = newText;
        if (newTitle !== null || newText !== null) {
            this.save();
            this.render();
        }
    },

    renderGoals() {
        const goals = this.state.data.goals;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Metas</h1>
                <div class="${window.innerWidth >= 1024 ? 'card-grid-2' : ''}">
                ${goals.map((goal, index) => `
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                            <div onclick="App.editGoal(${index})" style="cursor:pointer; flex: 1;">
                                <h3 style="font-size: 1.1rem;">${goal.title}</h3>
                                <p class="label-md" style="margin-top: 4px;">${goal.category}</p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-weight: 600; color: var(--primary);">${goal.progress}%</span>
                                <button onclick="App.removeGoal(${index})" style="background: none; border: none; color: #FF5252; cursor: pointer;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div style="height: 6px; width: 100%; background: var(--surface-high); border-radius: 3px; overflow: hidden; cursor:pointer;" onclick="App.updateGoalProgress(${index})">
                            <div style="height: 100%; width: ${goal.progress}%; background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);"></div>
                        </div>
                    </div>
                `).join('')}
                </div>
                ${goals.length === 0 ? '<p style="color: var(--text-hint); text-align: center; padding-top: 4rem;">Defina seu horizonte.</p>' : ''}
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    renderIdeas() {
        const ideas = this.state.data.ideas;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Ideias</h1>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                    ${ideas.map(idea => `
                        <div class="card" style="border-left: 4px solid var(--accent);">
                            <p>${idea.text}</p>
                            <p class="label-md" style="margin-top: 10px; font-size: 0.6rem;">${idea.date}</p>
                        </div>
                    `).join('') || '<p style="color: var(--text-hint); text-align: center;">Capture o brilho momentâneo.</p>'}
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    editGoal(index) {
        const goal = this.state.data.goals[index];
        const newTitle = prompt('Editar título da meta:', goal.title);
        if (newTitle) {
            this.state.data.goals[index].title = newTitle;
            this.save();
            this.render();
        }
    },

    updateGoalProgress(index) {
        const newProg = prompt('Progresso (%)', this.state.data.goals[index].progress);
        if (newProg !== null) {
            this.state.data.goals[index].progress = Math.min(100, Math.max(0, parseInt(newProg)));
            this.save();
            this.render();
        }
    },

    removeGoal(index) {
        if (confirm('Deseja remover esta meta?')) {
            this.state.data.goals.splice(index, 1);
            this.save();
            this.render();
        }
    },

    renderTime() {
        const t = this.state.data.time;
        const html = `
            <div class="animate-fade-in">
                <h1 class="display-lg">Tempo</h1>
                <div class="card card-elevated" style="text-align: center; padding: 3rem 1rem;">
                    <p class="label-md">Foco Atual</p>
                    <div style="font-size: 4rem; font-weight: 800; font-family: 'Manrope'; margin: 1.5rem 0;">25:00</div>
                    <div style="display: flex; justify-content: center; gap: 1.5rem;">
                        <button onclick="alert('Pomodoro Reiniciado')" class="fab" style="position: static; background: var(--surface-high); color: var(--text-primary);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"></path><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg></button>
                        <button onclick="alert('Iniciando Sessão de Foco...')" class="fab" style="position: static;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>
                    </div>
                </div>
                
                <h3 style="margin: 2rem 0 1rem;">Estatísticas Semanais</h3>
                <div class="card" style="display: flex; justify-content: space-around; padding: 1.5rem 1rem;">
                    <div style="text-align: center;">
                        <p class="label-md">Sessões</p>
                        <p style="font-size: 1.5rem; font-weight: 700; margin-top: 5px;">12</p>
                    </div>
                    <div style="text-align: center;">
                        <p class="label-md">Total</p>
                        <p style="font-size: 1.5rem; font-weight: 700; margin-top: 5px;">5h 30m</p>
                    </div>
                </div>
            </div>
        `;
        this.dom.mainContent.innerHTML = html;
    },

    // --- ACTIONS ---

    handleFabAction() {
        const module = this.state.currentModule;
        let promptVal;
        
        switch (module) {
            case 'tasks':
                promptVal = prompt('Nova tarefa:');
                if (promptVal) {
                    this.state.data.tasks.unshift({ text: promptVal, done: false, tag: 'Pessoal' });
                    this.save();
                    this.render();
                }
                break;
            case 'finances':
                const isIncome = confirm('É uma entrada? (OK para Sim, Cancelar para Saída)');
                const desc = prompt('Descrição:');
                let val = parseFloat(prompt('Valor:'));
                if (desc && !isNaN(val)) {
                    val = isIncome ? Math.abs(val) : -Math.abs(val);
                    this.state.data.finances.transactions.unshift({ desc, val, date: new Date().toLocaleDateString('pt-BR') });
                    this.state.data.finances.balance += val;
                    this.save();
                    this.render();
                }
                break;
            case 'notes':
                const title = prompt('Título da nota:');
                const text = prompt('Conteúdo:');
                if (title) {
                    this.state.data.notes.unshift({ title, text });
                    this.save();
                    this.render();
                }
                break;
            case 'goals':
                const gTitle = prompt('Nome da meta:');
                const gCat = prompt('Categoria:');
                if (gTitle) {
                    this.state.data.goals.unshift({ title: gTitle, category: gCat, progress: 0 });
                    this.save();
                    this.render();
                }
                break;
            case 'ideas':
                const ideaText = prompt('Sua ideia brilhante:');
                if (ideaText) {
                    this.state.data.ideas.unshift({ text: ideaText, date: new Date().toLocaleDateString('pt-BR') });
                    this.save();
                    this.render();
                }
                break;
        }
    },

    toggleTask(index) {
        this.state.data.tasks[index].done = !this.state.data.tasks[index].done;
        this.save();
        this.render();
    }
};

// Start App
window.addEventListener('DOMContentLoaded', () => App.init());
