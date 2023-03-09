// initialize node app
var express = require("express");
var app = express();
var supabase = require("@supabase/supabase-js");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var base64buffer = require("base64-arraybuffer");

const https = require("https");

// load classes.json as allObjectsAvailable
var fs = require("fs");
var allObjectsAvailable = fs.readFileSync("classes.json");
allObjectsAvailable = JSON.parse(allObjectsAvailable);

// set up supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey || !supabaseKey) {
    throw new Error("Please specify SUPABASE_URL and SUPABASE_KEY values in your environment.")
}

var supabase = supabase.createClient(supabaseUrl, supabaseKey);

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "100mb" }));

function getRandomIndices(listOfObjects, counter = 5) {
  var randomIndices = [];
  for (var i = 0; i < counter; i++) {
    if (listOfObjects.length == 0) {
      break;
    }
    var randomIndex = Math.floor(Math.random() * listOfObjects.length);

    if (listOfObjects[randomIndex] == undefined) {
      randomIndex = Math.floor(Math.random() * listOfObjects.length);
    }
    randomIndices.push(listOfObjects[randomIndex]);
    listOfObjects.splice(randomIndex, 1);
  }
  return randomIndices;
}

function assignObjects(found_classes) {
  // remove found classes from allObjectsAvailable
  var tier1 = allObjectsAvailable.tier1;
  var tier2 = allObjectsAvailable.tier2;
  var tier3 = allObjectsAvailable.tier3;

  // remove found classes from allObjectsAvailable
  var tier1 = tier1.filter(function (el) {
    return !found_classes.includes(el);
  });
  var tier2 = tier2.filter(function (el) {
    return !found_classes.includes(el);
  });
  var tier3 = tier3.filter(function (el) {
    return !found_classes.includes(el);
  });

  var found_classes_count = 0;

  var tiers = [tier1, tier2, tier3];
  var classes_to_return = [];

  for (var i = 0; i < tiers.length; i++) {
    if (tiers[i].length > 0) {
      var classes = getRandomIndices(tiers[i], 5 - found_classes_count);

      // remove undefined
      classes = classes.filter(function (el) {
        return el != undefined;
      });

      if (classes.length == 5) {
        return classes;
      }

      classes_to_return = classes_to_return.concat(classes);

      found_classes_count += classes.length;
    }
  }

  return classes_to_return;
}

app.post("/username", function (req, res) {
  // set username in Supabase Users table
  var username = req.body.uname;
  // if username taken, add random 3 numbers to end
  supabase
    .from("Signups")
    .select("*")
    .eq("username", username)
    .then(({ data, error }) => {
      if (data.length > 0) {
        username += "-" + Math.floor(Math.random() * 1000);
      }
    });
  supabase
    .from("Signups")
    .update({ username: username })
    .eq("user_id", req.cookies.user_id)
    .then(({ data, error }) => {
      res.cookie("username", username);
      res.redirect("/leaderboard");
    });
});

async function addInitialItems (data) {
    await addInitialItems1(data);
}

async function addInitialItems1 (data) {
    var randomObjects = getRandomIndices(
        allObjectsAvailable["tier1"],
        4
      );

      var items_to_add = [{
        user_id: data.user.id,
        item_name: "friend",
        found: false,
        order: i + 1,
        batch_completed: false,
      }];

      // insert into Lists
      for (var i = 0; i < randomObjects.length; i++) {
        items_to_add.push({
          user_id: data.user.id,
          item_name: randomObjects[i],
          found: false,
          order: i + 1,
          batch_completed: false,
        });
      }

      supabase
        .from("Lists")
        .insert(items_to_add)
        .then(({ data, error }) => {
          return;
        });
}

app.post("/register", async (req, res) => {
  var email = req.body.email_create;
  var password = req.body.create_pw;

  // check if account exists
  supabase
    .from("Signups")
    .select("*")
    .eq("email", email)
    .then(({ data, error }) => {
        console.log(error)
      if (data.length > 0) {
        res.render("entry", {
          user: null,
          error: "An account with this email already exists",
          scavenger_list: [],
        });
      } else {
        supabase.auth
          .signUp({
            email: email,
            password: password,
            data: {
              username: null,
            },
          })
          .then(({ data, error }) => {
            if (error) {
              res.render("entry", { user: null, error: error.message });
              res.send();
            } else {
              // make sure user isn't created
              // insert into Signups table

              supabase
                .from("Signups")
                .insert([
                  {
                    user_id: data.user.id,
                    email: email,
                    objects_identified: 0,
                  },
                ])
                .then(({ data, error }) => {
                  return;
                });
              if (error) {
                res.render("index", { user: null, error: error.message });
                res.send();
              } else {
                res.cookie("start_time", new Date().getTime());
                // assign objects
                addInitialItems(data);

                res.cookie("user_id", data.user.id);
                res.cookie("user_email", data.user.email);
                res.cookie("new_user", true);
                res.redirect("/");
              }
            }
          });
      }
    });
});

app.post("/login", async function (req, res) {
  var email = req.body.email;
  var password = req.body.pw;

  await supabase.auth
    .signInWithPassword({
      email: email,
      password: password,
    })
    .then(({ data, error }) => {
      if (error) {
        res.render("entry", {
          user: null,
          error: error.message,
          scavenger_list: [],
        });
        res.send();
      } else {
        res.cookie("user_id", data.user.id);
        res.cookie("user_email", data.user.email);
        res.redirect("/");
      }
    });
});

app.get("/logout", function (req, res) {
  res.clearCookie("user_id");
  res.clearCookie("user_email");
  res.redirect("/");
});

app.get("/leaderboard", function (req, res) {
  // get all users if time_taken not null
  supabase
    .from("Signups")
    .select("*")
    .order("objects_identified", { ascending: true })
    .then(({ data, error }) => {
      if (error) {
        res.render("user_leaderboard", {
          error: error.message,
          leaderboard: [],
          user: req.cookies.user_email,
          scavenger_list: [],
          username: req.cookies.username || "",
          email: req.cookies.user_email || "",
        });
      } else {
        var leaderboard = data;

        var user_in_leaderboard = data.filter(function (user) {
          return user.username == req.cookies.username;
        });

        // sort leaderboard by objects_identified, descending
        leaderboard.sort(function (a, b) {
            return a.objects_identified - b.objects_identified;
        });

        var leaderboard = leaderboard.reverse()
        

        res.render("user_leaderboard", {
          error: null,
          leaderboard: leaderboard,
          user: req.cookies.user_email,
          scavenger_list: [],
          user_in_leaderboard: user_in_leaderboard,
          time_taken: req.cookies.start_time,
          username: req.cookies.username,
          objects_identified: req.cookies.objects_identified,
          username: req.cookies.username || "",
          email: req.cookies.user_email || "",
        });
      }
    });
});

async function update_batch (user_id) {
    console.log("updating batch")
    await supabase
    .from("Lists")
    .update({ batch_completed: true })
    .eq("user_id", user_id);
}

app.post("/found", async (req, res) => {
  var object_name = req.body.object;
  var user_id = req.cookies.user_id;

  // update user object list
  await update_batch(req.cookies.user_id);
  supabase
    .from("Lists")
    .update({ found: true, batch_completed: true })
    .eq("user_id", user_id)
    .eq("item_name", object_name)
    .then(({ parent_data, error }) => {
      // get count of remaining objects
      supabase
        .from("Lists")
        .select("*")
        .eq("user_id", user_id)
        .then(({ data, error }) => {
          // data = data.length;
          var found_classes = data.filter(function (object) {
            return object.found == false;
          });
          var count_found_classes = data.filter(function (object) {
            return object.found == true;
          }).length;

          supabase
          .from("Signups")
          .update({ objects_identified: count_found_classes })
          .eq("user_id", user_id)
          .then(({ data, error }) => {
            if (error) {
              console.log(error);
            }
            console.log("updated signups");
          });
        });
    });

  supabase
    .from("Lists")
    .select("*")
    .eq("user_id", user_id)
    .then(({ data, error }) => {
        var found_classes = data.filter(function (object) {
            return object.found == false;
        });
        supabase
            .from("Lists")
            .select("*")
            .eq("user_id", user_id)
            .then(({ data, error }) => {
                insertObjects(data, req, found_classes, object_name);
                res.body = { error: null };
                res.send();
            }
            );
    });
});

async function insertObjects (data, req, found_classes, last_found, override = false) {
    var found_class_labels = data.filter(function (object) {
        return object.found == true;
    }).map(function (object) {
        return object.item_name;
    });

    if ((found_classes.length < 2 && !found_class_labels.includes(last_found)) || found_classes.length == 0 || override) {
        var found_classes = data.filter(function (object) {
          return object.found == true;
        });

        // get list of object names from found classes
        var found_classes_names = found_classes.map(function (object) {
          return object.item_name;
        });

        console.log("found classes names");

        console.log(found_classes_names);

        var remainingObjectsAvailable = assignObjects(found_classes_names);

        var items_to_add = [];

        // insert into Lists
        for (var i = 0; i < remainingObjectsAvailable.length; i++) {
          items_to_add.push({
            user_id: req.cookies.user_id,
            item_name: remainingObjectsAvailable[i],
            found: false,
            order: i,
            batch_completed: false,
          });
        }

        await supabase
          .from("Lists")
          .insert(items_to_add);
      }
    return;
}

app.get("/", function (req, res) {
  if (req.cookies && req.cookies.user_email) {
    res.redirect("/play");
  } else {
    res.render("entry", { user: null, error: null });
  }
});

app.get("/play", function (req, res) {
  if (req.cookies && req.cookies.user_email) {
    var start_time = req.cookies.start_time;
    supabase
      .from("Lists")
      .select("*")
      .eq("user_id", req.cookies.user_id)
      .then(({ data, error }) => {
        var found_all = data.every(function (item) {
          return item.found;
        });
        var batch_completed_count = data.every(function (item) {
            return item.batch_completed;
        });

        // if user has found all objects but less than 25, assign new ones

        if (batch_completed_count && data.length < 25) {
            console.log("found all, assigning new objects");
            insertObjects(data, req, data, null, true);
            res.clearCookie("new_user");
        }
        var found_any = data.some(function (item) {
          return item.found && !item.batch_completed;
        });

        var objects_identified = data.filter(function (item) {
          return item.found;
        });

        var new_user = req.cookies.new_user || false;

        var level = 1;

        // if any object is in tier2, say level 2
        for (var i = 0; i < objects_identified.length; i++) {
            if (allObjectsAvailable.tier2.includes(objects_identified[i].item_name)) {
                level = 2;
            } else if (allObjectsAvailable.tier3.includes(objects_identified[i].item_name)) {
                level = 3;
            }
        }

        var objects_identified = objects_identified.length;

        var raffle_tickets_won = Math.floor(objects_identified / 5);

        res.render("index", {
          user: req.cookies.user_email,
          error: null,
          scavenger_list: data,
          found_all: found_all,
          found_any: found_any,
          start_time: start_time,
          username: req.cookies.username || "",
          objects_identified: objects_identified,
          raffle_tickets_won: raffle_tickets_won,
          level: level,
          new_user: new_user
        });
      });
  } else {
    res.redirect("/");
  }
});

app.get("/rules", function (req, res) {
  res.render("rules", { user: req.cookies.user_email, error: null });
});

app.get("/terms", function (req, res) {
  res.render("terms", { user: req.cookies.user_email, error: null });
});

app.get("/offline", function (req, res) {
    res.render("offline", { user: req.cookies.user_email, error: null });
});

app.get("/offline.html", function (req, res) {
    res.render("offline", { user: req.cookies.user_email, error: null });
});

// start server
var port = process.env.PORT || 8087;

if (process.env.PROD) {
    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
} else {
    console.log('Listening on ' + port);
    https.createServer({
        key: fs.readFileSync('/Users/james/localhost-key.pem'),
        cert: fs.readFileSync('/Users/james/localhost.pem')
    }, app).listen(port);
}
