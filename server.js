const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
// const cors = require("cors");
//const routes = require("./routes");

const app = express();
// app.use(cors());
//Express Body Parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//DB Mongo Atlas Config
const db = config.get("mongoURI");

//Connect to Mongo
mongoose
	.connect(db, { useNewUrlParser: true, useCreateIndex: true })
	.then(() => console.log("Connected to Mongo"))
	.catch(err => console.log(err));

//Routes
app.use("/api/users", require("./routes/api/users"));
// app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/test", require("./routes/api/test"));
// app.use(routes);

//Port
const port = process.env.PORT || 3001;

app.listen(port, () => console.log(`Server started on Port ${port}`));
