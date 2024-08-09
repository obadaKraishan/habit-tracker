let authToken = '';

document.addEventListener('DOMContentLoaded', () => {
  // Check for token in localStorage
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    document.getElementById('authNotice').style.display = 'none';
    document.getElementById('habitSection').style.display = 'block';
    document.getElementById('loginNav').style.display = 'none';
    document.getElementById('registerNav').style.display = 'none';
    document.getElementById('logoutNav').style.display = 'block';
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
      document.getElementById('authNotice').style.display = 'none';
      document.getElementById('habitSection').style.display = 'block';
      document.getElementById('loginNav').style.display = 'none';
      document.getElementById('registerNav').style.display = 'none';
      document.getElementById('logoutNav').style.display = 'block';
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
      document.getElementById('authNotice').style.display = 'none';
      document.getElementById('habitSection').style.display = 'block';
      document.getElementById('loginNav').style.display = 'none';
      document.getElementById('registerNav').style.display = 'none';
      document.getElementById('logoutNav').style.display = 'block';
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
    console.log('Fetched habits:', habits); // Add this line
    if (!Array.isArray(habits)) {
      throw new Error('Invalid response format'); // Add this check
    }
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

  // Generate 12 months (columns)
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse(); // Reverse to display from Jan to Dec

  months.forEach(month => {
    const monthColumn = document.createElement('div');
    monthColumn.className = 'grid-column';

    const monthName = document.createElement('div');
    monthName.className = 'grid-column-header';
    monthName.innerText = month.toLocaleString('default', { month: 'short' });
    monthColumn.appendChild(monthName);

    // Generate days for each month
    for (let day = 1; day <= 31; day++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      const cellDate = new Date(month.getFullYear(), month.getMonth(), day);

      if (cellDate.getMonth() !== month.getMonth()) {
        // Skip if the day exceeds the number of days in the month
        continue;
      }

      // Check if the habit was completed on this day
      const habitCompleted = habits.some(habit =>
        habit.datesCompleted.some(date => new Date(date).toDateString() === cellDate.toDateString())
      );

      cell.style.backgroundColor = habitCompleted ? '#40c463' : '#ebedf0';

      // Click to toggle completion
      cell.addEventListener('click', () => toggleHabitCompletion(habits, cellDate));
      monthColumn.appendChild(cell);
    }

    grid.appendChild(monthColumn);
  });
}

function toggleHabitCompletion(habits, day) {
  habits.forEach(habit => {
    const completed = habit.datesCompleted.some(date => new Date(date).toDateString() === day.toDateString());
    if (!completed) {
      habit.datesCompleted.push(day);
    } else {
      habit.datesCompleted = habit.datesCompleted.filter(date => new Date(date).toDateString() !== day.toDateString());
    }

    // Update the habit on the server
    fetch(`/api/habits/${habit._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(habit)
    })
    .then(() => fetchHabits())
    .catch(error => showFeedback('Error: ' + error.message));
  });
}


function getHabitColor(habits, day) {
  const habitCount = habits.filter(habit => {
    const habitDate = new Date(habit.createdAt);
    return habit.datesCompleted.some(date => new Date(date).toDateString() === day.toDateString());
  }).length;
  switch (habitCount) {
    case 0: return '#ebedf0';
    case 1: return '#9be9a8';
    case 2: return '#40c463';
    case 3: return '#30a14e';
    default: return '#216e39';
  }
}


function getHabitCompletion(habits, day) {
  let completionContent = '';
  let color = '#ebedf0'; // Default color for uncompleted

  habits.forEach(habit => {
    if (habit.datesCompleted.some(date => new Date(date).toDateString() === day.toDateString())) {
      color = '#9be9a8'; // Completed color
      completionContent = `<span>${habit.name}</span>`;
    }
  });

  return { color, content: completionContent };
}


function editHabit(id) {
  const habit = habits.find(h => h._id === id); // Assuming habits are stored in a global variable

  // Populate the form with the current habit details
  document.getElementById('habitName').value = habit.name;
  document.getElementById('habitDescription').value = habit.description;
  document.getElementById('habitFrequency').value = habit.frequency;
  document.getElementById('habitGoal').value = habit.goal;
  document.getElementById('habitReminders').checked = habit.reminders;

  // Change the form submission to update the habit instead of creating a new one
  document.getElementById('habitForm').onsubmit = function(event) {
    event.preventDefault();

    const updatedHabit = {
      name: document.getElementById('habitName').value,
      description: document.getElementById('habitDescription').value,
      frequency: document.getElementById('habitFrequency').value,
      goal: document.getElementById('habitGoal').value,
      reminders: document.getElementById('habitReminders').checked,
    };

    fetch(`/api/habits/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedHabit)
    })
    .then(response => response.json())
    .then(updatedHabit => {
      fetchHabits(); // Refresh the list of habits
      showFeedback('Habit updated successfully!');
      document.getElementById('habitForm').reset(); // Clear the form
      document.getElementById('habitForm').onsubmit = addHabit; // Reset form submission behavior
    })
    .catch(error => showFeedback('Error: ' + error.message));
  };
}

function logout() {
  authToken = '';
  localStorage.removeItem('authToken');
  document.getElementById('authNotice').style.display = 'block';
  document.getElementById('habitSection').style.display = 'none';
  document.getElementById('loginNav').style.display = 'block';
  document.getElementById('registerNav').style.display = 'block';
  document.getElementById('logoutNav').style.display = 'none';
  showFeedback('Logged out successfully!');
}
