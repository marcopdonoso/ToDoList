//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);

mongoose.connect("mongodb+srv://marcopdonoso:test123@cluster0.7xw6a4l.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDO list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      if(docs.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Succesfully saved default items to DB.");
          }
          res.redirect("/");
        });
        // res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: docs});
      }
    }
  });
});

app.get("/:customListTitle", function(req,res) {
  const customListTitle = _.capitalize(req.params.customListTitle);

  List.findOne({name: customListTitle}, function(err,doc) {
    if (err) {
      console.log(err);
    } else {
      if (doc) {
        //Show an existing list
        res.render("list", {listTitle: doc.name, newListItems: doc.items});
      } else {
        //Create a new list
        const list = new List({
          name: customListTitle,
          items: defaultItems
        });
        list.save(function(err, result) {
          res.redirect("/" + customListTitle);
        });
        // res.redirect("/" + customListTitle);
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save(function(err, result) {
      res.redirect("/");
    });
    // res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, doc) {
      doc.items.push(item);
      doc.save(function(err, result) {
        res.redirect("/" + listName);
      });
      // res.redirect("/" + listName);
    })
  }

  
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, doc) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(PORT, function() {
  console.log("Server started on port " + PORT);
});
