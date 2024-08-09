let authToken = '';

document.addEventListener('DOMContentLoaded', () => {
  // Check for token in localStorage
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('habitSection').style.display = 'block';
    fetchHabits();
  }

  document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    registerUser(username, password);
  });

  document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    loginUser(username, password);
  });

  document.getElementById('habitForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('habitName').value;
    const description = document.getElementById('habitDescription').value;
    const frequency = document.getElementById('habitFrequency').value;
    const goal = document.getElementById('habitGoal').value;
    const reminders = document.getElementById('habitReminders').checked;
    addHabit({ name, description, frequency, goal, reminders });
  });
});

function showFeedback(message) {
  document.getElementById('feedbackModalBody').innerText = message;
  $('#feedbackModal').modal('show');
}

function registerUser(username, password) {
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      document.getElementById('authSection').style.display = 'none';
      document.getElementById('habitSection').style.display = 'block';
      fetchHabits();
      showFeedback('Registration successful!');
    } else {
      showFeedback('Registration failed: ' + data.error);
    }
  })
  .catch(error => showFeedback('Error: ' + error.message));
}

function loginUser(username, password) {
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      document.getElementById('authSection').style.display = 'none';
      document.getElementById('habitSection').style.display = 'block';
      fetchHabits();
      showFeedback('Login successful!');
    } else {
      showFeedback('Login failed: ' + data.error);
    }
  })
  .catch(error => showFeedback('Error: ' + error.message));
}

function fetchHabits() {
  fetch('/api/habits', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })
  .then(response => response.json())
  .then(habits => {
    const habitList = document.getElementById('habitList');
    habitList.innerHTML = '';
    habits.forEach(habit => {
      const habitElement = document.createElement('li');
      habitElement.className = 'list-group-item';
      habitElement.innerHTML = `
        <strong>${habit.name}</strong> - ${habit.description}
        <span class="badge badge-primary">${habit.frequency}</span>
        <span class="badge badge-secondary">${habit.progress}/${habit.goal}</span>
        <button class="btn btn-sm btn-warning float-right" onclick="editHabit('${habit._id}')">Edit</button>
        <button class="btn btn-sm btn-danger float-right mr-2" onclick="deleteHabit('${habit._id}')">Delete</button>
      `;
      habitList.appendChild(habitElement);
    });
    generateHabitGrid(habits);
  })
  .catch(error => showFeedback('Error: ' + error.message));
}

function addHabit(habit) {
  fetch('/api/habits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(habit)
  })
  .then(response => response.json())
  .then(newHabit => {
    fetchHabits();
    document.getElementById('habitForm').reset();
    showFeedback('Habit added successfully!');
  })
  .catch(error => showFeedback('Error: ' + error.message));
}

function deleteHabit(id) {
  fetch(`/api/habits/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  })
  .then(() => {
    fetchHabits();
    showFeedback('Habit deleted successfully!');
  })
  .catch(error => showFeedback('Error: ' + error.message));
}

function generateHabitGrid(habits) {
  const grid = document.getElementById('habitGrid');
  grid.innerHTML = '';

  const days = Array.from({ length: 365 }, (_, i) => new Date(Date.now() - i * 86400000));
  const columns = {};

  days.forEach(day => {
    const month = day.toLocaleString('default', { month: 'short' });
    const dayOfMonth = day.getDate();
    if (!columns[month]) {
      columns[month] = [];
    }
    columns[month].push(dayOfMonth);
  });

  for (let [month, days] of Object.entries(columns)) {
    const column = document.createElement('div');
    column.className = 'grid-column';
    const header = document.createElement('div');
    header.className = 'grid-column-header';
    header.innerText = month;
    column.appendChild(header);
    days.forEach(day => {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.style.backgroundColor = getHabitColor(habits, day);
      column.appendChild(cell);
    });
    grid.appendChild(column);
  }
}

function getHabitColor(habits, day) {
  const habitCount = habits.filter(habit => {
    const habitDate = new Date(habit.createdAt);
    return habitDate.toDateString() === day.toDateString();
  }).length;
  switch (habitCount) {
    case 0: return '#ebedf0';
    case 1: return '#9be9a8';
    case 2: return '#40c463';
    case 3: return '#30a14e';
    default: return '#216e39';
  }
}

function editHabit(id) {
  // Implement habit editing functionality here
}
