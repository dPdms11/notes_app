// Get all list items
let listItems = document.querySelectorAll('.list-group-item');
let listItem = document.querySelector('.list-group-item');

// Get note components
let title = document.querySelector('#title');
let note = document.querySelector('#note');
let date = document.querySelector('.date');

// Get save/delete button
let saveButton = document.querySelector('[name="save"]');
let deleteButton = document.querySelector('[name="delete"]');

try {
    listItem.classList.add('active');
    readNote();
} catch(error) {
    // Create new note if there are no exisiting notes
    //createNote();
}

// Listen to changes in note to switch status of save button
title.addEventListener('keyup', disableButton);
note.addEventListener('keyup', disableButton);
function disableButton() {
    if (title.value.length === 0 && note.value.length === 0) {
        saveButton.disabled = true;
        saveButton.classList.add('no-change');
    } else {
        saveButton.disabled = false;
        saveButton.classList.remove('no-change');
    }
};


// Listen to click on CREATE button
let createButton = document.querySelector('[name="new"]')
createButton.addEventListener('click', () => openSaveModal(null));

// CREATE -- new note
function createNote() {
    // Remove active class from all list items
    listItems.forEach(function(item) {
        item.classList.remove('active');
    });
    
    // Get id of new note
    fetch('/api/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        // Reload page after successfully creating note
        setTimeout(() => location.reload(), 1000);

        let noteDate = formatDate();
        date.innerHTML = noteDate;
    })
    .catch(error => console.error('Create new note error:', error));
};


// Listen to click on existing note
listItems.forEach(function(e) {
    e.addEventListener('click', () => {
        let currentId = document.querySelector('.active').id
        if (currentId !== e.id) {
            openSaveModal(e.id);
        }
        // Do nothing if note clicked is already selected
    })
});

// READ -- Load selected note on screen
function readNote() {
    let id = document.querySelector('.active').id

    // Deactivate save button when first loading note
    saveButton.disabled = true;
    saveButton.classList.add('no-change');

    // Send active note id to server
    fetch(`/api/notes/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    // Receive note data from server
    .then(response => response.json())
    .then(data => {
        // Load data from back-end to screen
        let noteTitle = JSON.parse(JSON.stringify(data[0][2]));
        let noteBody = JSON.parse(JSON.stringify(data[0][3]));
        let noteDate = formatDate(JSON.parse(JSON.stringify(data[0][1])));
        let isNewNote = JSON.parse(JSON.stringify(data[0][4]));

        // Assign data to fields
        if (isNewNote === 0) {
            title.value = noteTitle;
            note.value = noteBody;
        } else {
            title.value = '';
            note.value = '';
        }
        date.innerHTML = noteDate;
    })
    .catch(error => {
        console.error('Read note error:', error);
    });
};

// Listen to click on SAVE button
saveButton.addEventListener('click', () => {
    // Get field content
    let tempId = document.querySelector('.active').id;
    let tempTitle = title.value;
    let tempNote = note.value;
    updateNote(tempId, tempTitle, tempNote);
});

// UPDATE -- Save changes to note
function updateNote(tempId, tempTitle, tempNote) {
    // Get data to send to server
    let noteData = {
        id: tempId,
        title: tempTitle,
        note: tempNote
    };

    fetch(`/api/notes/${tempId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
    })
    .then(response => response.json())
    // Reload page after successfully saving note
    .then(setTimeout(() => location.reload(), 1000))
    .catch(error => console.error('Update note error:', error));
};


// Open SAVE MODAL that asks user to save changes before exiting out of note
function openSaveModal(noteId) {
    // Get save modal & children
    let saveModal = document.querySelector('#save-modal');
    let discardChanges = document.querySelector('#discard-changes')
    let saveChanges = document.querySelector('#save-changes')
    let closeSave = document.querySelector('#save-close')

    // Create temporary variables to store note info before switching 'active' notes
    let tempId = document.querySelector('.active').id;
    let tempTitle = title.value;
    let tempNote = note.value;

    // Only run function is changes were made to note
    if (!saveButton.classList.contains('no-change')) {
        // Show modal
        saveModal.style.display = 'block';

        // Discard changes to note
        discardChanges.addEventListener('click', () => {
            saveModal.style.display = 'none';
            if (noteId !== null) {
                changeActiveNote(noteId);
            } else {
                createNote();
            }
        });

        // Save changes if user selects 'Save changes' button
        saveChanges.addEventListener('click', () => {
            saveModal.style.display = 'none';
            updateNote(tempId, tempTitle, tempNote);
        });

        // Close modal
        closeSave.addEventListener('click', () => {
            saveModal.style.display = 'none';
        });

        // Close modal if user clicks out of box
        window.onclick = function(event) {
            if (event.target == saveModal) {
                saveModal.style.display = 'none';
            }
        }
    // If no changes were made, load next note
    } else {
        // Open selected note
        if (noteId !== null) {
            changeActiveNote(noteId);
        // Create new note if no note was selected
        } else {
            createNote();
        }
    }
};

// Change 'active' to selected note and load
function changeActiveNote(noteId) {
    // Remove active class from all list items
    listItems.forEach(function(item) {
        item.classList.remove('active');
    })

    // Add active class to current list item
    document.getElementById(`${noteId}`).classList.add('active');
    readNote();
}


// Listen to click on DELETE button
deleteButton.addEventListener('click', openDeleteModal);

// DELETE -- Delete note via button
function deleteNote() {
    // Get id of active note
    let activeNoteId = document.querySelector('.active').id;

    fetch(`/api/notes/${activeNoteId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    // Receive note data from server
    .then(response => {
        return response.json();
    })
    .then(setTimeout(() => location.reload(), 1000))
    .catch(error => {
        console.error('Delete note error:', error);
    });
};

// Confirm whether user wants to delete note
function openDeleteModal() {
    // Get delete modal & children
    let deleteModal = document.querySelector('#delete-modal');
    let noDelete = document.querySelector('#no-delete')
    let yesDelete = document.querySelector('#yes-delete')
    let closeDelete = document.querySelector('#delete-close')

    // Ask user if they want to delete note
    deleteModal.style.display = 'block';

    // User selects don't delete
    noDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    // User selects delete
    yesDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        deleteNote();
    });

    // Close modal
    closeDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    // Close modal if user clicks out of box
    window.onclick = function(event) {
        if (event.target == deleteModal) {
            deleteModal.style.display = 'none';
        }
    }
}

// Format date output of selected note
function formatDate(date) {
    try {
        date = new Date(date);
    } finally {
        date = new Date();
    }

    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let year = date.getFullYear();
    let hour = (date.getHours() % 12 || 12).toString().padStart(2, '0');
    let minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month}/${day}/${year} ${hour}:${minutes} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}