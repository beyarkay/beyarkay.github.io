import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import copy from "clipboard-copy";
import * as React from "react";

interface ChildProps {
  copy: (content: any) => void;
}

interface Props {
  TooltipProps?: Partial<TooltipProps>;
  children: (props: ChildProps) => React.ReactElement<any>;
}

interface OwnState {
  showTooltip: boolean;
}

// https://dev.to/kamranayub/copying-to-the-clipboard-using-react-typescript-material-ui-4fdb
class CopyToClipboard extends React.Component<Props, OwnState> {
  public state: OwnState = { showTooltip: false };

  public render() {
    return (
      <Tooltip
        open={this.state.showTooltip}
        title={"Copied to clipboard!"}
        leaveDelay={1500}
        onClose={this.handleOnTooltipClose}
        {...this.props.TooltipProps || {}}
      >
        {this.props.children({ copy: this.onCopy }) as React.ReactElement<any>}
      </Tooltip>
    );
  }

  private onCopy = (content: any) => {
    copy(content);
    this.setState({ showTooltip: true });
  };

  private handleOnTooltipClose = () => {
    this.setState({ showTooltip: false });
  };
}

export default CopyToClipboard;

