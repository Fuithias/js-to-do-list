// DOM element references for input field, submit button and container for tasks
const taskInput = document.querySelector('#task');
const addBtn = document.querySelector('.add');
const tasksContainer = document.querySelector('.tasks-container');

// Buttons template for task editing and deletion
const taskBtns = `<button type="button" class="edit">&#9998;</button><button type="button" class="delete">&#10006;</button>`;

// Detects if the user's preferred color scheme is dark mode and init variable for theme management
const rootClassList = document.querySelector(':root').classList;
const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');

// Variables to track task currently being edited and ID
let isEditing = false;
let editingId = '';

// Adds event listeners to all buttons with the 'btn' class
document.querySelectorAll('.btn').forEach(element => element.addEventListener('click', handleClick));

// Adds event listener to the tasks container
tasksContainer.addEventListener('click', handleClick);

// Sets up the task list and theme when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', setupItems);

// Detects when the user's color scheme preference changes
matchMedia.addEventListener('change', setupTheme);

/**
 * Adds a new task to the list.
 * Ensures that duplicate task names are appended with a number.
 * Saves the task to local storage and creates the task element in the DOM.
 */
function addTask() {
  let taskValue = taskInput.value || 'New task';
  taskInput.value = '';

  document.querySelectorAll('div span').forEach(element => {
    let elementValue = element.textContent.replace(' ✎✖', '');
    if (elementValue === taskValue) {
      const match = elementValue.match(/\((\d+)\)/);
      taskValue = match
        ? elementValue.replace(/\(\d+\)/, `(${++match[1]})`)
        : `${taskValue} (1)`;
    }
  });

  const id = uuidv4();
  addToLocalStorage(id, taskValue, false);
  createTask(id, taskValue, false);
}

/**
 * Creates a task element in the DOM.
 * @param {string} id - The unique ID of the task.
 * @param {string} value - The task description.
 * @param {boolean} checked - Whether the task is marked as completed.
 */
function createTask(id, value, checked) {
  const taskHTML = `
    <span class="task" data-id="${id}">${value} ${taskBtns}</span>
  `;
  tasksContainer.insertAdjacentHTML('beforeend', taskHTML);
  if (checked) {
    checkTask(document.querySelector(`span[data-id="${id}"]`));
  }
}

/**
 * Edits the currently selected task.
 * Updates the task value and the local storage.
 */
function editTask() {
  document.querySelectorAll('div span').forEach(element => {
    if (element.dataset.id === editingId) {
      element.innerHTML = `${taskInput.value} ${taskBtns}`;
      editLocalStorage(editingId, taskInput.value, element.classList.contains('line-through'));
    }
  });
  toDefault();
}

/**
 * Begins editing the selected task.
 * Populates the input field with the task value.
 * @param {HTMLElement} target - The target element that triggered editing.
 */
function startEditing(target) {
  const task = target.closest('.task');
  editingId = task.dataset.id;
  taskInput.value = task.textContent.replace(' ✎✖', '');
  addBtn.textContent = 'Edit';
  isEditing = true;
}

/**
 * Removes the selected task from the list.
 * Updates the local storage and the DOM.
 * @param {HTMLElement} target - The target element that triggered removal.
 */
function removeTask(target) {
  const task = target.closest('.task');
  if (editingId === task.dataset.id) {
    toDefault();
  }
  removeFromLocalStorage(task.dataset.id);
  task.remove();
}

/**
 * Clears all tasks from the list.
 * Removes all items from local storage and resets the interface.
 */
function clearItems() {
  const items = document.querySelectorAll('.task');
  if (items.length > 0) {
    items.forEach(item => item.remove());
  }
  localStorage.removeItem('list');
  toDefault();
}

/**
 * Toggles the completion status of a task.
 * Updates the task's appearance and its value in local storage.
 * @param {HTMLElement} task - The task element to check/uncheck.
 */
function checkTask(task) {
  task.classList.toggle('line-through');
  editLocalStorage(task.dataset.id, task.textContent.replace(' ✎✖', ''), task.classList.contains('line-through'));
}

/**
 * Sets up the theme based on local storage or user's preference.
 * Defaults to dark mode if preferred.
 */
function setupTheme() {
  if (localStorage.getItem('theme')) {
    rootClassList.add(localStorage.getItem('theme'));
  } else if (matchMedia.matches) {
    rootClassList.add('dark-theme');
  } else if (rootClassList.contains('dark-theme')) {
    rootClassList.remove('dark-theme');
    rootClassList.add('light-theme');
  }
}

/**
 * Changes the theme between light and dark.
 * Stores the user's preference in local storage.
 */
function changeTheme() {
  if (rootClassList.contains('dark-theme')) {
    localStorage.setItem('theme', 'light-theme');
    rootClassList.remove('dark-theme');
    rootClassList.add('light-theme');
  } else {
    localStorage.setItem('theme', 'dark-theme');
    rootClassList.remove('light-theme');
    rootClassList.add('dark-theme');
  }
}

/**
 * Resets the editing state and input field to default.
 */
function toDefault() {
  editingId = '';
  taskInput.value = '';
  addBtn.textContent = 'Submit';
  isEditing = false;
}

/**
 * Handles various button clicks for adding, editing, deleting, and managing tasks.
 * @param {Event} event - The click event triggered by user interaction.
 */
function handleClick(event) {
  const target = event.target;

  if (target === addBtn) {
    isEditing ? editTask() : addTask();
  } else if (target.closest('.edit')) {
    startEditing(target);
  } else if (target.closest('.delete')) {
    removeTask(target);
  } else if (target.closest('.clear')) {
    clearItems();
  } else if (target.closest('.task') && !target.closest('button')) {
    checkTask(target.closest('.task'));
  } else if (target.closest('.theme')) {
    changeTheme();
  }
}

/**
 * Generates a UUID (version 4) for unique task identification.
 * @returns {string} - The generated UUID.
 */
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/**
 * Adds a task to local storage.
 * @param {string} id - The unique ID of the task.
 * @param {string} value - The task description.
 * @param {boolean} checked - Whether the task is marked as completed.
 */
function addToLocalStorage(id, value, checked) {
  const task = { id, value, checked };
  const items = [...getLocalStorage(), task];
  localStorage.setItem('list', JSON.stringify(items));
}

/**
 * Edits a task in local storage.
 * @param {string} id - The unique ID of the task.
 * @param {string} value - The updated task description.
 * @param {boolean} checked - Whether the task is marked as completed.
 */
function editLocalStorage(id, value, checked) {
  const items = getLocalStorage().map(item => 
    item.id === id ? { ...item, value, checked } : item
  );
  localStorage.setItem('list', JSON.stringify(items));
}

/**
 * Removes a task from local storage.
 * @param {string} id - The unique ID of the task to be removed.
 */
function removeFromLocalStorage(id) {
  const items = getLocalStorage().filter(item => item.id !== id);
  localStorage.setItem('list', JSON.stringify(items));
}

/**
 * Retrieves the task list from local storage.
 * @returns {Array} - The list of tasks stored in local storage.
 */
function getLocalStorage() {
  return JSON.parse(localStorage.getItem('list')) || [];
}

/**
 * Sets up the task list and theme on initial page load.
 * Retrieves tasks from local storage and adds them to the DOM.
 */
function setupItems() {
  setupTheme();
  const items = getLocalStorage();
  if (items.length > 0) {
    items.forEach(item => createTask(item.id, item.value, item.checked));
  }
}