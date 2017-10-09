var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

//database connection
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "bamazon"
});

function managerAction() {
	inquirer
		.prompt([
			{
				type: 'list',
				name: 'option',
				message: 'Please select an option:',
				choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product'],
				filter: function (val) {
					if (val === 'View Products for Sale') {
						return 'sale';
					} else if (val === 'View Low Inventory') {
						return 'lowInventory';
					} else if (val === 'Add to Inventory') {
						return 'addInventory';
					} else if (val === 'Add New Product') {
						return 'newProduct';
					} else {
						console.log('ERROR: Unsupported operation!');
						exit(1);
					}
				}
			}
		])
		.then(function(input) {
			if (input.option ==='sale') {
				viewProducts();
			} else if (input.option === 'lowInventory') {
				viewLowInventory();
			} else if (input.option === 'addInventory') {
				addToInventory();
			} else if (input.option === 'newProduct') {
				addNewProduct();
			} else {
				console.log('ERROR: Unsupported operation!');
				exit(1);
			}
		})
}

function viewProducts() {
 	connection.query("select item_id, product_name, price, stock_quantity from products", function(err, res) {
		if (err) console.log(err);
		console.log("");
		console.log("Products for Sale")
		console.log("");

		var table = new Table({
			head: ["item_id", "product_name", "price", "stock_quantity"],
			style: {
				head: ["yellow"],
				compact: false,
				colAligns: ["center"]
			}
		});

		for (var i =0; i<res.length; i++) {
			table.push(
				[
					res[i].item_id, 
					res[i].product_name, 
					res[i].price,
					res[i].stock_quantity
				]
			);
		}
		
		console.log(table.toString());

		connection.end();
	});
};

function viewLowInventory() {
	connection.query("select * from products where stock_quantity < 100", function(err, res){
		if (err) console.log(err);
		console.log("");
		console.log("Items With Low Inventory");
		console.log("");

		var table = new Table({
			head: ["item_id", "product_name", "department_name", 'price', 'stock_quantity'],
			style: {
				head: ['yellow'],
				compact: false,
				colAligns: ['center'],
			}
		});

		for(var i=0; i<res.length; i++){
			table.push(
				[res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]
			);
		}

		console.log(table.toString());
		connection.end();
	})
};

function addToInventory() {
	inquirer
		.prompt([
			{
				name: "idInput",
				type: "input",
				message: "What ID of the product you would like to add stock?",
				filter: Number,
				validate: function(value) {
					if (isNaN(value) === false && parseInt(value) > 0) {
						return true;
					}
					return false;
				}
			},
			{
				name: "quantityInput",
				type: "input",
				message: "How many of the products do you want to add stock?",
				filter: Number,
				validate: function(value) {
					if (isNaN(value) === false && parseInt(value) > 0) {
						return true;
					}
					return false;
				}
			}
		])
		.then(function(answer) {
			var id = answer.idInput;
			var addQuantity = answer.quantityInput;

			var queryStr = "select * from products where ?";

			connection.query(queryStr, 
				{
					item_id: id
				},
				function(err, res){
					if (err) throw err;

					console.log("updating Inventory...................");

					var newQuantity = res[0].stock_quantity + addQuantity;

					connection.query("update products set ? where ?",
						[
							{
								stock_quantity: newQuantity
							},
							{
								item_id: id
							}
						], function(err, res) {
						if(err) throw err;

						console.log("update completed");

						connection.end();
					});
				}
			)
		})
};

function addNewProduct() {
	inquirer
		.prompt([
			{
				name: 'product_name',
				type: 'input',
				message: 'Please enter the new product name.'
			},
			{
				name: 'department_name',
				type: 'input',
				message: 'Which department does the new product belong to?'
			},
			{
				name: 'price',
				type: 'input',
				message: 'What is the price per unit?',
				filter: Number,
				validate: function(value) {
					if (isNaN(value) === false && parseInt(value) > 0) {
						return true;
					}
					return false;
				}
			},
			{
				name: 'stock_quantity',
				type: 'input',
				message: 'How many items are in stock?',
				filter: Number,
				validate: function(value) {
					if (isNaN(value) === false && parseInt(value) > 0) {
						return true;
					}
					return false;
				}
			}
		])
		.then(function(answer) {
			var table = new Table({
				head: ["product_name", "department_name", 'price', 'stock_quantity'],
				style: {
					head: ['yellow'],
					compact: false,
					colAligns: ['center'],
				}
			});

			table.push(
					[answer.product_name, answer.department_name, answer.price, answer.stock_quantity]
			);

			console.log("");
			console.log("New Item")
			console.log("");

			console.log(table.toString());
			
			var insertQueryStr = "insert into products set ?";

			connection.query(insertQueryStr, answer, function (err, res, fields) {
				if (err) throw err;

				console.log('New product has been added to the inventory under Item ID ' + res.insertId + '.');
				console.log("\n---------------------------------------------------------------------\n");

				// End the database connection
				connection.end();
			});
		})
};

managerAction();