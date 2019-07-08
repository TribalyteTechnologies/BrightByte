var loki = require("lokijs");
var express = require("express");

const COLLECTION_NAME = "users";

var db = new loki("db.json");
var app = express();
var users;
loadCollection();

function loadCollection() {
  db.loadDatabase({}, function () {
    users = db.getCollection(COLLECTION_NAME);
    if (!users) {
      users = db.addCollection(COLLECTION_NAME);
      db.saveDatabase();
    }
  });
}

function createUser(userIdentifier) {
  let user = users.insert({
    name: userIdentifier,
    commitNumber: 0,
    reviewNumber: 0
  });
  if (user != null) {
    try {
      users.update(user);
    } catch (err) {
      return null;
    }
  }
  return user;
}

function hasUser(userIdentifier) {
  let user = users.findOne({
    name: userIdentifier
  });
  if (user != "" && user != null) {
    return true;
  }
  else {
    return false;
  }
}

function getCommitNumber(userIdentifier) {
  let user = users.findOne({
    name: userIdentifier
  });
  if (user != "" && user != null) {
    return user.commitNumber;
  }
  else {
    return null;
  }
}

function setCommitNumber(userIdentifier, num) {
  let user = users.findOne({
    name: userIdentifier
  });
  if (user != "" && user != null) {
    user.commitNumber = num;
    try {
      users.update(user);
    } catch (err) {
      return false;
    }
  }
  else {
    user = createUser(userIdentifier);
    user.commitNumber = num;
    try {
      users.update(user);
    } catch (err) {
      return false;
    }
  }
  return true;
}

function getReviewNumber(userIdentifier) {
  let user = users.findOne({
    name: userIdentifier
  });
  if (user != "" && user != null) {
    return user.reviewNumber;
  }
  else {
    return null;
  }
}

function setReviewNumber(userIdentifier, num) {
  let user = users.findOne({
    name: userIdentifier
  });
  if (user != "" && user != null) {
    user.reviewNumber = num;
    try {
      users.update(user);
    } catch (err) {
      return false;
    }
  }
  else {
    user = createUser(userIdentifier);
    user.commitNumber = num;
    try {
      users.update(user);
    } catch (err) {
      return false;
    }
  }
  return true;
}

app.get("/commits/:userIdentifier", function (req, res) {
  let response = getCommitNumber(req.params.userIdentifier);
  if (response != null) {
    res.send(response.toString());
  }
  else {
    res.sendStatus(404);
  }
});

app.get("/reviews/:userIdentifier", function (req, res) {
  let response = getReviewNumber(req.params.userIdentifier);
  if (response != null) {
    res.send(response.toString());
  }
  else {
    res.sendStatus(404);
  }
});

app.post("/commits/:userIdentifier/:count", function (req, res) {
  let response = setCommitNumber(req.params.userIdentifier, req.params.count)
  if (response != null) {
    db.saveDatabase();
    res.sendStatus(200);
  }
  else {
    res.sendStatus(404);
  }
});

app.post("/reviews/:userIdentifier/:count", function (req, res) {
  let response = setReviewNumber(req.params.userIdentifier, req.params.count)
  if (response != null) {
    db.saveDatabase();
    res.sendStatus(200);
  }
  else {
    res.sendStatus(404);
  }
});

app.post("/users/:userIdentifier", function (req, res) {
  if (!hasUser(req.params.userIdentifier)) {
    let response = createUser(req.params.userIdentifier);
    if (response != null) {
      db.saveDatabase();
      res.sendStatus(200);
    }
    else {
      res.sendStatus(404);
    }
  }
  else {
    res.sendStatus(401);
  }
});

app.listen(3000, function () {
  console.log("Listening on 3000...");
});