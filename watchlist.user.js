// ==UserScript==
// @name         Ticket Watchlist
// @namespace    http://tampermonkey.net/
// @version      1.1.7
// @description  Watchlist tickets and add comments via hotkeys
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('Ticket Watchlist script loaded!');

    const STORAGE_KEY = 'ticket_watchlist';
    const DONE_KEY = 'ticket_watchlist_done';

    function getWatchlist() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function saveWatchlist(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function getDone() {
        return JSON.parse(localStorage.getItem(DONE_KEY) || '[]');
    }

    function saveDone(list) {
        localStorage.setItem(DONE_KEY, JSON.stringify(list));
    }

    function addTicket(ticket) {
        let list = getWatchlist();
        if (!list.some(item => item.ticket === ticket)) {
            list.push({ ticket, comment: '', tags: [] });
            saveWatchlist(list);
        }
    }

    function getTicketNumber() {
        // Try to get ticket number from the currently selected Zendesk ticket tab
        const selectedTab = document.querySelector('[data-entity-type="ticket"][aria-selected="true"][data-entity-id]');
        if (selectedTab) {
            return selectedTab.getAttribute('data-entity-id');
        }
        // Fallback: Find text matching 'Question #12345678'
        const regex = /Question\s+#(\d+)/;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            const match = node.textContent.match(regex);
            if (match) {
                return match[1];
            }
        }
        return '';
    }

    // Simple inline Markdown parser to avoid CSP issues
    function parseMarkdown(text) {
        if (!text) return '';
        
        console.log('Parsing markdown:', text);
        
        // Convert **bold** to <strong>bold</strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *italic* to <em>italic</em>
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert [text](url) to <a href="url">text</a>
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        console.log('Parsed result:', text);
        return text;
    }

    function showModal(highlightTicketId = null, editTicketId = null, initialTab = 'active') {
        // Remove existing modal if present
        let old = document.getElementById('ticket-watchlist-modal');
        if (old) old.remove();

        let currentTab = initialTab;
        let selectedTags = [];

        let modal = document.createElement('div');
        modal.id = 'ticket-watchlist-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '99999';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        let content = document.createElement('div');
        content.style.background = '#fff';
        content.style.padding = '28px 28px 20px 28px';
        content.style.borderRadius = '10px';
        content.style.minWidth = '340px';
        content.style.maxWidth = '900px';
        content.style.width = '800px';
        content.style.height = '520px';
        content.style.overflow = 'hidden';
        content.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
        content.style.position = 'relative';
        content.style.cursor = 'default';

        // Move header above tabs
        let title = document.createElement('h2');
        title.textContent = 'Ticket Watchlist';
        title.style.margin = '0 0 8px 0';
        title.style.fontSize = '1.3em';
        title.style.cursor = 'move';
        content.appendChild(title);

        // Tabs (now below header)
        let tabBar = document.createElement('div');
        tabBar.style.display = 'flex';
        tabBar.style.gap = '12px';
        tabBar.style.marginBottom = '10px';
        tabBar.style.alignItems = 'center';
        let activeTab = document.createElement('button');
        activeTab.textContent = 'Active';
        activeTab.style.background = currentTab === 'active' ? '#e6f7ff' : '#f7f7f7';
        activeTab.style.color = '#0077b6';
        activeTab.style.border = '1px solid #b3e0ff';
        activeTab.style.borderRadius = '5px 5px 0 0';
        activeTab.style.padding = '4px 18px';
        activeTab.style.cursor = 'pointer';
        activeTab.style.fontWeight = currentTab === 'active' ? 'bold' : 'normal';
        activeTab.onclick = () => {
            currentTab = 'active';
            renderTable();
            activeTab.style.background = '#e6f7ff';
            activeTab.style.fontWeight = 'bold';
            doneTab.style.background = '#f7f7f7';
            doneTab.style.fontWeight = 'normal';
            tagsTab.style.background = '#f7f7f7';
            tagsTab.style.fontWeight = 'normal';
        };
        let doneTab = document.createElement('button');
        doneTab.textContent = 'Done';
        doneTab.style.background = currentTab === 'done' ? '#e6f7ff' : '#f7f7f7';
        doneTab.style.color = '#0077b6';
        doneTab.style.border = '1px solid #b3e0ff';
        doneTab.style.borderRadius = '5px 5px 0 0';
        doneTab.style.padding = '4px 18px';
        doneTab.style.cursor = 'pointer';
        doneTab.style.fontWeight = currentTab === 'done' ? 'bold' : 'normal';
        doneTab.onclick = () => {
            currentTab = 'done';
            renderTable();
            doneTab.style.background = '#e6f7ff';
            doneTab.style.fontWeight = 'bold';
            activeTab.style.background = '#f7f7f7';
            activeTab.style.fontWeight = 'normal';
            tagsTab.style.background = '#f7f7f7';
            tagsTab.style.fontWeight = 'normal';
        };
        let tagsTab = document.createElement('button');
        tagsTab.textContent = 'Tags';
        tagsTab.style.background = currentTab === 'tags' ? '#e6f7ff' : '#f7f7f7';
        tagsTab.style.color = '#0077b6';
        tagsTab.style.border = '1px solid #b3e0ff';
        tagsTab.style.borderRadius = '5px 5px 0 0';
        tagsTab.style.padding = '4px 18px';
        tagsTab.style.cursor = 'pointer';
        tagsTab.style.fontWeight = currentTab === 'tags' ? 'bold' : 'normal';
        tagsTab.onclick = () => {
            currentTab = 'tags';
            renderTable();
            tagsTab.style.background = '#e6f7ff';
            tagsTab.style.fontWeight = 'bold';
            activeTab.style.background = '#f7f7f7';
            activeTab.style.fontWeight = 'normal';
            doneTab.style.background = '#f7f7f7';
            doneTab.style.fontWeight = 'normal';
        };
        tabBar.appendChild(activeTab);
        tabBar.appendChild(doneTab);
        tabBar.appendChild(tagsTab);
        content.appendChild(tabBar);

        // Scrollable table container
        let scrollContainer = document.createElement('div');
        scrollContainer.style.flex = '1 1 auto';
        scrollContainer.style.overflowY = 'auto';
        scrollContainer.style.marginBottom = '10px';
        scrollContainer.style.height = 'calc(100% - 110px)'; // header+tabs+padding
        content.appendChild(scrollContainer);

        function renderTable() {
            scrollContainer.innerHTML = '';
            let data;
            if (currentTab === 'active') data = getWatchlist();
            else if (currentTab === 'done') data = getDone();
            else {
                // Tags tab: show AND/OR toggle, tag cloud, and filtered tickets
                let allTickets = getWatchlist().concat(getDone());
                let allTags = Array.from(new Set(allTickets.flatMap(t => (t.tags || [])))).filter(Boolean).sort();
                // AND/OR toggle
                let matchMode = window._watchlistTagMatchMode || 'or';
                let toggleWrap = document.createElement('div');
                toggleWrap.style.display = 'flex';
                toggleWrap.style.alignItems = 'center';
                toggleWrap.style.gap = '10px';
                toggleWrap.style.marginBottom = '8px';
                let toggleLabel = document.createElement('span');
                toggleLabel.textContent = 'Match:';
                toggleLabel.style.fontWeight = 'bold';
                let orBtn = document.createElement('button');
                orBtn.textContent = 'Any (OR)';
                orBtn.style.background = matchMode === 'or' ? '#e6f7ff' : '#f7f7f7';
                orBtn.style.color = '#0077b6';
                orBtn.style.border = '1px solid #b3e0ff';
                orBtn.style.borderRadius = '5px';
                orBtn.style.padding = '2px 10px';
                orBtn.style.cursor = 'pointer';
                orBtn.onclick = () => { window._watchlistTagMatchMode = 'or'; renderTable(); };
                let andBtn = document.createElement('button');
                andBtn.textContent = 'All (AND)';
                andBtn.style.background = matchMode === 'and' ? '#e6f7ff' : '#f7f7f7';
                andBtn.style.color = '#0077b6';
                andBtn.style.border = '1px solid #b3e0ff';
                andBtn.style.borderRadius = '5px';
                andBtn.style.padding = '2px 10px';
                andBtn.style.cursor = 'pointer';
                andBtn.onclick = () => { window._watchlistTagMatchMode = 'and'; renderTable(); };
                toggleWrap.appendChild(toggleLabel);
                toggleWrap.appendChild(orBtn);
                toggleWrap.appendChild(andBtn);
                scrollContainer.appendChild(toggleWrap);
                // Tag cloud
                let tagCloud = document.createElement('div');
                tagCloud.style.display = 'flex';
                tagCloud.style.flexWrap = 'wrap';
                tagCloud.style.gap = '8px';
                tagCloud.style.marginBottom = '16px';
                allTags.forEach(tag => {
                    let tagBtn = document.createElement('button');
                    tagBtn.textContent = tag;
                    tagBtn.style.border = 'none';
                    tagBtn.style.outline = 'none';
                    tagBtn.style.background = selectedTags.includes(tag) ? '#14b8a6' : '#f7f7f7';
                    tagBtn.style.color = selectedTags.includes(tag) ? '#fff' : '#0077b6';
                    tagBtn.style.borderRadius = '16px';
                    tagBtn.style.padding = '4px 14px';
                    tagBtn.style.fontWeight = 'bold';
                    tagBtn.style.cursor = 'pointer';
                    tagBtn.onclick = () => {
                        if (selectedTags.includes(tag)) {
                            selectedTags = selectedTags.filter(t => t !== tag);
                        } else {
                            selectedTags.push(tag);
                        }
                        renderTable();
                    };
                    tagCloud.appendChild(tagBtn);
                });
                scrollContainer.appendChild(tagCloud);
                // Filter tickets by selected tags
                let filtered = [];
                if (selectedTags.length > 0) {
                    if (matchMode === 'or') {
                        filtered = allTickets.filter(t => (t.tags || []).some(tag => selectedTags.includes(tag)));
                    } else {
                        filtered = allTickets.filter(t => selectedTags.every(tag => (t.tags || []).includes(tag)));
                    }
                }
                data = filtered;
                if (selectedTags.length === 0) {
                    let msg = document.createElement('div');
                    msg.textContent = 'Select one or more tags to see matching tickets.';
                    msg.style.marginBottom = '10px';
                    scrollContainer.appendChild(msg);
                }
            }
            if (!data || data.length === 0) {
                let emptyMsg = document.createElement('div');
                if (currentTab === 'active') emptyMsg.textContent = 'No tickets in watchlist.';
                else if (currentTab === 'done') emptyMsg.textContent = 'No done tickets.';
                else emptyMsg.textContent = 'No tickets match the selected tags.';
                emptyMsg.style.marginBottom = '10px';
                scrollContainer.appendChild(emptyMsg);
                return;
            }
            let table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginBottom = '12px';

            let thead = document.createElement('thead');
            let headerRow = document.createElement('tr');
            ['Ticket', 'Comment', 'Tags', ''].forEach(text => {
                let th = document.createElement('th');
                th.textContent = text;
                th.style.textAlign = 'left';
                th.style.fontWeight = 'bold';
                th.style.fontSize = '0.95em';
                th.style.padding = '0 0 4px 0';
                th.style.background = 'none';
                th.style.border = 'none';
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            let tbody = document.createElement('tbody');
            data.forEach((item, idx) => {
                let row = document.createElement('tr');
                row.style.verticalAlign = 'top';
                if (highlightTicketId && item.ticket === highlightTicketId && currentTab === 'active') {
                    row.style.background = '#fffbe6';
                    row.style.transition = 'background 0.8s';
                }

                // Double-click to edit (only for Active and Tags tabs)
                if (currentTab === 'active' || currentTab === 'tags') {
                    row.ondblclick = function(e) {
                        // Only allow edit for Active tickets in Active tab, or any ticket in Tags tab if it's in Active
                        let ticketToEdit = item.ticket;
                        if (currentTab === 'active') {
                            editTicketId = ticketToEdit;
                            renderTable();
                        } else if (currentTab === 'tags') {
                            // Only allow editing if ticket is in Active list
                            let activeTickets = getWatchlist();
                            if (activeTickets.some(t => t.ticket === ticketToEdit)) {
                                editTicketId = ticketToEdit;
                                renderTable();
                            }
                        }
                    };
                }

                // Ticket cell
                let ticketCell = document.createElement('td');
                let ticketLink = document.createElement('a');
                ticketLink.href = `https://nirvana.shopifyapps.com/tickets/${encodeURIComponent(item.ticket)}`;
                ticketLink.textContent = item.ticket;
                ticketLink.target = '_blank';
                ticketLink.rel = 'noopener noreferrer';
                ticketLink.style.textDecoration = 'none';
                ticketLink.style.color = '#0077b6';
                ticketLink.style.fontWeight = 'bold';
                ticketLink.style.cursor = 'pointer';
                ticketLink.style.fontFamily = 'SFMono-Regular, Menlo, Monaco, Consolas, monospace';
                ticketLink.onmouseover = () => ticketLink.style.textDecoration = 'underline';
                ticketLink.onmouseout = () => ticketLink.style.textDecoration = 'none';

                // Remove N button, only show Z before ticket number
                let linkWrap = document.createElement('span');
                linkWrap.style.display = 'inline-flex';
                linkWrap.style.gap = '2px';
                linkWrap.style.marginRight = '6px';
                // Zendesk Z
                let zBtn = document.createElement('a');
                zBtn.href = `https://shopify.zendesk.com/agent/tickets/${encodeURIComponent(item.ticket)}`;
                zBtn.target = '_blank';
                zBtn.rel = 'noopener noreferrer';
                zBtn.title = 'Open in Zendesk';
                zBtn.style.display = 'inline-flex';
                zBtn.style.alignItems = 'center';
                zBtn.style.justifyContent = 'center';
                zBtn.style.width = '18px';
                zBtn.style.height = '18px';
                zBtn.style.fontWeight = 'bold';
                zBtn.style.fontSize = '13px';
                zBtn.style.background = '#f7f7f7';
                zBtn.style.color = '#0e7a5d';
                zBtn.style.borderRadius = '50%';
                zBtn.style.textAlign = 'center';
                zBtn.style.textDecoration = 'none';
                zBtn.textContent = 'Z';
                linkWrap.appendChild(zBtn);
                ticketCell.appendChild(linkWrap);
                ticketCell.appendChild(ticketLink);

                ticketCell.style.padding = '6px 8px 6px 0';
                ticketCell.style.whiteSpace = 'nowrap';
                ticketCell.style.border = 'none';
                row.appendChild(ticketCell);

                // Comment cell
                let commentCell = document.createElement('td');
                commentCell.style.padding = '4px 8px 4px 0';
                commentCell.style.border = 'none';

                // Tags cell
                let tagsCell = document.createElement('td');
                tagsCell.style.padding = '4px 8px 4px 0';
                tagsCell.style.border = 'none';
                function renderTagsView() {
                    tagsCell.innerHTML = '';
                    let tags = Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
                    if (tags.length === 0) {
                        let empty = document.createElement('span');
                        empty.textContent = '-';
                        tagsCell.appendChild(empty);
                    } else {
                        tags.forEach(tag => {
                            let pill = document.createElement('span');
                            pill.textContent = tag;
                            pill.style.display = 'inline-block';
                            pill.style.background = '#f7f7f7';
                            pill.style.color = '#0077b6';
                            pill.style.borderRadius = '12px';
                            pill.style.padding = '2px 10px';
                            pill.style.fontSize = '0.95em';
                            pill.style.marginRight = '4px';
                            pill.style.marginBottom = '2px';
                            tagsCell.appendChild(pill);
                        });
                    }
                }
                function renderEditor(focusNow = false) {
                    commentCell.innerHTML = '';
                    let textarea = document.createElement('textarea');
                    textarea.value = item.comment || '';
                    textarea.rows = 2;
                    textarea.style.width = '98%';
                    textarea.style.minWidth = '120px';
                    textarea.style.borderRadius = '4px';
                    textarea.style.border = '1px solid #eee';
                    textarea.style.padding = '4px';
                    textarea.style.fontSize = '1em';
                    textarea.style.lineHeight = '1.5';
                    textarea.style.marginBottom = '4px';
                    textarea.style.resize = 'none';
                    textarea.style.height = '2.2em'; // Match minHeight of view mode
                    textarea.style.boxSizing = 'border-box';
                    textarea.addEventListener('paste', function(e) {
                        const clipboardData = e.clipboardData || window.clipboardData;
                        const pasted = clipboardData.getData('text');
                        const urlRegex = /^(https?:\/\/[^\s]+)$/i;
                        if (urlRegex.test(pasted)) {
                            const selStart = textarea.selectionStart;
                            const selEnd = textarea.selectionEnd;
                            if (selStart !== selEnd) {
                                const selectedText = textarea.value.substring(selStart, selEnd);
                                const before = textarea.value.substring(0, selStart);
                                const after = textarea.value.substring(selEnd);
                                textarea.value = before + `[${selectedText}](${pasted})` + after;
                                const newPos = before.length + `[${selectedText}](${pasted})`.length;
                                textarea.selectionStart = textarea.selectionEnd = newPos;
                                e.preventDefault();
                            }
                        }
                    });
                    commentCell.appendChild(textarea);
                    textareaRef = textarea;
                    if (focusNow) setTimeout(() => textarea.focus(), 0);

                    // Remove Save/Cancel buttons, use Enter/Escape instead
                    textarea.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            commitEdit();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEdit();
                        }
                    });
                    renderTagsEditor(true);

                    // Commit edit if clicking outside the row
                    setTimeout(() => {
                        function handleClickOutside(event) {
                            if (!row.contains(event.target)) {
                                commitEdit();
                                document.removeEventListener('mousedown', handleClickOutside, true);
                            }
                        }
                        document.addEventListener('mousedown', handleClickOutside, true);
                    }, 0);

                    function commitEdit() {
                        let freshList = currentTab === 'active' ? getWatchlist() : getDone();
                        let ticketIdx = freshList.findIndex(t => t.ticket === item.ticket);
                        if (ticketIdx !== -1) {
                            freshList[ticketIdx].comment = textarea.value;
                            // Save tags
                            let tagsInput = tagsCell.querySelector('input');
                            let tagsArr = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(Boolean) : [];
                            freshList[ticketIdx].tags = tagsArr;
                            if (currentTab === 'active') saveWatchlist(freshList);
                            else saveDone(freshList);
                        }
                        isEditing = false;
                        editTicketId = null;
                        renderTable();
                    }
                    function cancelEdit() {
                        isEditing = false;
                        editTicketId = null;
                        renderTable();
                    }
                }
                function renderTagsEditor(focusNow = false) {
                    tagsCell.innerHTML = '';
                    let input = document.createElement('input');
                    input.type = 'text';
                    input.value = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
                    input.placeholder = 'tag1, tag2, ...';
                    input.style.width = '98%';
                    input.style.borderRadius = '4px';
                    input.style.border = '1px solid #eee';
                    input.style.padding = '4px';
                    input.style.fontSize = '1em';
                    input.style.marginBottom = '2px';
                    tagsCell.appendChild(input);
                    input.addEventListener('input', function() {
                        item.tags = input.value.split(',').map(t => t.trim()).filter(Boolean);
                    });
                    input.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitEdit();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEdit();
                        }
                    });
                    if (focusNow) setTimeout(() => input.focus(), 0);

                    // Commit edit if clicking outside the row
                    setTimeout(() => {
                        function handleClickOutside(event) {
                            if (!row.contains(event.target)) {
                                commitEdit();
                                document.removeEventListener('mousedown', handleClickOutside, true);
                            }
                        }
                        document.addEventListener('mousedown', handleClickOutside, true);
                    }, 0);

                    function commitEdit() {
                        let freshList = currentTab === 'active' ? getWatchlist() : getDone();
                        let ticketIdx = freshList.findIndex(t => t.ticket === item.ticket);
                        if (ticketIdx !== -1) {
                            let tagsArr = input.value.split(',').map(t => t.trim()).filter(Boolean);
                            freshList[ticketIdx].tags = tagsArr;
                            // Save comment
                            let textarea = commentCell.querySelector('textarea');
                            if (textarea) {
                                freshList[ticketIdx].comment = textarea.value;
                            }
                            if (currentTab === 'active') saveWatchlist(freshList);
                            else saveDone(freshList);
                        }
                        isEditing = false;
                        editTicketId = null;
                        renderTable();
                    }
                    function cancelEdit() {
                        isEditing = false;
                        editTicketId = null;
                        renderTable();
                    }
                }

                // Action buttons cell (done, edit, delete)
                let actionCell = document.createElement('td');
                actionCell.style.padding = '4px 0 4px 0';
                actionCell.style.border = 'none';
                actionCell.style.whiteSpace = 'nowrap';
                actionCell.style.display = 'flex';
                actionCell.style.flexDirection = 'row';
                actionCell.style.alignItems = 'center';
                actionCell.style.gap = '4px';

                // Markdown rendering/editing logic
                let isEditing = false;
                let textareaRef = null;
                function renderComment() {
                    commentCell.innerHTML = '';
                    let commentDiv = document.createElement('div');
                    commentDiv.style.minHeight = '2.2em';
                    commentDiv.style.fontSize = '1em';
                    commentDiv.style.lineHeight = '1.5';
                    commentDiv.style.wordBreak = 'break-word';
                    
                    const parsedHtml = parseMarkdown(item.comment || '');
                    console.log('Setting innerHTML to:', parsedHtml);
                    commentDiv.innerHTML = parsedHtml;
                    
                    // Ensure all links open in a new tab
                    Array.from(commentDiv.querySelectorAll('a')).forEach(a => {
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                    });
                    
                    commentCell.appendChild(commentDiv);
                    renderTagsView();
                    renderActionButtons();
                }
                function renderActionButtons() {
                    actionCell.innerHTML = '';
                    const buttons = [];
                    // Check button (move to Done) only in active tab
                    if (currentTab === 'active') {
                        let checkBtn = document.createElement('button');
                        checkBtn.title = 'Mark as done';
                        checkBtn.style.background = 'none';
                        checkBtn.style.border = 'none';
                        checkBtn.style.outline = 'none';
                        checkBtn.style.cursor = 'pointer';
                        checkBtn.style.padding = '2px';
                        checkBtn.style.margin = '0 4px 0 0';
                        checkBtn.style.width = '20px';
                        checkBtn.style.height = '20px';
                        checkBtn.style.display = 'inline-flex';
                        checkBtn.style.alignItems = 'center';
                        checkBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="18" height="18"><path fill-rule="evenodd" d="M15.78 5.97a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06l2.72 2.72 5.97-5.97a.75.75 0 0 1 1.06 0Z" fill="#14b8a6"/></svg>`;
                        checkBtn.onclick = function() {
                            let activeList = getWatchlist();
                            let doneList = getDone();
                            let [removed] = activeList.splice(idx, 1);
                            if (removed) {
                                doneList.push(removed);
                                saveWatchlist(activeList);
                                saveDone(doneList);
                            }
                            modal.remove();
                            showModal(null, null, 'active');
                        };
                        buttons.push(checkBtn);
                    }
                    // Cross button (restore to Active) only in done tab
                    if (currentTab === 'done') {
                        let crossBtn = document.createElement('button');
                        crossBtn.title = 'Move back to active';
                        crossBtn.style.background = 'none';
                        crossBtn.style.border = 'none';
                        crossBtn.style.outline = 'none';
                        crossBtn.style.cursor = 'pointer';
                        crossBtn.style.padding = '2px';
                        crossBtn.style.margin = '0 4px 0 0';
                        crossBtn.style.width = '20px';
                        crossBtn.style.height = '20px';
                        crossBtn.style.display = 'inline-flex';
                        crossBtn.style.alignItems = 'center';
                        crossBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="18" height="18"><path d="M13.97 15.03a.75.75 0 1 0 1.06-1.06l-3.97-3.97 3.97-3.97a.75.75 0 0 0-1.06-1.06l-3.97 3.97-3.97-3.97a.75.75 0 0 0-1.06 1.06l3.97 3.97-3.97 3.97a.75.75 0 1 0 1.06 1.06l3.97-3.97 3.97 3.97Z" fill="#f59e42"/></svg>`;
                        crossBtn.onclick = function() {
                            let doneList = getDone();
                            let activeList = getWatchlist();
                            let [restored] = doneList.splice(idx, 1);
                            if (restored) {
                                activeList.push(restored);
                                saveDone(doneList);
                                saveWatchlist(activeList);
                            }
                            modal.remove();
                            showModal(null, null, 'done');
                        };
                        buttons.push(crossBtn);
                    }
                    // Edit button (Polaris SVG, gray)
                    if (currentTab === 'active') {
                        let editBtn = document.createElement('button');
                        editBtn.title = 'Edit comment';
                        editBtn.style.background = 'none';
                        editBtn.style.border = 'none';
                        editBtn.style.outline = 'none';
                        editBtn.style.cursor = 'pointer';
                        editBtn.style.padding = '2px';
                        editBtn.style.margin = '0 4px 0 0';
                        editBtn.style.width = '20px';
                        editBtn.style.height = '20px';
                        editBtn.style.display = 'inline-flex';
                        editBtn.style.alignItems = 'center';
                        editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="18" height="18"><path fill-rule="evenodd" d="M15.655 4.344a2.695 2.695 0 0 0-3.81 0l-.599.599-.009-.009-1.06 1.06.008.01-5.88 5.88a2.75 2.75 0 0 0-.805 1.944v1.922a.75.75 0 0 0 .75.75h1.922a2.75 2.75 0 0 0 1.944-.806l7.54-7.539a2.695 2.695 0 0 0 0-3.81Zm-4.409 2.72-5.88 5.88a1.25 1.25 0 0 0-.366.884v1.172h1.172c.331 0 .65-.132.883-.366l5.88-5.88-1.689-1.69Zm2.75.629.599-.599a1.195 1.195 0 1 0-1.69-1.689l-.598.599 1.69 1.689Z" fill="#888"/></svg>`;
                        editBtn.onclick = function() {
                            isEditing = true;
                            renderEditor(true);
                            renderActionButtons();
                        };
                        buttons.push(editBtn);
                    }
                    // Delete button (trash, red) - OMIT if currentTab === 'tags'
                    if (currentTab !== 'tags') {
                        let delBtn = document.createElement('button');
                        delBtn.title = 'Delete ticket';
                        delBtn.style.background = 'none';
                        delBtn.style.border = 'none';
                        delBtn.style.outline = 'none';
                        delBtn.style.cursor = 'pointer';
                        delBtn.style.padding = '2px';
                        delBtn.style.margin = '0 4px 0 0';
                        delBtn.style.width = '20px';
                        delBtn.style.height = '20px';
                        delBtn.style.display = 'inline-flex';
                        delBtn.style.alignItems = 'center';
                        delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="18" height="18"><path d="M11.5 8.25a.75.75 0 0 1 .75.75v4.25a.75.75 0 0 1-1.5 0v-4.25a.75.75 0 0 1 .75-.75Z" fill="#e11d48"/><path d="M9.25 9a.75.75 0 0 0-1.5 0v4.25a.75.75 0 0 0 1.5 0v-4.25Z" fill="#e11d48"/><path fill-rule="evenodd" d="M7.25 5.25a2.75 2.75 0 0 1 5.5 0h3a.75.75 0 0 1 0 1.5h-.75v5.45c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311c-.642.327-1.482.327-3.162.327h-.4c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311c-.327-.642-.327-1.482-.327-3.162v-5.45h-.75a.75.75 0 0 1 0-1.5h3Zm1.5 0a1.25 1.25 0 1 1 2.5 0h-2.5Zm-2.25 1.5h7v5.45c0 .865-.001 1.423-.036 1.848-.033.408-.09.559-.128.633a1.5 1.5 0 0 1-.655.655c-.074.038-.225.095-.633.128-.425.035-.983.036-1.848.036h-.4c-.865 0-1.423-.001-1.848-.036-.408-.033-.559-.09-.633-.128a1.5 1.5 0 0 1-.656-.655c-.037-.074-.094-.225-.127-.633-.035-.425-.036-.983-.036-1.848v-5.45Z" fill="#e11d48"/></svg>`;
                        delBtn.onclick = function() {
                            if (currentTab === 'active') {
                                let activeList = getWatchlist();
                                activeList.splice(idx, 1);
                                saveWatchlist(activeList);
                                modal.remove();
                                showModal(null, null, 'active');
                            } else {
                                let doneList = getDone();
                                doneList.splice(idx, 1);
                                saveDone(doneList);
                                modal.remove();
                                showModal(null, null, 'done');
                            }
                        };
                        buttons.push(delBtn);
                    }
                    // Append all buttons
                    buttons.forEach((btn, i) => {
                        if (i === buttons.length - 1) btn.style.marginRight = '0';
                        actionCell.appendChild(btn);
                    });
                }
                // Initial render and append
                if (editTicketId && item.ticket === editTicketId && currentTab === 'active') {
                    isEditing = true;
                    renderEditor(true);
                } else {
                    renderComment();
                }
                row.appendChild(commentCell);
                row.appendChild(tagsCell);
                row.appendChild(actionCell);
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            scrollContainer.appendChild(table);
        }
        renderTable();

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Close modal on Escape
        function escListener(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escListener);
            }
        }
        setTimeout(() => document.addEventListener('keydown', escListener), 0);

        // Close modal when clicking outside the content area
        modal.addEventListener('mousedown', function(e) {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', escListener);
            }
        });
    }

    function getSelectedText() {
        let text = window.getSelection().toString();
        if (!text && document.activeElement && document.activeElement.value) {
            let el = document.activeElement;
            if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
                text = el.value.substring(el.selectionStart, el.selectionEnd);
            }
        }
        return text.trim();
    }

    document.addEventListener('keydown', function(e) {
        console.log('keydown event:', {
            altKey: e.altKey,
            shiftKey: e.shiftKey,
            key: e.key,
            code: e.code,
            keyCode: e.keyCode,
            which: e.which,
            metaKey: e.metaKey,
            ctrlKey: e.ctrlKey
        });

        // Option+W (add ticket) - open modal and highlight new ticket, no alert
        if (
            e.altKey && !e.shiftKey &&
            (
                e.key.toLowerCase() === 'w' ||
                e.key === '∑' ||
                e.key === 'å' ||
                (e.key === 'Dead' && e.code === 'KeyW') ||
                (e.key === '' && e.code === 'KeyW')
            )
        ) {
            e.preventDefault();
            const ticket = getTicketNumber() || getSelectedText();
            if (ticket) {
                addTicket(ticket);
                showModal(ticket, ticket); // highlight and edit the new ticket
            } else {
                showModal(); // just open modal if nothing selected
            }
            return;
        }
        // Option+Shift+W (show modal) - open modal as usual
        if (e.altKey && e.shiftKey && e.code === 'KeyW') {
            e.preventDefault();
            showModal();
            return;
        }
    });
    
    console.log('Ticket Watchlist initialized successfully!');
})();
