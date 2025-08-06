
const taskListEl = document.getElementById("task-list");
const newTaskInput = document.getElementById("new-task");
const dateEl = document.getElementById("date");
const pastDatesEl = document.getElementById("past-dates");

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'numeric',
  day: 'numeric',
  year: 'numeric'
}).replace(',', '').replace(/(\d+\/\d+\/\d+)/, '($1)')
dateEl.textContent = today;

let currentTasks = loadTasks(today);
renderTasks(currentTasks);
populatePastDates();

function addTask() {
  const text = newTaskInput.value.trim();
  if (!text) return;
  currentTasks.push({ text, done: false });
  saveTasks(today, currentTasks);
  renderTasks(currentTasks);
  newTaskInput.value = "";
}

function toggleTask(index) {
  currentTasks[index].done = !currentTasks[index].done;
  saveTasks(today, currentTasks);
  renderTasks(currentTasks);
}

function renderTasks(tasks) {
  taskListEl.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.onchange = () => toggleTask(index);

    const span = document.createElement("span");
    span.textContent = task.text;
    if (task.done) span.style.textDecoration = "line-through";
    span.style.flex = "1";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.onclick = () => deleteTask(index);
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.fontSize = ".5em";

    li.style.display = "flex";
    li.style.alignItems = "center";

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskListEl.appendChild(li);
  });
}



function saveTasks(date, tasks) {
  localStorage.setItem(`todo-${date}`, JSON.stringify(tasks));
  populatePastDates();
}

function loadTasks(date) {
  const data = localStorage.getItem(`todo-${date}`);
  return data ? JSON.parse(data) : [];
}

function populatePastDates() {
  pastDatesEl.innerHTML = '<option disabled selected>view past lists</option>';
  for (let key in localStorage) {
    if (key.startsWith("todo-")) {
      const date = key.slice(5);
      const option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      pastDatesEl.appendChild(option);
    }
  }
}

function loadListForDate(date) {
  if (!date) return;
  const tasks = loadTasks(date);
  dateEl.textContent = date;
  currentTasks = tasks;
  renderTasks(currentTasks);
}

function setupDragAndDrop() {
  const items = document.querySelectorAll(".task-item");
  let draggedItem = null;
  let draggedIndex = null;

  items.forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      draggedItem = item;
      draggedIndex = parseInt(item.dataset.index);
      setTimeout(() => {
        item.classList.add("dragging");
      }, 0);
    });

    item.addEventListener("dragend", () => {
      draggedItem.classList.remove("dragging");
      draggedItem = null;
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      const currentIndex = parseInt(item.dataset.index);
      if (currentIndex !== draggedIndex) {
        const temp = currentTasks[draggedIndex];
        currentTasks.splice(draggedIndex, 1);
        currentTasks.splice(currentIndex, 0, temp);
        saveTasks(today, currentTasks);
        renderTasks(currentTasks); // rerender to update indices
      }
    });
  });
}

function deleteTask(index) {
  currentTasks.splice(index, 1);
  saveTasks(today, currentTasks);
  renderTasks(currentTasks);
}
