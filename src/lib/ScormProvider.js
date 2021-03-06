import React, { Component } from 'react';
import { SCORM, debug } from 'pipwerks-scorm-api-wrapper';
import PropTypes from 'prop-types';
import moment from "moment";

export const ScoContext = React.createContext({
  isInLMSContext: false,
  apiConnected: false,
  learnerName: '',
  completionStatus: 'incomplete',
  suspendData: {},
  scormVersion: '',
  getSuspendData: () => { },
  setSuspendData: () => { },
  setStatus: () => { },
  set: () => { },
  get: () => { },
  setScore: () => { }
});

class ScormProvider extends Component {
  constructor(props) {
    super(props);

    console.log('ScormProvider constructor called!');

    // bind class methods as needed
    this.getSuspendData = this.getSuspendData.bind(this);
    this.setSuspendData = this.setSuspendData.bind(this);
    this.setStatus = this.setStatus.bind(this);
    this.createScormAPIConnection = this.createScormAPIConnection.bind(this);
    this.closeScormAPIConnection = this.closeScormAPIConnection.bind(this);
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);

    // define state, including methods to be passed to context consumers
    // this entire state will be passed as 'sco' to consumers
    this.state = {
      isInLMSContext: false,
      apiConnected: false,
      learnerName: '',
      completionStatus: 'incomplete',
      suspendData: {},
      scormVersion: '',
      getSuspendData: this.getSuspendData,
      setSuspendData: this.setSuspendData,
      setStatus: this.setStatus,
      set: this.set,
      get: this.get,
      startTime: null
    };
  }

  componentDidMount() {
    console.log('ScormProvider componentDidMount called!');
    this.createScormAPIConnection();
    window.addEventListener("beforeunload", this.closeScormAPIConnection);
  }

  componentWillUnmount() {
    console.log('ScormProvider componentWillUnmount called!');
    this.closeScormAPIConnection();
    window.removeEventListener("beforeunload", this.closeScormAPIConnection);
  }

  createScormAPIConnection() {
    console.log('ScormProvider createScormAPIConnection method called!');
    if (this.state.apiConnected) return;

    if (this.props.version) SCORM.version = this.props.version;
    if (typeof this.props.debug === "boolean") debug.isActive = this.props.debug;
    const scorm = SCORM.init();
    this.setState({
      startTime: new Date()
    });
    if (scorm) {
      const version = SCORM.version;
      const learnerName = version === '1.2' ? SCORM.get('cmi.core.student_name') : SCORM.get('cmi.learner_name');
      const completionStatus = SCORM.status('get');

      this.setState({
        isInLMSContext: true,
        apiConnected: true,
        learnerName: learnerName,
        completionStatus: completionStatus,
        scormVersion: version
      }, () => {
        this.initScoreRange();
        this.getSuspendData();
      });
    } else {
      this.setState({
        isInLMSContext: false,
        apiConnected: true,
        learnerName: localStorage.getItem("learnerName"),
        completionStatus: localStorage.getItem("completionStatus")
      }, () => {
        this.initScoreRange();
        this.getSuspendData();
      });
      // could not create the SCORM API connection
      console.log("ScormProvider is not in a LMS : it will be using local storage");

    }
  }

  closeScormAPIConnection() {
    console.log('ScormProvider closeScormAPIConnection method called!');
    if (!this.state.apiConnected) return;
    const duration = moment(new Date().getTime() - this.state.startTime.getTime());
    if (this.state.isInLMSContext) {
      this.setSuspendData();
      SCORM.status('set', this.state.completionStatus);
      SCORM.save();
      if (this.state.version === "1.2") {
        this.set("cmi.core.session_time", duration.format(`${Math.floor(duration / 3600000)}:MM:SS.SS`));
      } else {
        this.set("cmi.session_time", Math.floor(duration / 1000));
      }
      const success = SCORM.quit();
      if (success) {
        this.setState({
          apiConnected: false,
          learnerName: '',
          completionStatus: 'incomplete',
          suspendData: {},
          scormVersion: ''
        });
      } else {
        // could not close the SCORM API connection
        console.log("ScormProvider error: could not close the API connection");
      }
    } else {
      this.setSuspendData();
      localStorage.setItem("completionStatus", this.state.completionStatus);
      localStorage.setItem("sessionTime", duration);
      this.setState({
        isInLMSContext: false,
        apiConnected: false,
        learnerName: "",
        completionStatus: "incomplete",
        suspendData: {},
        scormVersion: ''

      });
    }
  }

  initScoreRange = () => {
    if (!this.state.apiConnected) return;
    if (this.state.isInLMSContext) {
      if (this.state.version === "1.2") {
        this.set("cmi.core.score.min", 0);
        this.set("cmi.core.score.max", 100);
      } else {
        this.set("cmi.score.min", 0);
        this.set("cmi.score.max", 100);
      }
    } else {
      localStorage.setItem("score.min", 0);
      localStorage.setItem("score.max", 100);
    }
  }


  getSuspendData() {
    if (!this.state.apiConnected) return;
    if (this.state.isInLMSContext) {
      const data = SCORM.get('cmi.suspend_data');
      const suspendData = data && data.length > 0 ? JSON.parse(data) : {};
      this.setState({
        suspendData
      });
    } else {
      this.setState({
        suspendData: JSON.parse(localStorage.getItem("suspendData"))
      })
    }


  }

  setSuspendData(key, val) {
    if (!this.state.apiConnected) return;
    if (this.state.isInLMSContext) {
      const currentData = { ...this.state.suspendData } || {};
      if (key && val) currentData[key] = val;
      const success = SCORM.set('cmi.suspend_data', JSON.stringify(currentData));
      if (success) {
        this.setState({
          suspendData: currentData
        }, () => {
          SCORM.save();
        });
      } else {
        // error setting suspend data
        console.log("ScormProvider setStatus error: could not set the suspend data provided");
      }
    } else {
      const currentData = { ... this.state.suspendData } || {};
      if (key && val) currentData[key] = val;
      localStorage.setItem("suspendData", JSON.stringify(currentData));
      this.setState({
        suspendData: currentData
      })
    }
  }

  setStatus(status) {
    if (!this.state.apiConnected) return;

    const validStatuses = ["passed", "completed", "failed", "incomplete", "browsed", "not attempted"];
    if (validStatuses.includes(status)) {
      if (this.state.isInLMSContext) {
        const success = SCORM.status("set", status);
        if (success) {
          this.setState({
            completionStatus: status
          }, () => {
            SCORM.save();
          });
        }
      } else {
        localStorage.setItem("completionStatus", status);
        this.setState({
          completionStatus: status
        });
      }
    } else {
      // error setting status
      console.log("ScormProvider setStatus error: could not set the status provided");
    }
  }

  setScore = (score) => {
    if (!this.state.apiConnected) return;
    if (this.state.isInLMSContext) {
      if (this.state.version === "1.2") {
        this.set("cmi.core.score.raw", score);
      } else {
        this.set("cmi.score.raw", score);
      }
    } else {
      localStorage.setItem("score.raw", score);
    }
  }

  set(param, val) {
    if (!this.state.apiConnected) return;
    if (this.state.isInLMSContext) {
      let success = SCORM.set(param, val);
      if (success) {
        SCORM.save();
      } else {
        // error setting value
        console.log("ScormProvider set error: could not set:", param, val);
      }
    } else {
      localStorage.setItem(param, val);
    }

  }

  get(param) {
    if (!this.state.apiConnected) return;
    if (this.state.isInLMSContext) {
      return SCORM.get(param);
    } else {
      return localStorage.getItem(param);
    }
  }

  render() {
    return (
      <ScoContext.Provider value={this.state}>
        {this.props.children}
      </ScoContext.Provider>
    );
  }
}

ScormProvider.propTypes = {
  version: PropTypes.bool,
  debug: PropTypes.bool,
}

export default ScormProvider;