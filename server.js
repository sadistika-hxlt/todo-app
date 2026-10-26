
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/tasks', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks ORDER BY id DESC'
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});


app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, description = '' } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
  return res.status(400).json({
    error: 'Название задачи не должно быть пустым',
      });
    }

    if (typeof description !== 'string') {
      return res.status(400).json({
    error: 'Описание должно быть строкой',
      });
    }

    const result = await pool.query(
  `INSERT INTO tasks (title, description)
    VALUES ($1, $2)
    RETURNING *`,
      [title.trim(), description.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});


app.patch('/api/tasks/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
  return res.status(400).json({
      error: 'Некорректный идентификатор задачи',
      });
 }

    const result = await pool.query(
      `UPDATE tasks
    SET completed = TRUE
   WHERE id = $1
    RETURNING *`,
   [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Задача не найдена',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});


app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: 'Некорректный идентификатор задачи',
      });
    }

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Задача не найдена',
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});


app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
  });
});

async function startServer() {
  try {
    await pool.query('SELECT 1');

    app.listen(port, () => {
      console.log(`Сервер запущен: http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Не удалось подключиться к PostgreSQL:', error.message);
    process.exit(1);
  }
}

startServer();
