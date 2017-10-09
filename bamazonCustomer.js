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

connection.connect(function(err) {
	if(err) throw err;
	initDisplay();
});

function initDisplay() {
	connection.query("select item_id, product_name,  price from products", function(err, res) {
		if (err) console.log(err);

		var table = new Table({
			head: ["item_id", "product_name", "price", ],
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
				]
			);
		}

		console.log(table.toString());
		
		runSearch();
	});
};

function runSearch() {
	inquirer
		.prompt([
		{
			name: "idInput",
			type: "input",
			message: "What ID of the product you would like to buy?",
			filter: Number,
			validate: function(value) {
				if (isNaN(value) === false && parseInt(value) > 0 && parseInt(value) <=10) {
					return true;
				}
				return false;
			}
		},
		{
			name: "quantityInput",
			type: "input",
			message: "How many units of the product you would like to buy?",
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
			var quantityInput = answer.quantityInput;

			quantityCheck(id, quantityInput);
			
		});
};

function quantityCheck(id, quantityInput) {
	
	var quantityCheck = "select stock_quantity from products where item_id =" + id;
	
	connection.query(quantityCheck, function(err,res) {
		
		var currentQuantity = res[0].stock_quantity;
	
		if (quantityInput <= currentQuantity){
			console.log("Order has been placed");
			
			placeOrder(id, quantityInput, currentQuantity);

		} else {
			return console.log("Insufficient quantity!");
		}
	});
};

function placeOrder(id, quantityInput, currertQuantity) {
	var priceCheck = "select price from products where item_id =" + id;
	connection.query(priceCheck, function(err, res){
		var unitPrice = res[0].price;
		var orderPrice = unitPrice * quantityInput;
		console.log("Total: $" + orderPrice);

		updateQuantity(id, quantityInput, currertQuantity);
	});

};

function updateQuantity(id, quantityInput, currentQuantity) {
	var newQuantity = currentQuantity - quantityInput;
	// var quantityUpdate = "Update products SET stock_quantity = " + newQuantity + "where item_id = " + id
	
	connection.query("Update products Set ? Where ?",
		[
			{
				stock_quantity: newQuantity
			},
			{
				item_id: id
			}
		], function(err, res) {
			console.log("products quantity updated!\n");
			console.log("Thank you for shopping with us!");
			connection.end();
		});
};


