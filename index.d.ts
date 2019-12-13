declare module "react-scorm-provider" {
  type Version = "1.2" | "2004";

  type Status =
    | "passed"
    | "completed"
    | "failed"
    | "incomplete"
    | "browsed"
    | "not attempted";

  // TODO: Need to finish this
  type WritableValue = "session_time";

  // TODO: Need to finish this
  type ReadableValue = "score.max";

  export type ScormProviderProps = {
    version: Version;
    debug?: boolean;
  };

  export default class ScormProvider extends React.PureComponent<ScormProviderProps> {}

  export type WithScormProps = {
    sco: {
      apiConnected: boolean;
      learnerName: string;
      completionStatus: Status;
      suspendData: object;
      scormVersion: version;
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
    };
  };

  export const withScorm = () => (component: React.FunctionComponent | React.IWrappedComponent) => component;

}
