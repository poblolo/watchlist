// ==UserScript==
// @name         Ticket Watchlist
// @namespace    http://tampermonkey.net/
// @version      1.1.2
// @description  Watchlist tickets and add comments via hotkeys
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'ticket_watchlist';

    function getWatchlist() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function saveWatchlist(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function addTicket(ticket) {
        let list = getWatchlist();
        if (!list.some(item => item.ticket === ticket)) {
            list.push({ ticket, comment: '' });
            saveWatchlist(list);
        }
    }

    // Dynamically load marked.js for Markdown rendering
    function loadMarked(callback) {
        if (window.marked) return callback();
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    function showModal(highlightTicketId = null, editTicketId = null) {
        loadMarked(() => {
        // Remove existing modal if present
        let old = document.getElementById('ticket-watchlist-modal');
        if (old) old.remove();

        let list = getWatchlist();

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
        content.style.maxWidth = '95vw';
        content.style.maxHeight = '80vh';
        content.style.overflow = 'hidden';
        content.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
        content.style.position = 'relative';
        content.style.cursor = 'default';

        // Draggable modal logic
        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
        content.onmousedown = function(e) {
            if (e.target !== title) return;
            isDragging = true;
            dragOffsetX = e.clientX - content.getBoundingClientRect().left;
            dragOffsetY = e.clientY - content.getBoundingClientRect().top;
            document.body.style.userSelect = 'none';
        };
        document.onmousemove = function(e) {
            if (isDragging) {
                content.style.position = 'fixed';
                content.style.left = (e.clientX - dragOffsetX) + 'px';
                content.style.top = (e.clientY - dragOffsetY) + 'px';
                content.style.margin = '0';
            }
        };
        document.onmouseup = function() {
            isDragging = false;
            document.body.style.userSelect = '';
        };

        let title = document.createElement('h2');
        title.textContent = 'Ticket Watchlist';
        title.style.margin = '0 0 8px 0';
        title.style.fontSize = '1.3em';
        title.style.cursor = 'move';
        content.appendChild(title);

        let instructions = document.createElement('div');
        instructions.style.fontSize = '0.95em';
        instructions.style.marginBottom = '12px';
        instructions.style.color = '#555';
        instructions.textContent = 'Tip: Select a ticket number and press Option+W to add. Press Option+Shift+W to open this watchlist.';
        content.appendChild(instructions);

        // Copy to clipboard button
        let copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Watchlist';
        copyBtn.style.marginBottom = '16px';
        copyBtn.style.marginRight = '10px';
        copyBtn.style.padding = '4px 12px';
        copyBtn.style.border = '1px solid #bbb';
        copyBtn.style.borderRadius = '5px';
        copyBtn.style.background = '#f7f7f7';
        copyBtn.style.cursor = 'pointer';
        copyBtn.onclick = function() {
            let list = getWatchlist();
            let text = list.map(item => `Ticket: ${item.ticket}\nComment: ${item.comment || ''}`).join('\n---\n');
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy Watchlist', 1200);
            });
        };
        content.appendChild(copyBtn);

        // Scrollable table container
        let scrollContainer = document.createElement('div');
        scrollContainer.style.maxHeight = '44vh';
        scrollContainer.style.overflowY = 'auto';
        scrollContainer.style.marginBottom = '10px';

        // Table for tickets
        if (list.length === 0) {
            let emptyMsg = document.createElement('div');
            emptyMsg.textContent = 'No tickets in watchlist.';
            emptyMsg.style.marginBottom = '10px';
            scrollContainer.appendChild(emptyMsg);
        } else {
            let table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginBottom = '12px';

            let thead = document.createElement('thead');
            let headerRow = document.createElement('tr');
            ['Ticket', 'Comment', ''].forEach(text => {
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
            list.forEach((item, idx) => {
                let row = document.createElement('tr');
                row.style.verticalAlign = 'top';
                if (highlightTicketId && item.ticket === highlightTicketId) {
                    row.style.background = '#fffbe6';
                    row.style.transition = 'background 0.8s';
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
                ticketCell.appendChild(ticketLink);
                ticketCell.style.padding = '6px 8px 6px 0';
                ticketCell.style.whiteSpace = 'nowrap';
                ticketCell.style.border = 'none';
                row.appendChild(ticketCell);

                // Comment cell
                let commentCell = document.createElement('td');
                commentCell.style.padding = '4px 8px 4px 0';
                commentCell.style.border = 'none';

                // Action buttons cell (edit and delete)
                let actionCell = document.createElement('td');
                actionCell.style.padding = '4px 0 4px 0';
                actionCell.style.border = 'none';

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
                    commentDiv.innerHTML = window.marked ? window.marked.parse(item.comment || '') : (item.comment || '');
                    commentCell.appendChild(commentDiv);
                    renderActionButtons();
                }
                function renderEditor(focusNow = false) {
                    commentCell.innerHTML = '';
                    let textarea = document.createElement('textarea');
                    textarea.value = item.comment || '';
                    textarea.rows = 3;
                    textarea.style.width = '98%';
                    textarea.style.minWidth = '120px';
                    textarea.style.borderRadius = '4px';
                    textarea.style.border = '1px solid #eee';
                    textarea.style.padding = '4px';
                    textarea.style.fontSize = '1em';
                    textarea.style.marginBottom = '4px';
                    // Paste event for markdown link
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
                    let saveBtn = document.createElement('button');
                    saveBtn.textContent = 'Save';
                    saveBtn.style.marginRight = '6px';
                    saveBtn.style.background = '#e6f7ff';
                    saveBtn.style.color = '#0077b6';
                    saveBtn.style.border = '1px solid #b3e0ff';
                    saveBtn.style.borderRadius = '4px';
                    saveBtn.style.cursor = 'pointer';
                    saveBtn.style.fontSize = '0.95em';
                    saveBtn.style.padding = '2px 10px';
                    saveBtn.onclick = function() {
                        let list = getWatchlist();
                        list[idx].comment = textarea.value;
                        item.comment = textarea.value;
                        saveWatchlist(list);
                        isEditing = false;
                        renderComment();
                    };
                    commentCell.appendChild(saveBtn);
                    let cancelBtn = document.createElement('button');
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.style.background = '#f7f7f7';
                    cancelBtn.style.color = '#333';
                    cancelBtn.style.border = '1px solid #bbb';
                    cancelBtn.style.borderRadius = '4px';
                    cancelBtn.style.cursor = 'pointer';
                    cancelBtn.style.fontSize = '0.95em';
                    cancelBtn.style.padding = '2px 10px';
                    cancelBtn.onclick = function() {
                        isEditing = false;
                        renderComment();
                    };
                    commentCell.appendChild(cancelBtn);
                }
                function renderActionButtons() {
                    actionCell.innerHTML = '';
                    // Edit button (Polaris EditIcon SVG)
                    let editBtn = document.createElement('button');
                    editBtn.title = 'Edit comment';
                    editBtn.style.background = '#f7f7f7';
                    editBtn.style.color = '#333';
                    editBtn.style.border = '1px solid #bbb';
                    editBtn.style.borderRadius = '4px';
                    editBtn.style.cursor = 'pointer';
                    editBtn.style.fontSize = '1.1em';
                    editBtn.style.padding = '2px 8px';
                    editBtn.style.marginRight = '8px';
                    editBtn.style.display = 'inline-flex';
                    editBtn.style.alignItems = 'center';
                    editBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M14.7 3.3a1 1 0 0 1 1.4 0l0.6 0.6a1 1 0 0 1 0 1.4l-9.2 9.2-2.1 0.7 0.7-2.1 9.2-9.2z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M13.3 5.1l1.6 1.6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;
                    editBtn.onclick = function() {
                        isEditing = true;
                        renderEditor(true);
                        renderActionButtons();
                    };
                    actionCell.appendChild(editBtn);
                    // Delete button (Polaris DeleteIcon SVG)
                    let delBtn = document.createElement('button');
                    delBtn.title = 'Delete ticket';
                    delBtn.style.background = '#ffeded';
                    delBtn.style.color = '#c00';
                    delBtn.style.border = '1px solid #fbb';
                    delBtn.style.borderRadius = '4px';
                    delBtn.style.cursor = 'pointer';
                    delBtn.style.fontSize = '1.1em';
                    delBtn.style.padding = '2px 8px';
                    delBtn.style.display = 'inline-flex';
                    delBtn.style.alignItems = 'center';
                    delBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="5" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M3 7h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 7V5a2 2 0 0 1 4 0v2" stroke="currentColor" stroke-width="1.5"/></svg>`;
                    delBtn.onclick = function() {
                        let list = getWatchlist();
                        list.splice(idx, 1);
                        saveWatchlist(list);
                        modal.remove();
                        showModal();
                    };
                    actionCell.appendChild(delBtn);
                }
                // Initial render and append
                if (editTicketId && item.ticket === editTicketId) {
                    isEditing = true;
                    renderEditor(true);
                } else {
                    renderComment();
                }
                row.appendChild(commentCell);
                row.appendChild(actionCell);
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            scrollContainer.appendChild(table);
        }
        content.appendChild(scrollContainer);

        let closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.marginTop = '10px';
        closeBtn.style.padding = '6px 18px';
        closeBtn.style.border = '1px solid #bbb';
        closeBtn.style.borderRadius = '5px';
        closeBtn.style.background = '#f7f7f7';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => modal.remove();
        content.appendChild(closeBtn);

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
        }); // end loadMarked
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
            let ticket = getSelectedText();
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
})();
