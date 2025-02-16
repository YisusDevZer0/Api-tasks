require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const app = express();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error de conexión:', err));

// Middleware
app.use(express.json());

// Modelo de Tarea (Task.js)
const Task = require('./models/Task');

// Validaciones
const taskValidation = [
  check('titulo').trim().notEmpty().withMessage('Título requerido'),
  check('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
  check('estado').isIn(['pendiente', 'en-progreso', 'completada']),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// CRUD

// 1. Obtener todas las tareas
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// 2. Crear tarea
app.post('/tasks', taskValidation, validate, async (req, res) => {
  try {
    const newTask = new Task({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      estado: req.body.estado || 'pendiente',
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

// 3. Actualizar tarea
app.put('/tasks/:id', taskValidation, validate, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Devuelve la tarea actualizada
    );
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// 4. Eliminar tarea
app.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});