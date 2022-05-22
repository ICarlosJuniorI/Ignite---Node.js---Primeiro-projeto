const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

const customers = [];

//Middleware
verifyIfExistsAccountCPF = (req, res, next) => {
  const { cpf } = req.headers;

  //Verifica se o CPF informado existe
  const customer = customers.find(c => c.cpf === cpf);

  //Se não encontrar o usuário retorna o erro com status 400
  if (!customer) {
    return res.status(400).send({ error: "Customer not found!" });
  }

  req.customer = customer;

  return next();
}

getBalance = (statement) => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.use(express.json());

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  //Verifica se o usuário já existe
  const customerAlreadyExists = customers.some(
    c => c.cpf === cpf
  );

  //Se o usuário já existir retorna o erro
  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  }

  //Insere o novo usuário no array
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  //Se der  certo retorna o status 201
  return res.status(201).send();
});

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: 'debit'
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  //Formatação para buscar o dia independente da hora
  const dateFormat = new Date(date + " 00:00");

  //Busca um statement com data de criação igual a data informada
  const statement = customer.statement.filter(
    statement => statement.createdAt.toDateString() === new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json(balance);
});

app.listen(3333);