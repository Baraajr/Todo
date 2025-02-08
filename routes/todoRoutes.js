const express = require('express');

const router = express.Router();

const todoControllers = require('../controllers/todoController');
const authControllers = require('../controllers/authControllers');

router.use(authControllers.protect);
router
  .route('/myTodos')
  .get(todoControllers.getMyTodos)
  .post(todoControllers.createTodo);

router
  .route('/:id')
  .get(todoControllers.getTodo)
  .patch(todoControllers.updateTodo)
  .delete(todoControllers.deleteTodo);

module.exports = router;
