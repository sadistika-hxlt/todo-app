
const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const taskList = document.querySelector('#task-list');
const message = document.querySelector('#message');

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Произошла ошибка');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Показать все задачи
async function loadTasks() {
  try {
    const tasks = await request('/api/tasks');

    taskList.replaceChildren();

    tasks.forEach((task) => {
      const item = document.createElement('li');
      item.className = task.completed
        ? 'task completed'
        : 'task';

      const title = document.createElement('h3');
      title.textContent = task.title;

      const description = document.createElement('p');
      description.textContent = task.description || 'Без описания';

      const status = document.createElement('p');
      status.textContent = task.completed
        ? 'Выполнена'
        : 'Не выполнена';

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      if (!task.completed) {
        const completeButton = document.createElement('button');
        completeButton.textContent = 'Выполнена';

        completeButton.addEventListener('click', async () => {
          try {
            await request(`/api/tasks/${task.id}`, {
              method: 'PATCH',
            });
            await loadTasks();
          } catch (error) {
            message.textContent = error.message;
          }
        });

        actions.append(completeButton);
      }

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Удалить';
      deleteButton.className = 'delete';

      deleteButton.addEventListener('click', async () => {
        try {
          await request(`/api/tasks/${task.id}`, {
            method: 'DELETE',
          });
          await loadTasks();
        } catch (error) {
          message.textContent = error.message;
        }
      });

      actions.append(deleteButton);
      item.append(title, description, status, actions);
      taskList.append(item);
    });
  } catch (error) {
    message.textContent = error.message;
  }
}

// Добавить новую задачу
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title) {
    message.textContent = 'Введите название задачи';
    return;
  }

  try {
    await request('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    form.reset();
    message.textContent = 'Задача добавлена';
    await loadTasks();
  } catch (error) {
    message.textContent = error.message;
  }
});

// Загрузить задачи при открытии страницы
loadTasks();
