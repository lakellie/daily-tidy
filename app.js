const defaultTasks = [
  { text: "elsie's room", done: false },
  { text: "living room", done: false },
  { text: "dining room", done: false },
  { text: "kitchen", done: false },
  { text: "bathroom", done: false },
];

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
    li.className = "task-item";
    li.dataset.index = index;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-swipe-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(index);

    const content = document.createElement("div");
    content.className = "task-content";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.onchange = () => toggleTask(index);

    const span = document.createElement("span");
    span.textContent = task.text;
    if (task.done) span.style.textDecoration = "line-through";
    span.style.flex = "1";

    content.appendChild(checkbox);
    content.appendChild(span);
    li.appendChild(deleteBtn);
    li.appendChild(content);
    taskListEl.appendChild(li);

    // --- Swipe to Delete ---
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    content.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
    });

    content.addEventListener("touchmove", (e) => {
      if (!isSwiping) return;
      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      if (deltaX < 0) {
        content.style.transform = `translateX(${deltaX}px)`;
      }
    });

    content.addEventListener("touchend", () => {
      isSwiping = false;
      if (currentX - startX < -60) {
        content.style.transform = `translateX(-80px)`;
      } else {
        content.style.transform = `translateX(0)`;
      }
    });

    // --- Touch-based Drag-and-Drop ---
    let startY = 0;
    let draggingEl = null;
    let placeholderEl = null;

    content.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) return;

      startY = e.touches[0].clientY;
      draggingEl = li;
      placeholderEl = document.createElement("li");
      placeholderEl.className = "task-placeholder";

      li.classList.add("dragging");
      taskListEl.insertBefore(placeholderEl, li.nextSibling);
    });

    content.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;

      draggingEl.style.transform = `translateY(${deltaY}px)`;

      const allItems = [...taskListEl.querySelectorAll(".task-item")].filter(
        (el) => el !== draggingEl
      );

      for (let otherEl of allItems) {
        const rect = otherEl.getBoundingClientRect();
        if (touch.clientY > rect.top && touch.clientY < rect.bottom) {
          if (taskListEl.contains(placeholderEl)) {
            taskListEl.removeChild(placeholderEl);
          }
          if (touch.clientY < rect.top + rect.height / 2) {
            taskListEl.insertBefore(placeholderEl, otherEl);
          } else {
            taskListEl.insertBefore(placeholderEl, otherEl.nextSibling);
          }
          break;
        }
      }
    });

    content.addEventListener("touchend", () => {
      if (placeholderEl && draggingEl) {
        draggingEl.style.transform = "";
        draggingEl.classList.remove("dragging");

        taskListEl.insertBefore(draggingEl, placeholderEl);
        taskListEl.removeChild(placeholderEl);

        // Recalculate task order
        const newOrderEls = [...taskListEl.querySelectorAll(".task-item")];
        const newTasks = newOrderEls.map((el) => {
          const i = parseInt(el.dataset.index);
          return currentTasks[i];
        });

        currentTasks = newTasks;
        saveTasks(today, currentTasks);
        renderTasks(currentTasks);
      }
    });
  });
}



function saveTasks(date, tasks) {
  localStorage.setItem(`todo-${date}`, JSON.stringify(tasks));
  populatePastDates();
}

function loadTasks(date) {
  const data = localStorage.getItem(`todo-${date}`);
  if (data) {
    return JSON.parse(data);
  } else {
    // First time opening this day → use default tasks
    saveTasks(date, defaultTasks);
    return [...defaultTasks]; // clone so we don't modify the original
  }
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
