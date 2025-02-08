const Todo = require('../models/todoModel');
const catchAsync = require('../utils/catchAsync');

exports.getMyTodos = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const todos = await Todo.findAll({
    where: {
      id: userId,
    },
  });

  res.status(200).json(todos);
});

exports.createTodo = catchAsync(async (req, res, next) => {
  req.body.userId = req.user.id;
  const todo = await Todo.create(req.body);
  res.status(201).json(todo);
});

exports.getTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findByPk(req.params.id);
  if (!todo) return next(new Error('Todo not found'));
  res.status(200).json(todo);
});

exports.updateTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findByPk(req.params.id);
  if (!todo) return next(new Error('Todo not found'));
  await todo.update(req.body);
  res.status(200).json(todo);
});

exports.deleteTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findByPk(req.params.id);
  if (!todo) return next(new Error('Todo not found'));
  await todo.destroy(); // delete
  res.status(204).json({ message: 'Todo deleted successfully' });
});
