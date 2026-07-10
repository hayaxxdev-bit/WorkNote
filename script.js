// State Management
let notes = JSON.parse(localStorage.getItem('myNotepad_notes')) || [];
let currentNoteId = localStorage.getItem('myNotepad_currentNoteId') || null;
let isDarkMode = localStorage.getItem('myNotepad_darkMode') === 'true';
let confirmCallback = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (isDarkMode) {
        document.body.setAttribute('data-theme', 'dark');
    }
    
    if (notes.length === 0) {
        createNewNote();
    }
    
    renderNotesList();
    
    if (currentNoteId) {
        loadNote(currentNoteId);
    } else if (notes.length > 0) {
        loadNote(notes[0].id);
    }
    
    // Auto-save every 10 seconds
    setInterval(autoSave, 10000);
    
    // Handle responsive sidebar
    handleResponsiveSidebar();
});

// Create new note
function createNewNote() {
    const note = {
        id: generateId(),
        title: 'Catatan Baru',
        content: '',
        category: 'other',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    notes.unshift(note);
    saveToLocalStorage();
    renderNotesList();
    loadNote(note.id);
    showToast('Catatan baru dibuat!');
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Load note
function loadNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    currentNoteId = id;
    localStorage.setItem('myNotepad_currentNoteId', currentNoteId);
    
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteCategory').value = note.category;
    document.getElementById('editor').value = note.content;
    
    updateStats();
    renderNotesList();
    updateLastSaved(note.updatedAt);
}

// Update current note
function updateCurrentNote() {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;
    
    note.title = document.getElementById('noteTitle').value || 'Tanpa Judul';
    note.category = document.getElementById('noteCategory').value;
    note.content = document.getElementById('editor').value;
    note.updatedAt = new Date().toISOString();
    
    saveToLocalStorage();
    updateStats();
    renderNotesList();
}

// Handle editor input
function handleEditorInput() {
    updateCurrentNote();
}

// Save note manually
function saveNote() {
    updateCurrentNote();
    showToast('Catatan disimpan!');
}

// Auto save
function autoSave() {
    if (currentNoteId) {
        updateCurrentNote();
    }
}

// Update statistics
function updateStats() {
    const note = notes.find(n => n.id === currentNoteId);
    const content = note ? note.content : '';
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    
    document.getElementById('wordCount').textContent = `${words} kata`;
    document.getElementById('charCount').textContent = `${chars} karakter`;
    document.getElementById('totalNotes').textContent = `${notes.length} catatan`;
    
    const totalWords = notes.reduce((sum, n) => {
        return sum + (n.content.trim() ? n.content.trim().split(/\s+/).length : 0);
    }, 0);
    document.getElementById('totalWords').textContent = `${totalWords} kata`;
}

// Update last saved time
function updateLastSaved(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    let timeStr;
    if (diff < 60) timeStr = 'Baru saja';
    else if (diff < 3600) timeStr = `${Math.floor(diff / 60)} menit lalu`;
    else if (diff < 86400) timeStr = `${Math.floor(diff / 3600)} jam lalu`;
    else timeStr = date.toLocaleDateString('id-ID');
    
    document.getElementById('lastSaved').textContent = `Disimpan: ${timeStr}`;
}

// Render notes list
function renderNotesList() {
    const notesList = document.getElementById('notesList');
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredNotes = notes;
    
    if (categoryFilter !== 'all') {
        filteredNotes = filteredNotes.filter(n => n.category === categoryFilter);
    }
    
    if (searchQuery) {
        filteredNotes = filteredNotes.filter(n => 
            n.title.toLowerCase().includes(searchQuery) ||
            n.content.toLowerCase().includes(searchQuery)
        );
    }
    
    notesList.innerHTML = filteredNotes.map(note => `
        <div class="note-item ${note.id === currentNoteId ? 'active' : ''}" 
             onclick="loadNote('${note.id}')">
            <h3>${escapeHtml(note.title) || 'Tanpa Judul'}</h3>
            <div class="note-preview">${escapeHtml(note.content.substring(0, 60)) || 'Kosong'}</div>
            <div class="note-meta-small">
                <span>${getCategoryEmoji(note.category)} ${formatDate(note.updatedAt)}</span>
                <span>${note.content.trim().split(/\s+/).filter(w => w).length} kata</span>
            </div>
            <button class="delete-note" onclick="event.stopPropagation(); deleteNoteConfirm('${note.id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Filter by category
function filterByCategory() {
    renderNotesList();
}

// Search notes
function searchNotes() {
    renderNotesList();
}

// Delete note
function deleteNoteConfirm(id) {
    confirmCallback = () => {
        deleteNote(id);
    };
    
    document.getElementById('modalTitle').textContent = 'Hapus Catatan';
    document.getElementById('modalMessage').textContent = 'Apakah Anda yakin ingin menghapus catatan ini?';
    document.getElementById('btnConfirm').textContent = 'Hapus';
    document.getElementById('confirmModal').classList.add('show');
}

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    
    if (currentNoteId === id) {
        currentNoteId = notes.length > 0 ? notes[0].id : null;
    }
    
    saveToLocalStorage();
    renderNotesList();
    
    if (currentNoteId) {
        loadNote(currentNoteId);
    } else {
        document.getElementById('noteTitle').value = '';
        document.getElementById('editor').value = '';
    }
    
    showToast('Catatan dihapus!', 'error');
    closeModal();
}

// Clear all notes
function clearAllNotes() {
    if (notes.length === 0) {
        showToast('Tidak ada catatan untuk dihapus', 'error');
        return;
    }
    
    confirmCallback = () => {
        notes = [];
        currentNoteId = null;
        saveToLocalStorage();
        renderNotesList();
        document.getElementById('noteTitle').value = '';
        document.getElementById('editor').value = '';
        updateStats();
        showToast('Semua catatan dihapus!', 'error');
        closeModal();
    };
    
    document.getElementById('modalTitle').textContent = 'Hapus Semua Catatan';
    document.getElementById('modalMessage').textContent = 'Apakah Anda yakin ingin menghapus SEMUA catatan? Tindakan ini tidak dapat dibatalkan.';
    document.getElementById('btnConfirm').textContent = 'Hapus Semua';
    document.getElementById('confirmModal').classList.add('show');
}

// Confirm action
function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
    }
}

// Close modal
function closeModal() {
    document.getElementById('confirmModal').classList.remove('show');
    confirmCallback = null;
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

// Responsive sidebar
function handleResponsiveSidebar() {
    window.addEventListener('resize', () => {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth > 768) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

// Toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : '');
    localStorage.setItem('myNotepad_darkMode', isDarkMode);
    showToast(isDarkMode ? 'Dark mode aktif' : 'Light mode aktif');
}

// Format text functions
function formatText(format) {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);
    
    let formattedText;
    let cursorPos;
    
    switch(format) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            cursorPos = end + 4;
            break;
        case 'italic':
            formattedText = `*${selectedText}*`;
            cursorPos = end + 2;
            break;
        case 'underline':
            formattedText = `__${selectedText}__`;
            cursorPos = end + 4;
            break;
        case 'strikethrough':
            formattedText = `~~${selectedText}~~`;
            cursorPos = end + 4;
            break;
    }
    
    editor.value = text.substring(0, start) + formattedText + text.substring(end);
    editor.selectionStart = cursorPos;
    editor.selectionEnd = cursorPos;
    editor.focus();
    updateCurrentNote();
}

// Insert list
function insertList(type) {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const text = editor.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    
    const prefix = type === 'ul' ? '- ' : '1. ';
    const insertion = `\n${prefix}`;
    
    editor.value = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    editor.selectionStart = start + prefix.length;
    editor.selectionEnd = start + prefix.length;
    editor.focus();
    updateCurrentNote();
}

// Insert checkbox
function insertCheckbox() {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const text = editor.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    
    const checkbox = '- [ ] ';
    
    editor.value = text.substring(0, lineStart) + checkbox + text.substring(lineStart);
    editor.selectionStart = start + checkbox.length;
    editor.selectionEnd = start + checkbox.length;
    editor.focus();
    updateCurrentNote();
}

// Insert divider
function insertDivider() {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const divider = '\n\n---\n\n';
    
    editor.value = editor.value.substring(0, start) + divider + editor.value.substring(start);
    editor.selectionStart = start + divider.length;
    editor.selectionEnd = start + divider.length;
    editor.focus();
    updateCurrentNote();
}

// Insert date
function insertDate() {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const date = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    editor.value = editor.value.substring(0, start) + date + editor.value.substring(start);
    editor.selectionStart = start + date.length;
    editor.selectionEnd = start + date.length;
    editor.focus();
    updateCurrentNote();
}

// Insert time
function insertTime() {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const time = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    editor.value = editor.value.substring(0, start) + time + editor.value.substring(start);
    editor.selectionStart = start + time.length;
    editor.selectionEnd = start + time.length;
    editor.focus();
    updateCurrentNote();
}

// Export note
function exportNote() {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) {
        showToast('Tidak ada catatan untuk diexport', 'error');
        return;
    }
    
    const content = `# ${note.title}\n\nKategori: ${note.category}\nTanggal: ${formatDate(note.updatedAt)}\n\n---\n\n${note.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Catatan berhasil diexport!');
}

// Utility functions
function saveToLocalStorage() {
    localStorage.setItem('myNotepad_notes', JSON.stringify(notes));
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCategoryEmoji(category) {
    const emojis = {
        project: '📁',
        daily: '📅',
        work: '💼',
        personal: '👤',
        ideas: '💡',
        other: '📌'
    };
    return emojis[category] || '📌';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 's':
                e.preventDefault();
                saveNote();
                break;
            case 'b':
                e.preventDefault();
                formatText('bold');
                break;
            case 'i':
                e.preventDefault();
                formatText('italic');
                break;
            case 'n':
                e.preventDefault();
                createNewNote();
                break;
        }
    }
});