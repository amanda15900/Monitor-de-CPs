// VERIFICAÇÃO DE AUTENTICAÇÃO
if (sessionStorage.getItem('isAuthenticated') !== 'true') {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE ELEMENTOS ---
    const mainContainer = document.getElementById('main-container');
    const alertList = document.getElementById('alert-list');
    const addEmpresaForm = document.getElementById('add-empresa-form');
    const addObraForm = document.getElementById('add-obra-form');
    const addLoteForm = document.getElementById('add-lote-form');
    const editLoteModal = document.getElementById('editLoteModal');
    const editLoteForm = document.getElementById('edit-lote-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const lixeiraBtn = document.getElementById('clear-all-btn');
    const lixeiraModal = document.getElementById('lixeiraModal');
    const lixeiraList = document.getElementById('lixeira-list');
    const closeLixeiraBtn = document.getElementById('close-lixeira-btn');

    // --- BANCO DE DADOS E REGRAS ---
    let db = JSON.parse(localStorage.getItem('appConcretoDBFinal')) || { empresas: {}, lixeira: [] };
    const salvarDados = () => localStorage.setItem('appConcretoDBFinal', JSON.stringify(db));
    const metasDeValidacao = {
        '1': { min: 0.20 }, '3': { min: 0.40 }, '7': { min: 0.65 }, '14': { min: 0.75 },
        '21': { min: 0.90 }, '28': { min: 1.00 }, '63': { min: 1.10 }
    };

    // --- FUNÇÃO PARA LIMPAR LIXEIRA ANTIGA ---
    function limparLixeiraAntiga() {
        const agora = new Date();
        const quinzeDiasEmMs = 15 * 24 * 60 * 60 * 1000;
        const lixeiraOriginalCount = db.lixeira ? db.lixeira.length : 0;

        if (db.lixeira) {
            db.lixeira = db.lixeira.filter(item => (agora - new Date(item.dataExclusao)) < quinzeDiasEmMs);
        }

        if (db.lixeira && db.lixeira.length < lixeiraOriginalCount) {
            console.log(`${lixeiraOriginalCount - db.lixeira.length} item(ns) antigos foram removidos da lixeira.`);
            salvarDados();
        }
    }

    // --- LÓGICA DO CABEÇALHO E MODAIS ---
    logoutBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente sair do sistema?')) {
            sessionStorage.removeItem('isAuthenticated');
            window.location.href = 'login.html';
        }
    });

    lixeiraBtn.addEventListener('click', () => {
        renderizarLixeira();
        lixeiraModal.style.display = 'flex';
    });

    closeLixeiraBtn.addEventListener('click', () => lixeiraModal.style.display = 'none');
    
    cancelEditBtn.addEventListener('click', () => editLoteModal.style.display = 'none');

    window.addEventListener('click', e => {
        if (e.target == editLoteModal) editLoteModal.style.display = 'none';
        if (e.target == lixeiraModal) lixeiraModal.style.display = 'none';
    });

    // --- FUNÇÕES PARA GERENCIAR O ESTADO DAS SEÇÕES ABERTAS ---
    function getEstadoAberto() {
        const openIds = new Set();
        document.querySelectorAll('.collapsible-header.active').forEach(header => {
            if (header.id) openIds.add(header.id);
        });
        return openIds;
    }

    function restaurarEstadoAberto(openIds) {
        if (!openIds) return;
        openIds.forEach(id => {
            const header = document.getElementById(id);
            if (header) {
                header.classList.add('active');
                const content = header.nextElementSibling;
                if (content) content.classList.add('active');
            }
        });
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderizarTudo() {
        const estadoAberto = getEstadoAberto();
        renderizarSeletores();
        renderizarAlertCenter();
        renderizarEstruturaPrincipal();
        restaurarEstadoAberto(estadoAberto);
    }

    function renderizarEstruturaPrincipal() {
        mainContainer.innerHTML = '';
        Object.keys(db.empresas).sort().forEach(nomeEmpresa => {
            const empresa = db.empresas[nomeEmpresa];
            const empresaDiv = document.createElement('div');
            empresaDiv.className = 'empresa-container card';
            
            const empresaHeader = document.createElement('h2');
            empresaHeader.className = 'collapsible-header';
            empresaHeader.id = `empresa-header-${nomeEmpresa.replace(/\s+/g, '-')}`;
            // MUDANÇA AQUI: Removido o botão duplicado. Agora só existe o botão de lixeira.
            empresaHeader.innerHTML = `<span><i class="fa-solid fa-building"></i> ${nomeEmpresa}</span> 
                <button title="Mover para Lixeira" class="icon-btn delete-btn" data-tipo="empresa" data-empresa="${nomeEmpresa}"><i class="fa-solid fa-trash-can"></i></button>`;
            
            const obrasContainer = document.createElement('div');
            obrasContainer.className = 'collapsible-content';
            const obrasWrapper = document.createElement('div');

            empresa.obras.forEach(obra => {
                const obraDiv = document.createElement('div');
                obraDiv.className = 'obra-card';
                obraDiv.id = `obra-${obra.nome.replace(/\s+/g, '-')}-${nomeEmpresa.replace(/\s+/g, '-')}`;
                
                const obraHeader = document.createElement('h3');
                obraHeader.className = 'collapsible-header';
                obraHeader.id = `obra-header-${obra.nome.replace(/\s+/g, '-')}-${nomeEmpresa.replace(/\s+/g, '-')}`;
                // MUDANÇA AQUI: Removido o botão duplicado.
                obraHeader.innerHTML = `<span><i class="fa-solid fa-hard-hat"></i> ${obra.nome}</span>
                    <div>
                        <button title="Gerar Relatório da Obra" class="icon-btn report-btn" data-empresa="${nomeEmpresa}" data-obra="${obra.nome}"><i class="fa-solid fa-print"></i></button>
                        <button title="Mover para Lixeira" class="icon-btn delete-btn" data-tipo="obra" data-empresa="${nomeEmpresa}" data-obra="${obra.nome}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>`;
                
                const lotesContainer = document.createElement('div');
                lotesContainer.className = 'collapsible-content';
                const lotesWrapper = document.createElement('div');

                obra.lotes.forEach(lote => {
                    lotesWrapper.appendChild(criarTabelaLote(lote));
                });
                lotesContainer.appendChild(lotesWrapper);
                obraDiv.appendChild(obraHeader);
                obraDiv.appendChild(lotesContainer);
                obrasWrapper.appendChild(obraDiv);
            });
            obrasContainer.appendChild(obrasWrapper);
            empresaDiv.appendChild(empresaHeader);
            empresaDiv.appendChild(obrasContainer);
            mainContainer.appendChild(empresaDiv);
        });
    }

    function criarTabelaLote(lote) {
        const table = document.createElement('table');
        table.className = 'lote-table';
        table.id = `lote-${lote.id}`;
        const dataFormatada = new Date(lote.dataEntrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const headerInfo = `Lote ID ${lote.id.slice(-4)} | FCK: ${lote.fck} MPa | Entrada: ${dataFormatada}`;
        table.innerHTML = `<thead>...</thead><tbody></tbody><tfoot>...</tfoot>`;
        const thead = table.querySelector('thead');
        // MUDANÇA AQUI: Removido o botão duplicado.
        thead.innerHTML = `<tr><th colspan="4"><div class="lote-header"><span>${headerInfo}</span>
            <div>
                <button title="Editar Lote" class="icon-btn edit-lote-btn" data-lote-id="${lote.id}"><i class="fa-solid fa-pencil"></i></button>
                <button title="Gerar PDF do Lote" class="icon-btn pdf-btn" data-lote-id="${lote.id}"><i class="fa-solid fa-file-pdf"></i></button>
                <button title="Mover para Lixeira" class="icon-btn delete-btn" data-tipo="lote" data-lote-id="${lote.id}"><i class="fa-solid fa-trash-can"></i></button>
            </div></div></th></tr><tr><th>Dias</th><th>Resultados (MPa)</th><th>Média (MPa)</th><th>Ações</th></tr>`;
        const tbody = table.querySelector('tbody');
        const diasOrdenados = Object.keys(lote.ensaios).sort((a,b)=>parseInt(a)-parseInt(b));
        diasOrdenados.forEach(dias => {
            const ensaio = lote.ensaios[dias];
            const tr = document.createElement('tr');
            tr.id = `ensaio-${lote.id}-${dias}`;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataEnsaio = new Date(new Date(lote.dataEntrada).getTime() + dias * 24 * 60 * 60 * 1000);
            dataEnsaio.setHours(0, 0, 0, 0);
            if (dataEnsaio <= hoje && ensaio.resultados.length === 0) {
                tr.classList.add('ensaio-pendente');
            }
            let mediaHtml = '-';
            if (ensaio.media) {
                const meta = metasDeValidacao[dias];
                const metaAtingida = meta ? (ensaio.media/lote.fck) >= meta.min : false;
                mediaHtml = `<span class="${metaAtingida ? 'resultado-verde':'resultado-vermelho'}">${ensaio.media.toFixed(2)}</span>`;
            }
            tr.innerHTML = `<td>${dias} dias</td><td>${ensaio.resultados.join(', ')||'Nenhum'}</td><td>${mediaHtml}</td><td class="actions"><button title="Adicionar Resultado" class="icon-btn add-result" data-lote-id="${lote.id}" data-dias="${dias}"><i class="fa-solid fa-plus"></i></button><button title="Excluir Ensaio" class="icon-btn delete-ensaio-btn" data-lote-id="${lote.id}" data-dias="${dias}"><i class="fa-solid fa-times"></i></button></td>`;
            tbody.appendChild(tr);
        });
        const tfoot = table.querySelector('tfoot');
        tfoot.innerHTML = `<tr><td colspan="4"><button class="add-ensaio-btn" data-lote-id="${lote.id}">+ Adicionar Ensaio</button></td></tr>`;
        return table;
    };

    // --- LÓGICA DE EVENTOS PRINCIPAL ---
    mainContainer.addEventListener('click', e => {
        const target = e.target;
        const collapsibleHeader = target.closest('.collapsible-header');
        const iconBtn = target.closest('.icon-btn');
        const addEnsaioBtn = target.closest('.add-ensaio-btn');

        if (collapsibleHeader && !iconBtn) {
            collapsibleHeader.classList.toggle('active');
            const content = collapsibleHeader.nextElementSibling;
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.toggle('active');
            }
        } else if (iconBtn) {
            // MUDANÇA AQUI: Agora, o botão 'delete-btn' chama a função de mover para a lixeira.
            if (iconBtn.classList.contains('delete-btn')) handleMoverParaLixeira(iconBtn.dataset);
            
            else if (iconBtn.classList.contains('add-result')) handleAddResult(iconBtn.dataset);
            else if (iconBtn.classList.contains('pdf-btn')) handlePdfExport(iconBtn.dataset.loteId); 
            else if (iconBtn.classList.contains('report-btn')) handleObraReport(iconBtn.dataset);
            else if (iconBtn.classList.contains('edit-lote-btn')) handleEditLote(iconBtn.dataset.loteId);
            else if (iconBtn.classList.contains('delete-ensaio-btn')) handleDeleteEnsaio(iconBtn.dataset);
        } else if (addEnsaioBtn) {
            handleAddEnsaio(addEnsaioBtn.dataset.loteId);
        }
    });
    
    alertList.addEventListener('click', e => {
        const target = e.target;
        const alertItem = target.closest('.alert-item');
        if (!alertItem) return;
        const span = alertItem.querySelector('span');
        const loteId = span.dataset.loteId;
        const dias = span.dataset.dias;
        const loteInfo = findLote(loteId, true);
        if (!target.classList.contains('mark-as-read')) {
            if (loteInfo) {
                const obraId = `obra-${loteInfo.obra.nome.replace(/\s+/g, '-')}-${loteInfo.empresa.nome.replace(/\s+/g, '-')}`;
                const obraElement = document.getElementById(obraId);
                if (obraElement) {
                    const empresaContainer = obraElement.closest('.empresa-container');
                    [empresaContainer, obraElement].forEach(container => {
                        if (container) {
                            const header = container.querySelector('.collapsible-header');
                            const content = header.nextElementSibling;
                            header.classList.add('active');
                            content.classList.add('active');
                        }
                    });
                    const ensaioElement = document.getElementById(`ensaio-${loteId}-${dias}`);
                    if (ensaioElement) {
                         setTimeout(() => {
                            ensaioElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    }
                }
            }
        }
        if (loteInfo) {
            loteInfo.lote.ensaios[dias].alertaVisto = true;
            salvarDados();
            renderizarTudo();
        }
    });

    // --- FUNÇÕES DE LÓGICA E EVENTOS RESTANTES ---
    const findLote = (loteId, returnFullInfo = false) => { 
        for (const nomeEmpresa in db.empresas) { 
            for (const obra of db.empresas[nomeEmpresa].obras) { 
                const foundLote = obra.lotes.find(l => l.id === loteId); 
                if (foundLote) { 
                    return returnFullInfo ? { lote: foundLote, obra: obra, empresa: { nome: nomeEmpresa } } : foundLote; 
                } 
            } 
        } 
        return null; 
    };
    
    function handleEditLote(loteId) { 
        const lote = findLote(loteId); 
        if(lote) { 
            document.getElementById('edit-lote-id').value = lote.id; 
            document.getElementById('edit-data-entrada').value = lote.dataEntrada; 
            document.getElementById('edit-total-cps').value = lote.totalCPs; 
            document.getElementById('edit-fck').value = lote.fck; 
            editLoteModal.style.display = 'flex'; 
        } 
    }
    
    editLoteForm.addEventListener('submit', e => { 
        e.preventDefault(); 
        const loteId = document.getElementById('edit-lote-id').value; 
        const lote = findLote(loteId); 
        if (lote) { 
            lote.dataEntrada = document.getElementById('edit-data-entrada').value; 
            lote.totalCPs = document.getElementById('edit-total-cps').value; 
            lote.fck = parseFloat(document.getElementById('edit-fck').value); 
            salvarDados(); 
            renderizarTudo(); 
            editLoteModal.style.display = 'none'; 
        } 
    });

    function handleAddResult(data) { 
        const { loteId, dias } = data; 
        const resStr = prompt(`Resultados para o ensaio de ${dias} dias (separados por vírgula):`); 
        if (resStr) { 
            const resultados = resStr.split(',').map(r => parseFloat(r.trim())).filter(r => !isNaN(r)); 
            if (resultados.length > 0) { 
                const lote = findLote(loteId); 
                if (lote) { 
                    lote.ensaios[dias].resultados = resultados; 
                    lote.ensaios[dias].media = resultados.reduce((a, b) => a + b, 0) / resultados.length; 
                    lote.ensaios[dias].alertaVisto = true; 
                    salvarDados(); 
                    renderizarTudo(); 
                } 
            } 
        } 
    }
    
    function handleDelete(data) { 
        const { tipo, empresa, obra, loteId } = data; 
        let msg = `Excluir PERMANENTEMENTE o item (${tipo})? Esta ação não pode ser desfeita.`;
        
        if (confirm(msg)) { 
            if (tipo === 'empresa') { 
                delete db.empresas[empresa]; 
            } else if (tipo === 'obra') { 
                db.empresas[empresa].obras = db.empresas[empresa].obras.filter(o => o.nome !== obra); 
            } else if (tipo === 'lote') { 
                const loteInfo = findLote(loteId, true);
                if (loteInfo) {
                    loteInfo.obra.lotes = loteInfo.obra.lotes.filter(l => l.id !== loteId);
                }
            } 
            salvarDados(); 
            renderizarTudo(); 
        } 
    }

    function handlePdfExport(loteId) { 
        const loteInfo = findLote(loteId, true); 
        if (!loteInfo) return; 
        const { lote, empresa, obra } = loteInfo; 
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF(); 
        doc.setFontSize(18); doc.text('Relatório de Ensaio de Concreto', 14, 22); doc.setFontSize(11); doc.text(`Empresa: ${empresa.nome}`, 14, 32); doc.text(`Obra: ${obra.nome}`, 14, 38); doc.text(`Data de Entrada: ${new Date(lote.dataEntrada).toLocaleString('pt-BR')}`, 14, 44); doc.text(`FCK do Projeto: ${lote.fck} MPa`, 14, 50); const tableColumn = ["Dias", "Resultados (MPa)", "Média (MPa)", "% FCK Atingido"]; const tableRows = []; const diasOrdenados = Object.keys(lote.ensaios).sort((a, b) => parseInt(a) - parseInt(b)); diasOrdenados.forEach(dias => { const ensaio = lote.ensaios[dias]; const porcentagem = ensaio.media ? `${((ensaio.media / lote.fck) * 100).toFixed(1)}%` : '-'; const rowData = [`${dias} dias`, ensaio.resultados.join(', ') || '-', ensaio.media ? ensaio.media.toFixed(2) : '-', porcentagem]; tableRows.push(rowData); }); doc.autoTable(tableColumn, tableRows, { startY: 60 }); doc.save(`Relatorio_Lote_${lote.id.slice(-4)}.pdf`); 
    }
    
    function handleObraReport(data) { 
        const { empresa: nomeEmpresa, obra: nomeObra } = data; 
        const obraRef = db.empresas[nomeEmpresa]?.obras.find(o => o.nome === nomeObra); 
        if (!obraRef || obraRef.lotes.length === 0) { alert('Não há lotes para gerar relatório nesta obra.'); return; } const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.setFontSize(18); doc.text(`Relatório Completo da Obra: ${nomeObra}`, 14, 22); doc.setFontSize(11); doc.text(`Empresa: ${nomeEmpresa}`, 14, 32); let startY = 40; obraRef.lotes.forEach((lote) => { const dataFormatada = new Date(lote.dataEntrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); const headerInfo = `\nLote ID ${lote.id.slice(-4)} | FCK: ${lote.fck} MPa | Entrada: ${dataFormatada}`; doc.text(headerInfo, 14, startY); startY += 10; const tableColumn = ["Dias", "Resultados (MPa)", "Média (MPa)", "% FCK"]; const tableRows = []; const diasOrdenados = Object.keys(lote.ensaios).sort((a,b) => parseInt(a)-parseInt(b)); diasOrdenados.forEach(dias => { const ensaio = lote.ensaios[dias]; const porcentagem = ensaio.media ? `${((ensaio.media/lote.fck)*100).toFixed(1)}%` : '-'; tableRows.push([`${dias}d`, ensaio.resultados.join(', ') || '-', ensaio.media ? ensaio.media.toFixed(2) : '-', porcentagem]); }); doc.autoTable(tableColumn, tableRows, { startY: startY }); startY = doc.autoTable.previous.finalY + 15; }); doc.save(`Relatorio_Obra_${nomeObra}.pdf`); 
    }
    
    function handleDeleteEnsaio(data) { 
        const { loteId, dias } = data; if (confirm(`Excluir o ensaio de ${dias} dias deste lote?`)) { const lote = findLote(loteId); if (lote?.ensaios[dias]) { delete lote.ensaios[dias]; salvarDados(); renderizarTudo(); } } 
    }
    
    function handleAddEnsaio(loteId) { 
        const lote = findLote(loteId); if (!lote) return; const allDays = ['1', '3', '7', '14', '21', '28', '63']; const availableDays = allDays.filter(d => !Object.keys(lote.ensaios).includes(d)); if (availableDays.length === 0) { alert('Todos os ensaios padrão já foram adicionados.'); return; } const dia = prompt(`Adicionar ensaio.\nOpções: ${availableDays.join(', ')}`); if (dia && availableDays.includes(dia.trim())) { lote.ensaios[dia.trim()] = { resultados: [], media: null, alertaVisto: false }; salvarDados(); renderizarTudo(); } else if (dia) { alert('Opção inválida.'); } 
    }
    
    renderizarSeletores = () => { 
        const sel = document.querySelectorAll('#empresa-select-obra, #empresa-select-lote'); sel.forEach(s=>{s.innerHTML=`<option value="">Selecione a Empresa</option>`; Object.keys(db.empresas).sort().forEach(n=>{s.innerHTML+=`<option value="${n}">${n}</option>`})}); const esl=document.getElementById('empresa-select-lote'),osl=document.getElementById('obra-select-lote'); esl.onchange=()=>{osl.innerHTML=`<option value="">Selecione a Obra</option>`;const es=esl.value;if(es&&db.empresas[es]){db.empresas[es].obras.forEach(o=>{osl.innerHTML+=`<option value="${o.nome}">${o.nome}</option>`})}}
    };
    
    renderizarAlertCenter = () => { 
        alertList.innerHTML = ''; const hoje = new Date(); hoje.setHours(0, 0, 0, 0); Object.entries(db.empresas).forEach(([nomeEmpresa, empresa]) => { empresa.obras.forEach(obra => { obra.lotes.forEach(lote => { Object.entries(lote.ensaios).forEach(([dias, ensaio]) => { const dataEnsaio = new Date(new Date(lote.dataEntrada).getTime() + dias * 24 * 60 * 60 * 1000); dataEnsaio.setHours(0, 0, 0, 0); if (dataEnsaio <= hoje && !ensaio.resultados.length && !ensaio.alertaVisto) { const li = document.createElement('li'); li.className = 'alert-item'; li.innerHTML = ` <span data-lote-id="${lote.id}" data-dias="${dias}"><strong>${nomeEmpresa} / ${obra.nome}</strong>: Ensaio de ${dias} dias pendente</span> <button class="mark-as-read" data-lote-id="${lote.id}" data-dias="${dias}">OK</button> `; alertList.appendChild(li); } }); }); }); }); 
    };
    
    addEmpresaForm.addEventListener('submit', e => { 
        e.preventDefault(); const nomeEmpresa = document.getElementById('nova-empresa-nome').value.trim(); if (nomeEmpresa && !db.empresas[nomeEmpresa]) { db.empresas[nomeEmpresa] = { obras: [] }; salvarDados(); renderizarTudo(); addEmpresaForm.reset(); } 
    });
    
    addObraForm.addEventListener('submit', e => { 
        e.preventDefault(); const nomeEmpresa = document.getElementById('empresa-select-obra').value; const nomeObra = document.getElementById('nova-obra-nome').value.trim(); if (nomeEmpresa && nomeObra && !db.empresas[nomeEmpresa].obras.some(o => o.nome === nomeObra)) { db.empresas[nomeEmpresa].obras.push({ nome: nomeObra, lotes: [] }); salvarDados(); renderizarTudo(); addObraForm.reset(); } 
    });
    
    addLoteForm.addEventListener('submit', e => { 
        e.preventDefault(); const nomeEmpresa = document.getElementById('empresa-select-lote').value; const nomeObra = document.getElementById('obra-select-lote').value; const obraRef = db.empresas[nomeEmpresa]?.obras.find(o => o.nome === nomeObra); if (obraRef) { const novoLote = { id: 'lote-' + Date.now(), dataEntrada: document.getElementById('data-entrada').value, totalCPs: document.getElementById('total-cps').value, fck: parseFloat(document.getElementById('fck').value), ensaios: {} }; document.querySelectorAll('.checkbox-group input:checked').forEach(cb => { novoLote.ensaios[cb.value] = { resultados: [], media: null, alertaVisto: false }; }); obraRef.lotes.push(novoLote); salvarDados(); renderizarTudo(); } addLoteForm.reset(); 
    });
    
    // --- FUNÇÕES DA LIXEIRA ---
    function handleMoverParaLixeira(data) {
        const { tipo, empresa, obra, loteId } = data;
        if (!confirm(`Mover ${tipo} para a lixeira?`)) return;

        let item, itemLixeira;
        const dataExclusao = new Date().toISOString();

        switch (tipo) {
            case 'empresa':
                item = db.empresas[empresa];
                itemLixeira = { dataExclusao, tipo, nome: empresa, conteudo: item };
                delete db.empresas[empresa];
                break;
            case 'obra':
                const obraIndex = db.empresas[empresa].obras.findIndex(o => o.nome === obra);
                item = db.empresas[empresa].obras[obraIndex];
                itemLixeira = { dataExclusao, tipo, nome: obra, conteudo: item, path: { nomeEmpresa: empresa } };
                db.empresas[empresa].obras.splice(obraIndex, 1);
                break;
            case 'lote':
                const loteInfo = findLote(loteId, true);
                if (!loteInfo) return;
                const loteIndex = loteInfo.obra.lotes.findIndex(l => l.id === loteId);
                item = loteInfo.obra.lotes[loteIndex];
                itemLixeira = { dataExclusao, tipo, nome: `Lote ID ${loteId.slice(-4)}`, conteudo: item, path: { nomeEmpresa: loteInfo.empresa.nome, nomeObra: loteInfo.obra.nome } };
                loteInfo.obra.lotes.splice(loteIndex, 1);
                break;
        }
        if (!db.lixeira) db.lixeira = []; // Garante que a lixeira exista
        db.lixeira.push(itemLixeira);
        salvarDados();
        renderizarTudo();
    }

    function renderizarLixeira() {
        lixeiraList.innerHTML = '';
        if (!db.lixeira || db.lixeira.length === 0) {
            lixeiraList.innerHTML = '<p>A lixeira está vazia.</p>';
            return;
        }
        const agora = new Date();
        db.lixeira.forEach(item => {
            const dataExclusao = new Date(item.dataExclusao);
            const diasRestantes = Math.ceil(((15 * 24 * 60 * 60 * 1000) - (agora - dataExclusao)) / (1000 * 60 * 60 * 24));
            const itemDiv = document.createElement('div');
            itemDiv.className = 'lixeira-item';
            itemDiv.innerHTML = `
                <div class="lixeira-item-info">
                    <span class="item-nome">${item.nome} (${item.tipo})</span>
                    <span class="item-detalhes">Excluído em: ${dataExclusao.toLocaleDateString('pt-BR')} - Restam ${diasRestantes > 0 ? diasRestantes : 0} dias</span>
                </div>
                <div class="lixeira-item-actions">
                    <button class="restore-btn" data-timestamp="${item.dataExclusao}">Restaurar</button>
                    <button class="perm-delete-btn" data-timestamp="${item.dataExclusao}">Excluir Perm.</button>
                </div>`;
            lixeiraList.appendChild(itemDiv);
        });
    }

    function handleRestaurarItem(timestamp) {
        const itemIndex = db.lixeira.findIndex(i => i.dataExclusao === timestamp);
        if (itemIndex === -1) return;
        const item = db.lixeira[itemIndex];

        switch (item.tipo) {
            case 'empresa':
                db.empresas[item.nome] = item.conteudo;
                break;
            case 'obra':
                if (!db.empresas[item.path.nomeEmpresa]) {
                     db.empresas[item.path.nomeEmpresa] = { obras: [] };
                }
                db.empresas[item.path.nomeEmpresa].obras.push(item.conteudo);
                break;
            case 'lote':
                const empresaRef = db.empresas[item.path.nomeEmpresa];
                if (!empresaRef) {
                    alert("A empresa original deste lote não existe mais. A empresa e a obra serão recriadas.");
                    db.empresas[item.path.nomeEmpresa] = { obras: [{ nome: item.path.nomeObra, lotes: [item.conteudo] }] };
                } else {
                    const obraRef = empresaRef.obras.find(o => o.nome === item.path.nomeObra);
                    if (obraRef) {
                        obraRef.lotes.push(item.conteudo);
                    } else {
                         empresaRef.obras.push({ nome: item.path.nomeObra, lotes: [item.conteudo] });
                    }
                }
                break;
        }
        db.lixeira.splice(itemIndex, 1);
        salvarDados();
        renderizarTudo();
        renderizarLixeira();
    }

    function handleExcluirPermanentementeDaLixeira(timestamp) {
        if (confirm("Este item será excluído para sempre. Continuar?")) {
            db.lixeira = db.lixeira.filter(i => i.dataExclusao !== timestamp);
            salvarDados();
            renderizarLixeira();
        }
    }

    lixeiraList.addEventListener('click', e => {
        const target = e.target;
        const timestamp = target.dataset.timestamp;
        if (target.classList.contains('restore-btn')) handleRestaurarItem(timestamp);
        else if (target.classList.contains('perm-delete-btn')) handleExcluirPermanentementeDaLixeira(timestamp);
    });

    // --- INICIALIZAÇÃO ---
    limparLixeiraAntiga();
    renderizarTudo();
});