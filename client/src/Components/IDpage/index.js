import React, { Component } from "react";
// import React, { Component, Fragment } from "react";
import image2base64 from "image-to-base64";
import Loader from "react-loader-spinner";
import axios from "axios";
import cheerio from "cheerio";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import "./style.css";
import decode from "jwt-decode";
import API from "../../utils/API";
import KEYS from "../../utils/KEYS";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import swal from "sweetalert";

const KEY = KEYS.PLANT_ID_KEY;
let b64Str;
let body = {};
let IMGURKEY = KEYS.IMGUR_KEY;

axios.defaults.headers.post["Content-Type"] = "application/json";

const styles = {
  Paper: {
    marginRight: 75,
    marginLeft: 75,
    marginBottom: 50,
    marginTop: 100,
    paddingBottom: 50
  }
};

class IDpage extends Component {
  state = {
    selectedFile: null,
    uploadedFileLink: "",
    waitingForData: false,
    isIdentified: false,
    isScraped: false,
    plantObj: {},
    suggestions: {},
    userID: null,
    plantName: null,
    fileName: ""
  };

  componentDidMount() {
    const { id } = decode(localStorage.getItem("x-auth-token"));
    this.setState({ userID: id });
  }

  identify(t) {
    var self = t;
    self.setState({ waitingForData: true });
    image2base64(self.state.uploadedFileLink)
      .then(response => {
        b64Str = response;
        body = {
          key: KEY,
          usage_info: true,
          images: [b64Str]
        };
        // initial request to plant.id
        axios
          .post(
            "https://cors-anywhere.herokuapp.com/https://api.plant.id/identify",
            body
          )
          .then(response => {
            body = {
              key: KEY,
              ids: [response.data.id]
            };
            console.log(response.data.usage_info);
            // call method to listen for identification
            this.checkId(body);
          });
      })
      .catch(error => {
        console.log(error);
      });
  }

  confirmSuggestion = plantName => {
    console.log("scrape plantName: ", plantName);
    this.setState({ plantName });
    var searchTerm = plantName.toLowerCase().split(" ");
    console.log(searchTerm[0]);
    this.scrape(searchTerm[0], plantName.toLowerCase());
  };

  scrape = (searchTerm, plantName) => {
    let plantRaw = [];
    let plantURL;
    let plantInfo = {};
    var self = this;
    this.setState({ waitingForData: true });
    console.log("Scrape started");

    axios
      .get(
        `https://cors-anywhere.herokuapp.com/https://garden.org/plants/search/text/?q=${searchTerm}`
      )
      .then(response => {
        console.log("response from garden.org");
        var $ = cheerio.load(response.data);

        $(".pretty-table a").each(function(i, element) {
          if (
            $(this)
              .text()
              .toLowerCase()
              .endsWith(`(${plantName})`) ||
            $(this)
              .text()
              .toLowerCase()
              .endsWith(`${plantName}`)
          ) {
            plantURL = $(this).attr("href");

            axios
              .get(
                `https://cors-anywhere.herokuapp.com/https://garden.org${plantURL}`
              )
              .then(response => {
                console.log("we are here");
                var $ = cheerio.load(response.data);

                $(".simple-table td").each(function(i, element) {
                  plantRaw.push($(this).text());
                });

                for (i = 0; i < plantRaw.length; i++) {
                  if (plantRaw[i].endsWith(":")) {
                    plantInfo[i] = {
                      header: plantRaw[i],
                      info: plantRaw[i + 1]
                    };
                  }
                }

                console.log(plantInfo);
                self.setState({ plantObj: plantInfo });
                self.setState({ isScraped: true });

                API.addUserPlant({
                  owner: self.state.userID,
                  name: self.state.plantName,
                  url: self.state.uploadedFileLink,
                  plantInfo
                });
                self.setState({ waitingForData: false });
                function sweetAlert() {
                  swal("", "Plant has been added to your garden!!", "success");
                }
                sweetAlert();
              });
          }
        });
      });
  };

  checkId = body => {
    this.setState({ waitingForData: true });
    axios
      .post(
        "https://cors-anywhere.herokuapp.com/https://api.plant.id/check_identifications",
        body
      )
      .then(response => {
        if (response.data[0].suggestions.length > 0) {
          this.setState({ suggestions: response.data[0].suggestions });
          this.setState({ isIdentified: true });
          //console.log(response.data[0]);
          this.setState({ waitingForData: false });
          // this.scrape(this.state.suggestions[0].plant.name.toLowerCase())
        } else {
          console.log("suggestions not ready yet for id: " + body.ids);
          console.log("trying again....");
          this.checkId(body);
        }
      });
  };
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  fileChangedHandler = event => {
    if (event.target.files[0] !== undefined) {
      this.setState({ selectedFile: event.target.files[0] });
    } else {
      this.setState({ fileName: "Choose A File" });
    }

    if (event.target.files[0] !== undefined) {
      var filesName = event.target.files[0].name;
      if (filesName.length > 13) {
        var shortened = filesName.substr(0, 13) + "...";
        this.setState({ fileName: shortened });
      } else {
        this.setState({ fileName: filesName });
      }
    }
  };

  uploadHandler = () => {
    this.setState({ suggestions: "" });
    this.setState({ waitingForData: true });
    var headers = {
      "Content-Type": "application/json",
      Authorization: `Client-ID ${IMGURKEY}`,
      "Access-Control-Allow-Origin": "*"
    };
    var formData = new FormData();
    formData.append("image", this.state.selectedFile);
    axios
      .post(
        "https://cors-anywhere.herokuapp.com/https://api.imgur.com/3/upload",
        formData,
        {
          headers: headers
        }
      )
      .then(response => {
        this.setState({ uploadedFileLink: response.data.data.link });
        //this.setState({ waitingForData: false });
        this.identify(this);
        // this.scrape("oxalis", "oxalis corniculata");
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    var self = this;
    return (
      <div>
        <div>
          <div className="splashImg2">
            {/* <img className="splashImg2" src={Banner2} alt="splashImg2" /> */}
          </div>
          <div className="bodyId">
            <Grid container>
              <Grid item sm={2} />
              <Grid item sm={8}>
                <Paper style={styles.Paper}>
                  <div className="input-back">
                    <h1 className="id-title">Identify Your Plant</h1>
                    {this.state.isIdentified ? (
                      <>
                        {this.state.isScraped ? (
                          <>
                            <Button
                              variant="contained"
                              className="upload"
                              href="/id"
                              color="primary"
                            >
                              Identify Another Plant!
                            </Button>
                            <Button
                              variant="contained"
                              className="upload"
                              href="/manage"
                              color="primary"
                            >
                              Check Out My Garden!
                            </Button>
                          </>
                        ) : (
                          <>
                            <p>
                              Click on the correct plant to confirm it and add
                              to your garden!
                            </p>
                            <List component="nav">
                              {this.state.suggestions.length > 0 &&
                                this.state.suggestions.map(function(
                                  suggestion,
                                  i
                                ) {
                                  return (
                                    <>
                                      <ListItem
                                        key={i}
                                        button
                                        divider
                                        onClick={() =>
                                          self.confirmSuggestion(
                                            suggestion.plant.name
                                          )
                                        }
                                      >
                                        <ListItemText
                                          primary={suggestion.plant.name}
                                          secondary={
                                            "Probability: " +
                                            Math.round(
                                              suggestion.probability * 100
                                            ) +
                                            "%"
                                          }
                                        />
                                      </ListItem>
                                    </>
                                  );
                                })}
                            </List>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {this.state.waitingForData ? (
                          <Loader
                            type="Oval"
                            color="#397547"
                            height="100"
                            width="100"
                          />
                        ) : (
                          <>
                            {this.state.uploadedFileLink.length > 0 ? (
                              <>
                                <img
                                  className="user-image"
                                  alt="user uploaded"
                                  src={this.state.uploadedFileLink}
                                />
                                <br />
                                <Button
                                  variant="contained"
                                  color="primary"
                                  className="upload"
                                  onClick={() => this.identify(this)}
                                >
                                  Identify!
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="file-input-wrapper">
                                  <button className="btn-file-input">
                                    {this.state.fileName ? (
                                      <>{this.state.fileName}</>
                                    ) : (
                                      "Choose A File"
                                    )}
                                  </button>
                                  <input
                                    type="file"
                                    name="file"
                                    accept="image/*"
                                    onChange={this.fileChangedHandler}
                                  />
                                </div>

                                <br />
                                <h4 className="sub-tag">
                                  Let's upload your plant!
                                </h4>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  className="upload"
                                  onClick={this.uploadHandler}
                                  disabled={!this.state.selectedFile}
                                >
                                  <i className="fas fa-upload" />{" "}
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </Paper>
              </Grid>
              <Grid item sm={2} />
            </Grid>
          </div>
        </div>
      </div>
    );
  }
}

export default IDpage;
