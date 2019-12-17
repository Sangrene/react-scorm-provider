
export type Version = "1.2" | "2004";

export type Status =
  | "passed"
  | "completed"
  | "failed"
  | "incomplete"
  | "browsed"
  | "not attempted";

// TODO: Need to finish this
export type WritableValue = "session_time";

// TODO: Need to finish this
export type ReadableValue = "score.max";

export type ScormProviderProps = {
  version?: Version;
  debug?: boolean;
};

declare const ScormProvider: React.ComponentClass<ScormProviderProps>;
export default ScormProvider;


export type WithScormProps = {
  sco: {
    apiConnected: boolean;
    learnerName: string;
    completionStatus: Status;
    suspendData: any;
    scormVersion: Version;
    /**
     * Update suspendData prop but doesn't return anything.
     */
    getSuspendData: () => void;
    /**
     * Add this tuple to suspend data.
     */
    setSuspendData: (key: string, value: any) => void;

    setStatus: (status: Status) => void;

    /**
     * Set SCORM value, see https://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/ for references.
     */
    set: (key: WritableValue, value: string | number) => void;

    get: (key: ReadableValue) => string;

    /**
     * Set the score in percentage of validation
     */
    setScore: (score: number) => void;
  };
};

export declare const withScorm: <T extends
  | React.FunctionComponent<any>
  | React.ComponentClass<any>
  | React.ClassicComponent<any>>() => (component: T) => T;
